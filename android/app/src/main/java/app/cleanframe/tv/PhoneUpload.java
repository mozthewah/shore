package app.cleanframe.tv;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.util.Base64;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Collections;
import java.util.EnumMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * "Send photos from your phone": a small web page on the local network, opened from a QR code.
 * It runs only while the TV shows the code (and at most 15 minutes), needs a random one-time path,
 * and accepts JPEG, PNG, WebP, GIF and MP4 files. Files land in files/phone/ and become the "My photos" source.
 */
final class PhoneUpload {
    interface Listener { void changed(int count); }

    static final int MAX_FILES = 30, MAX_BYTES = 60 * 1024 * 1024;
    private static final long OPEN_MS = 15L * 60 * 1000;
    private static final int[] PORTS = { 8642, 8643, 8644, 8645 };

    private final Context context;
    private final File dir;
    private final SharedPreferences prefs;
    private final ExecutorService pool = Executors.newFixedThreadPool(3);
    private volatile ServerSocket server;
    private volatile String token = "", url = "";
    private volatile long until;
    private volatile Listener listener;

    PhoneUpload(Context context) {
        this.context = context.getApplicationContext();
        dir = new File(this.context.getFilesDir(), "phone");
        dir.mkdirs();
        prefs = this.context.getSharedPreferences("phone-upload", Context.MODE_PRIVATE);
    }

    void setListener(Listener l) { listener = l; }

    File dir() { return dir; }

    /** Uploaded files, oldest first. */
    File[] files() {
        File[] list = dir.listFiles((d, name) -> name.matches("phone-\\d+\\.(jpg|png|webp|gif|mp4)"));
        if (list == null) return new File[0];
        Arrays.sort(list, (a, b) -> a.getName().compareTo(b.getName()));
        return list;
    }

    /** Place name typed on the phone for the weather line; empty when none was set. */
    String place() { return prefs.getString("place", ""); }

    /** Starts (or keeps) the server and returns {url, qr, count, until}; url is empty without a network. */
    synchronized String start() {
        try {
            if (server == null || server.isClosed() || System.currentTimeMillis() > until) open();
            until = System.currentTimeMillis() + OPEN_MS;
            return new JSONObject().put("url", url).put("qr", url.isEmpty() ? "" : qr(url)).put("count", files().length).put("until", until).toString();
        } catch (Exception e) {
            stop();
            try { return new JSONObject().put("url", "").put("qr", "").put("count", files().length).toString(); } catch (Exception x) { return "{}"; }
        }
    }

    synchronized void stop() {
        ServerSocket s = server;
        server = null; token = ""; url = "";
        if (s != null) try { s.close(); } catch (IOException ignored) { }
    }

    int count() { return files().length; }

    /** Removes every uploaded file. */
    void clear() {
        for (File f : files()) f.delete();
        notifyChanged();
    }

    private void open() throws IOException {
        stop();
        String address = address();
        if (address == null) return;
        ServerSocket s = null;
        for (int port : PORTS) {
            try { s = new ServerSocket(port, 8); break; } catch (IOException ignored) { }
        }
        if (s == null) throw new IOException("No free port");
        byte[] raw = new byte[6];
        new SecureRandom().nextBytes(raw);
        token = Base64.encodeToString(raw, Base64.URL_SAFE | Base64.NO_PADDING | Base64.NO_WRAP);
        url = "http://" + address + ":" + s.getLocalPort() + "/" + token;
        server = s;
        final ServerSocket accepting = s;
        new Thread(() -> {
            while (!accepting.isClosed()) {
                try {
                    final Socket socket = accepting.accept();
                    if (System.currentTimeMillis() > until) { socket.close(); stop(); break; }
                    pool.execute(() -> serve(socket));
                } catch (IOException e) { break; }
            }
        }, "CleanFramePhoneUpload").start();
    }

