package app.cleanframe.tv;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigInteger;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.Principal;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

import javax.net.ssl.KeyManager;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509KeyManager;
import javax.net.ssl.X509TrustManager;

/**
 * The phone remote in every app on Android 12: Shore talks to the TV's own Android TV Remote service
 * (com.google.android.tv.remote.service, the one the Google TV phone app uses) over loopback.
 * Pairing happens once: the TV shows a six-character code that is typed in the phone companion.
 * After that, presses arrive as real remote keys in whichever app is in front.
 * Protocol: protobuf messages with a varint length prefix over TLS; pairing on 6467, remote on 6466.
 */
final class AtvRemote {
    private static final String ALIAS = "shore-atv-remote", HOST = "127.0.0.1";
    private static final int PAIRING_PORT = 6467, REMOTE_PORT = 6466;
    // PING | KEY | IME | POWER | VOLUME | APP_LINK
    private static final int FEATURES = 1 | 2 | 4 | 32 | 64 | 512;
    private static final Map<String, Integer> KEYS = new HashMap<>();
    static {
        KEYS.put("up", 19); KEYS.put("down", 20); KEYS.put("left", 21); KEYS.put("right", 22); KEYS.put("ok", 23);
        KEYS.put("back", 4); KEYS.put("home", 3); KEYS.put("play", 85); KEYS.put("next", 87); KEYS.put("prev", 88);
        KEYS.put("volup", 24); KEYS.put("voldown", 25); KEYS.put("mute", 164);
    }

    private static AtvRemote instance;
    private final SharedPreferences prefs;
    private SSLSocket pairing;          // open between "pair" and "code"
    private SSLSocket remote;           // kept open once paired; a reader thread answers pings
    private OutputStream remoteOut;
    private volatile String status = "";
    private volatile boolean ready;

    static synchronized AtvRemote get(Context context) {
        if (instance == null) instance = new AtvRemote(context.getApplicationContext());
        return instance;
    }

    private AtvRemote(Context context) { prefs = context.getSharedPreferences("atvremote", Context.MODE_PRIVATE); }

    static boolean supports(String key) { return KEYS.containsKey(key); }

    boolean paired() { return prefs.getBoolean("paired", false); }

    /** unpaired, pairing (the TV shows a code), paired, or error:<reason>. */
    synchronized String status() { return !status.isEmpty() ? status : paired() ? "paired" : "unpaired"; }

    /** Opens the pairing session; the TV then shows a code. */
    synchronized boolean startPairing() {
        closePairing();
        try {
            SSLSocket s = connect(PAIRING_PORT);
            OutputStream out = s.getOutputStream();
            InputStream in = s.getInputStream();
            send(out, pairingMessage(10, new Proto().string(1, "atvremote").string(2, "Shore")));
            expect(in, 11);
            Proto encoding = new Proto().varint(1, 3).varint(2, 6); // hexadecimal, six symbols
            send(out, pairingMessage(20, new Proto().message(1, encoding).message(2, encoding).varint(3, 1)));
            expect(in, 20);
            send(out, pairingMessage(30, new Proto().message(1, encoding).varint(2, 1)));
            expect(in, 31);
            pairing = s;
            status = "pairing";
            return true;
        } catch (Exception e) {
            closePairing();
            status = "error:" + reason(e);
            return false;
        }
    }

    /** Sends the code the TV shows; true when the TV accepted it. */
    synchronized boolean finishPairing(String code) {
        SSLSocket s = pairing;
        code = code == null ? "" : code.trim().toUpperCase(java.util.Locale.ROOT);
        if (s == null || !code.matches("[0-9A-F]{6}")) { status = s == null ? "error:session" : "error:code"; return false; }
        try {
            RSAPublicKey client = (RSAPublicKey) certificate().getPublicKey();
            RSAPublicKey server = (RSAPublicKey) s.getSession().getPeerCertificates()[0].getPublicKey();
            MessageDigest h = MessageDigest.getInstance("SHA-256");
            h.update(unsigned(client.getModulus())); h.update(unsigned(client.getPublicExponent()));
            h.update(unsigned(server.getModulus())); h.update(unsigned(server.getPublicExponent()));
            h.update(hex(code.substring(2)));
            byte[] secret = h.digest();
            if ((secret[0] & 0xff) != Integer.parseInt(code.substring(0, 2), 16)) { status = "error:code"; return false; } // typo: keep the session open
            send(s.getOutputStream(), pairingMessage(40, new Proto().bytes(1, secret)));
            expect(s.getInputStream(), 41);
            prefs.edit().putBoolean("paired", true).apply();
            status = "";
            closePairing();
            return true;
        } catch (Exception e) {
            closePairing();
            status = "error:" + reason(e);
            return false;
        }
    }