    /** First site-local IPv4 address (Wi-Fi or Ethernet). */
    private static String address() {
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InetAddress a : Collections.list(ni.getInetAddresses()))
                    if (a instanceof Inet4Address && a.isSiteLocalAddress()) return a.getHostAddress();
            }
        } catch (Exception ignored) { }
        return null;
    }

    private static String qr(String text) throws Exception {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.MARGIN, 2);
        BitMatrix m = new QRCodeWriter().encode(text, BarcodeFormat.QR_CODE, 0, 0, hints);
        int scale = 8, w = m.getWidth() * scale, h = m.getHeight() * scale;
        int[] px = new int[w * h];
        for (int y = 0; y < h; y++) for (int x = 0; x < w; x++) px[y * w + x] = m.get(x / scale, y / scale) ? Color.BLACK : Color.WHITE;
        Bitmap b = Bitmap.createBitmap(px, w, h, Bitmap.Config.ARGB_8888);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        b.recycle();
        return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }

    // ---------- HTTP ----------

    private void serve(Socket socket) {
        try (Socket s = socket) {
            s.setSoTimeout(30000);
            InputStream in = s.getInputStream();
            OutputStream out = s.getOutputStream();
            String head = readHead(in);
            if (head == null) return;
            String[] lines = head.split("\r\n");
            String[] request = lines[0].split(" ");
            if (request.length < 2) { send(out, 400, "text/plain", "Bad request"); return; }
            String method = request[0], path = request[1];
            long length = -1;
            String name = "";
            for (String line : lines) {
                int colon = line.indexOf(':');
                if (colon < 0) continue;
                String key = line.substring(0, colon).trim().toLowerCase(java.util.Locale.ROOT), value = line.substring(colon + 1).trim();
                if (key.equals("content-length")) try { length = Long.parseLong(value); } catch (NumberFormatException ignored) { }
                if (key.equals("x-file-name")) name = value;
            }
            String base = "/" + token;
            if (token.isEmpty() || !(path.equals(base) || path.startsWith(base + "/") || path.startsWith(base + "?"))) { send(out, 404, "text/plain", "This code has expired. Show it again on the TV."); return; }
            String rest = path.substring(base.length());
            if (method.equals("GET") && (rest.isEmpty() || rest.equals("/"))) { send(out, 200, "text/html; charset=utf-8", page()); return; }
            if (method.equals("GET") && rest.equals("/count")) { send(out, 200, "application/json", "{\"count\":" + count() + "}"); return; }
            if (method.equals("POST") && rest.equals("/upload")) { upload(in, out, length); return; }
            if (method.equals("POST") && rest.equals("/clear")) { clear(); send(out, 200, "application/json", "{\"count\":0}"); return; }
            if (method.equals("POST") && rest.startsWith("/place")) {
                String q = rest.indexOf('?') >= 0 ? rest.substring(rest.indexOf('?') + 1) : "";
                String place = q.startsWith("name=") ? URLDecoder.decode(q.substring(5), "UTF-8").trim() : "";
                if (place.length() > 80) place = place.substring(0, 80);
                prefs.edit().putString("place", place).apply();
                notifyChanged();
                send(out, 200, "application/json", JSONObject.quote(place));
                return;
            }
            send(out, 404, "text/plain", "Not found");
        } catch (Exception ignored) { }
    }

    private void upload(InputStream in, OutputStream out, long length) throws IOException {
        if (length <= 0 || length > MAX_BYTES) { send(out, 413, "text/plain", "Files up to 60 MB, please."); return; }
        File tmp = new File(dir, "upload-" + System.nanoTime() + ".part");
        byte[] magic = new byte[12];
        int got = 0;
        try (FileOutputStream f = new FileOutputStream(tmp)) {
            byte[] buf = new byte[65536];
            long left = length;
            while (left > 0) {
                int n = in.read(buf, 0, (int) Math.min(buf.length, left));
                if (n < 0) throw new IOException("Upload cut short");
                if (got < magic.length) { int k = Math.min(n, magic.length - got); System.arraycopy(buf, 0, magic, got, k); got += k; }
                f.write(buf, 0, n);
                left -= n;
            }
        }
        String ext = type(magic);
        if (ext == null) { tmp.delete(); send(out, 415, "text/plain", "Only photos (JPEG, PNG, WebP), GIFs and MP4 videos."); return; }
        File target = new File(dir, "phone-" + System.currentTimeMillis() + "." + ext);
        if (!tmp.renameTo(target)) { tmp.delete(); send(out, 500, "text/plain", "Could not save"); return; }
        File[] all = files();
        for (int i = 0; i < all.length - MAX_FILES; i++) all[i].delete(); // keep the newest 30
        notifyChanged();
        send(out, 200, "application/json", "{\"count\":" + count() + "}");
    }

    private static String type(byte[] m) {
        if ((m[0] & 255) == 0xFF && (m[1] & 255) == 0xD8) return "jpg";
        if ((m[0] & 255) == 0x89 && m[1] == 'P' && m[2] == 'N' && m[3] == 'G') return "png";
        if (m[0] == 'G' && m[1] == 'I' && m[2] == 'F') return "gif";
        if (m[0] == 'R' && m[1] == 'I' && m[2] == 'F' && m[3] == 'F' && m[8] == 'W' && m[9] == 'E' && m[10] == 'B' && m[11] == 'P') return "webp";
        if (m[4] == 'f' && m[5] == 't' && m[6] == 'y' && m[7] == 'p') return "mp4";
        return null;
    }

    private static String readHead(InputStream in) throws IOException {
        ByteArrayOutputStream head = new ByteArrayOutputStream();
        int a = 0, b = 0, c = 0, d;
        while ((d = in.read()) >= 0) {
            head.write(d);
            if (a == '\r' && b == '\n' && c == '\r' && d == '\n') return head.toString("ISO-8859-1");
            a = b; b = c; c = d;
            if (head.size() > 16384) return null;
        }
        return null;
    }

    private static void send(OutputStream out, int code, String type, String body) throws IOException {
        byte[] data = body.getBytes(StandardCharsets.UTF_8);
        String status = code == 200 ? "OK" : code == 404 ? "Not Found" : code == 413 ? "Too Large" : code == 415 ? "Unsupported" : "Error";
        out.write(("HTTP/1.1 " + code + " " + status + "\r\nContent-Type: " + type + "\r\nContent-Length: " + data.length
                + "\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.ISO_8859_1));
        out.write(data);
        out.flush();
    }

    private void notifyChanged() { Listener l = listener; if (l != null) l.changed(count()); }

    private String page() {
        return "<!doctype html><html><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
                + "<title>CleanFrame</title><style>"
                + "body{margin:0;font:17px/1.45 system-ui,-apple-system,sans-serif;background:#101418;color:#eef2f4}main{max-width:520px;margin:0 auto;padding:28px 20px}"
                + "h1{font-size:26px;margin:0 0 6px}p{color:#b8c2c8;margin:0 0 18px}label.pick{display:block;padding:22px;border:2px dashed #4a5a64;border-radius:16px;text-align:center;font-weight:600;margin-bottom:14px}"
                + "input[type=file]{display:none}button,input[type=text]{font:inherit;border-radius:12px;padding:12px 16px;border:0}button{background:#e8eef1;color:#101418;font-weight:600}"
                + "button.quiet{background:#2a343b;color:#eef2f4}input[type=text]{background:#1c2429;color:#eef2f4;width:100%;box-sizing:border-box;margin-bottom:10px}"
                + "#status{min-height:24px;font-weight:600}section{margin-top:30px;padding-top:20px;border-top:1px solid #2a343b}</style></head><body><main>"
                + "<h1>Send photos to CleanFrame</h1><p>Photos, GIFs and short MP4 videos appear on the TV under <b>My photos</b>. Landscape works best.</p>"
                + "<label class=pick>Choose photos or videos<input id=f type=file multiple accept='image/jpeg,image/png,image/webp,image/gif,video/mp4'></label>"
                + "<div id=status></div>"
                + "<section><p>Weather place for the clock (a city name, optional).</p><input id=place type=text placeholder='e.g. Berlin' value='" + escapeAttr(place()) + "'><button id=save class=quiet>Save place</button></section>"
                + "<section><p><span id=count>" + count() + "</span> of " + MAX_FILES + " photos stored on the TV.</p><button id=clear class=quiet>Remove all my photos</button></section>"
                + "</main><script>"
                + "var base=location.pathname.replace(/\\/$/,''),st=document.getElementById('status'),cnt=document.getElementById('count');"
                + "function show(t){st.textContent=t}"
                + "document.getElementById('f').onchange=async function(){var files=[].slice.call(this.files),ok=0;"
                + "for(var i=0;i<files.length;i++){show('Sending '+(i+1)+' of '+files.length+'…');"
                + "try{var r=await fetch(base+'/upload',{method:'POST',body:files[i],headers:{'X-File-Name':encodeURIComponent(files[i].name)}});"
                + "if(r.ok){ok++;cnt.textContent=(await r.json()).count}else show(await r.text())}catch(e){show('Upload failed. Is the TV still showing the code?')}}"
                + "if(ok)show(ok+(ok==1?' file':' files')+' sent. They appear on the TV in a moment.');this.value=''};"
                + "document.getElementById('clear').onclick=async function(){if(!confirm('Remove all your photos from the TV?'))return;"
                + "var r=await fetch(base+'/clear',{method:'POST'});if(r.ok){cnt.textContent='0';show('Removed.')}};"
                + "document.getElementById('save').onclick=async function(){var v=document.getElementById('place').value;"
                + "var r=await fetch(base+'/place?name='+encodeURIComponent(v),{method:'POST'});show(r.ok?(v?'Weather place saved.':'Weather place cleared.'):'Could not save.')};"
                + "</script></body></html>";
    }

    private static String escapeAttr(String s) {
        return s.replace("&", "&amp;").replace("'", "&#39;").replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