    /** Presses a key in whichever app is in front. False when not paired or the service can't be reached. */
    boolean press(String key) {
        Integer code = KEYS.get(key);
        if (code == null || !paired()) return false;
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                OutputStream out = ensureRemote();
                synchronized (this) { send(out, new Proto().message(10, new Proto().varint(1, code).varint(2, 3))); } // SHORT press
                return true;
            } catch (Exception e) { closeRemote(); }
        }
        return false;
    }

    /** Forgets the pairing on Shore's side; the TV keeps its record until it is removed there. */
    synchronized void forget() {
        closePairing(); closeRemote();
        prefs.edit().putBoolean("paired", false).apply();
        status = "";
    }

    // ---------- Remote session ----------

    private synchronized OutputStream ensureRemote() throws Exception {
        if (remote != null && ready && !remote.isClosed()) return remoteOut;
        closeRemote();
        final SSLSocket s = connect(REMOTE_PORT);
        final InputStream in = s.getInputStream();
        final OutputStream out = s.getOutputStream();
        // The TV opens with its configuration; Shore answers with its own and becomes active.
        long until = System.currentTimeMillis() + 5000;
        while (!ready) {
            if (System.currentTimeMillis() > until) throw new IOException("setup");
            handle(Proto.parse(read(in)), out);
        }
        remote = s; remoteOut = out;
        Thread reader = new Thread(() -> {
            try { while (!s.isClosed()) { Map<Integer, Object> m = Proto.parse(read(in)); synchronized (AtvRemote.this) { handle(m, out); } } }
            catch (Exception ignored) { }
            synchronized (AtvRemote.this) { if (remote == s) closeRemote(); }
        }, "shore-atv-remote");
        reader.setDaemon(true);
        reader.start();
        return out;
    }

    private void handle(Map<Integer, Object> m, OutputStream out) throws Exception {
        if (m.containsKey(1)) { // remote_configure
            Proto info = new Proto().string(1, "Shore").string(2, "Shore").varint(3, 1).string(4, "1").string(5, "atvremote").string(6, BuildConfig.VERSION_NAME);
            send(out, new Proto().message(1, new Proto().varint(1, FEATURES).message(2, info)));
        } else if (m.containsKey(2)) { // remote_set_active
            send(out, new Proto().message(2, new Proto().varint(1, FEATURES)));
            ready = true;
        } else if (m.containsKey(8)) { // remote_ping_request
            Object val = Proto.parse((byte[]) m.get(8)).get(1);
            send(out, new Proto().message(9, new Proto().varint(1, val instanceof Long ? (Long) val : 0)));
        } else if (m.containsKey(3)) throw new IOException("remote error");
    }

    private synchronized void closeRemote() {
        ready = false;
        try { if (remote != null) remote.close(); } catch (Exception ignored) { }
        remote = null; remoteOut = null;
    }

    private void closePairing() {
        try { if (pairing != null) pairing.close(); } catch (Exception ignored) { }
        pairing = null;
    }

    // ---------- TLS with Shore's own client certificate ----------

    private SSLSocket connect(int port) throws Exception {
        final PrivateKey key = privateKey();
        final X509Certificate cert = certificate();
        KeyManager km = new X509KeyManager() {
            public String[] getClientAliases(String t, Principal[] p) { return new String[] { ALIAS }; }
            public String chooseClientAlias(String[] t, Principal[] p, Socket s) { return ALIAS; }
            public String[] getServerAliases(String t, Principal[] p) { return null; }
            public String chooseServerAlias(String t, Principal[] p, Socket s) { return null; }
            public X509Certificate[] getCertificateChain(String a) { return new X509Certificate[] { cert }; }
            public PrivateKey getPrivateKey(String a) { return key; }
        };
        // The TV's certificate is self-signed and the connection never leaves the device.
        TrustManager tm = new X509TrustManager() {
            public void checkClientTrusted(X509Certificate[] c, String a) { }
            public void checkServerTrusted(X509Certificate[] c, String a) { }
            public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
        };
        SSLContext ctx = SSLContext.getInstance("TLS");
        ctx.init(new KeyManager[] { km }, new TrustManager[] { tm }, null);
        Socket raw = new Socket();
        raw.connect(new InetSocketAddress(HOST, port), 3000);
        SSLSocket s = (SSLSocket) ctx.getSocketFactory().createSocket(raw, HOST, port, true);
        s.setSoTimeout(port == PAIRING_PORT ? 180000 : 0);
        s.startHandshake();
        return s;
    }

    /* Shore's client identity: a software RSA key and a self-signed certificate, kept in Shore's private preferences.
       (Keys inside the Android keystore can't make the raw RSA signatures TLS asks for on this TV.) */
    private PrivateKey key;
    private X509Certificate cert;

    private synchronized PrivateKey privateKey() throws Exception { identity(); return key; }

    private synchronized X509Certificate certificate() throws Exception { identity(); return cert; }

    private void identity() throws Exception {
        if (key != null && cert != null) return;
        String k = prefs.getString("key", ""), c = prefs.getString("cert", "");
        if (k.isEmpty() || c.isEmpty()) {
            KeyPairGenerator g = KeyPairGenerator.getInstance("RSA");
            g.initialize(2048);
            KeyPair pair = g.generateKeyPair();
            byte[] der = selfSigned(pair);
            k = Base64.encodeToString(pair.getPrivate().getEncoded(), Base64.NO_WRAP);
            c = Base64.encodeToString(der, Base64.NO_WRAP);
            prefs.edit().putString("key", k).putString("cert", c).putBoolean("paired", false).apply();
        }
        key = KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(Base64.decode(k, Base64.NO_WRAP)));
        cert = (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(Base64.decode(c, Base64.NO_WRAP)));
    }

    /** A minimal X.509 v3 certificate for CN=Shore, signed with its own key (SHA-256 with RSA), valid for 20 years. */
    private static byte[] selfSigned(KeyPair pair) throws Exception {
        byte[] alg = der(0x30, cat(der(0x06, new byte[] { 0x2A, (byte) 0x86, 0x48, (byte) 0x86, (byte) 0xF7, 0x0D, 0x01, 0x01, 0x0B }), new byte[] { 0x05, 0x00 }));
        byte[] name = der(0x30, der(0x31, der(0x30, cat(der(0x06, new byte[] { 0x55, 0x04, 0x03 }), der(0x0C, "Shore".getBytes(StandardCharsets.UTF_8))))));
        SimpleDateFormat utc = new SimpleDateFormat("yyMMddHHmmss'Z'", Locale.ROOT);
        utc.setTimeZone(TimeZone.getTimeZone("UTC"));
        Calendar now = Calendar.getInstance(TimeZone.getTimeZone("UTC")), end = (Calendar) now.clone();
        now.add(Calendar.DAY_OF_YEAR, -1); end.add(Calendar.YEAR, 20);
        byte[] validity = der(0x30, cat(der(0x17, utc.format(now.getTime()).getBytes(StandardCharsets.US_ASCII)), der(0x17, utc.format(end.getTime()).getBytes(StandardCharsets.US_ASCII))));
        byte[] tbs = der(0x30, cat(der(0xA0, der(0x02, new byte[] { 2 })), der(0x02, BigInteger.valueOf(System.currentTimeMillis()).toByteArray()),
                alg, name, validity, name, pair.getPublic().getEncoded()));
        Signature sig = Signature.getInstance("SHA256withRSA");
        sig.initSign(pair.getPrivate());
        sig.update(tbs);
        return der(0x30, cat(tbs, alg, der(0x03, cat(new byte[] { 0 }, sig.sign()))));
    }

    private static byte[] der(int tag, byte[] body) {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        b.write(tag);
        int n = body.length;
        if (n < 128) b.write(n);
        else if (n < 256) { b.write(0x81); b.write(n); }
        else { b.write(0x82); b.write(n >> 8); b.write(n & 0xff); }
        b.write(body, 0, n);
        return b.toByteArray();
    }

    private static byte[] cat(byte[]... parts) {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        for (byte[] p : parts) b.write(p, 0, p.length);
        return b.toByteArray();
    }

    // ---------- Messages ----------

    private static Proto pairingMessage(int field, Proto body) { return new Proto().varint(1, 2).varint(2, 200).message(field, body); }

    /** Reads one pairing message and checks it carries the expected field with status OK. */
    private static void expect(InputStream in, int field) throws Exception {
        Map<Integer, Object> m = Proto.parse(read(in));
        Object st = m.get(2);
        if (st instanceof Long && (Long) st != 200) throw new IOException("status " + st);
        if (!m.containsKey(field)) throw new IOException("unexpected");
    }

    private static void send(OutputStream out, Proto p) throws IOException {
        byte[] body = p.toByteArray();
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        Proto.writeVarint(b, body.length);
        b.write(body, 0, body.length);
        out.write(b.toByteArray());
        out.flush();
    }

    private static byte[] read(InputStream in) throws IOException {
        long len = 0; int shift = 0, c;
        do { c = in.read(); if (c < 0) throw new IOException("closed"); len |= (long) (c & 0x7f) << shift; shift += 7; } while ((c & 0x80) != 0 && shift < 35);
        if (len < 0 || len > 65536) throw new IOException("length");
        byte[] buf = new byte[(int) len];
        for (int off = 0; off < buf.length; ) { int n = in.read(buf, off, buf.length - off); if (n < 0) throw new IOException("closed"); off += n; }
        return buf;
    }

    private static byte[] unsigned(BigInteger n) {
        byte[] b = n.toByteArray();
        int i = 0;
        while (i < b.length - 1 && b[i] == 0) i++;
        return Arrays.copyOfRange(b, i, b.length);
    }

    private static byte[] hex(String s) {
        byte[] out = new byte[s.length() / 2];
        for (int i = 0; i < out.length; i++) out[i] = (byte) Integer.parseInt(s.substring(2 * i, 2 * i + 2), 16);
        return out;
    }

    private static String reason(Exception e) {
        android.util.Log.w("ShoreAtv", "remote service", e);
        String m = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
        return m.contains("ECONNREFUSED") || m.contains("Connection refused") ? "service" : m.startsWith("status") ? "rejected" : "failed";
    }

    /** Just enough protobuf: varints, strings, bytes and nested messages. */
    static final class Proto {
        private final ByteArrayOutputStream b = new ByteArrayOutputStream();

        Proto varint(int field, long v) { writeVarint(b, (long) field << 3); writeVarint(b, v); return this; }
        Proto bytes(int field, byte[] v) { writeVarint(b, ((long) field << 3) | 2); writeVarint(b, v.length); b.write(v, 0, v.length); return this; }
        Proto string(int field, String v) { return bytes(field, v.getBytes(java.nio.charset.StandardCharsets.UTF_8)); }
        Proto message(int field, Proto v) { return bytes(field, v.toByteArray()); }
        byte[] toByteArray() { return b.toByteArray(); }

        static void writeVarint(ByteArrayOutputStream out, long v) {
            while ((v & ~0x7fL) != 0) { out.write((int) ((v & 0x7f) | 0x80)); v >>>= 7; }
            out.write((int) v);
        }

        /** Top-level fields: varints as Long, length-delimited as byte[]. Later duplicates win. */
        static Map<Integer, Object> parse(byte[] data) throws IOException {
            Map<Integer, Object> m = new HashMap<>();
            int[] pos = { 0 };
            while (pos[0] < data.length) {
                long tag = varint(data, pos);
                int field = (int) (tag >>> 3), type = (int) (tag & 7);
                if (type == 0) m.put(field, varint(data, pos));
                else if (type == 2) { int n = (int) varint(data, pos); if (n < 0 || pos[0] + n > data.length) throw new IOException("proto"); m.put(field, Arrays.copyOfRange(data, pos[0], pos[0] + n)); pos[0] += n; }
                else if (type == 5) pos[0] += 4;
                else if (type == 1) pos[0] += 8;
                else throw new IOException("proto");
            }
            return m;
        }

        private static long varint(byte[] d, int[] pos) throws IOException {
            long v = 0; int shift = 0;
            while (true) {
                if (pos[0] >= d.length || shift > 63) throw new IOException("proto");
                int c = d[pos[0]++] & 0xff;
                v |= (long) (c & 0x7f) << shift;
                if ((c & 0x80) == 0) return v;
                shift += 7;
            }
        }
    }
}
