package app.cleanframe.tv;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lyrics for the music view from LRCLIB (lrclib.net, free and keyless). Only the artist, title, album and
 * length are sent, and only while the music view is open with lyrics on. Answers are kept for the last tracks.
 */
final class Lyrics {
    private static final ExecutorService NET = Executors.newSingleThreadExecutor();
    private static final Pattern WORD = Pattern.compile("<(\\d{1,3}):(\\d{2})(?:[.:](\\d{1,3}))?>([^<]*)");
    private static final Pattern LINE = Pattern.compile("^\\[(\\d{1,3}):(\\d{2})(?:[.:](\\d{1,3}))?\\](.*)$");
    /** key -> {state, synced:[[ms, text]], plain}. */
    private static final Map<String, String> CACHE = new LinkedHashMap<String, String>(16, .75f, true) {
        @Override protected boolean removeEldestEntry(Map.Entry<String, String> e) { return size() > 40; }
    };
    private static final String PENDING = "{\"state\":\"pending\"}", NONE = "{\"state\":\"none\"}";

    private Lyrics() { }

    static String get(String artist, String title, String album, int seconds) {
        if (artist == null || title == null || artist.trim().isEmpty() || title.trim().isEmpty()) return NONE;
        final String key = artist.trim() + "\n" + title.trim() + "\n" + (album == null ? "" : album.trim()) + "\n" + seconds;
        synchronized (CACHE) {
            String hit = CACHE.get(key);
            if (hit != null) return hit;
            CACHE.put(key, PENDING);
        }
        NET.execute(() -> {
            String result;
            try { result = fetch(artist.trim(), title.trim(), album == null ? "" : album.trim(), seconds); }
            catch (Exception e) { result = null; }
            synchronized (CACHE) { if (result == null) CACHE.remove(key); else CACHE.put(key, result); } // a failed request is asked again later
        });
        return PENDING;
    }

    /** key -> {state, src, lines:[…]}: the lines translated, same count and order. */
    private static final Map<String, String> TRANSLATED = new LinkedHashMap<String, String>(16, .75f, true) {
        @Override protected boolean removeEldestEntry(Map.Entry<String, String> e) { return size() > 20; }
    };

    /**
     * The lyric lines in the TV's language, only when the owner turned Translate lyrics on. The lines go to
     * Google Translate's keyless endpoint in one request; nothing else about the song or the TV is sent.
     * "same" when the song is already in that language.
     */
    static String translate(String text, String lang) {
        if (text == null || text.trim().isEmpty() || lang == null || !lang.matches("[a-z]{2,3}(-[A-Za-z]{2,4})?") || text.length() > 12000) return NONE;
        final String key = lang + "\n" + text;
        synchronized (TRANSLATED) {
            String hit = TRANSLATED.get(key);
            if (hit != null) return hit;
            TRANSLATED.put(key, PENDING);
        }
        NET.execute(() -> {
            String result;
            try { result = fetchTranslation(text, lang); } catch (Exception e) { result = null; }
            synchronized (TRANSLATED) { if (result == null) TRANSLATED.remove(key); else TRANSLATED.put(key, result); }
        });
        return PENDING;
    }

    private static String fetchTranslation(String text, String lang) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&dt=t&tl=" + enc(lang)).openConnection();
        String body;
        try {
            c.setConnectTimeout(8000); c.setReadTimeout(15000);
            c.setDoOutput(true); c.setRequestMethod("POST");
            c.setRequestProperty("User-Agent", OnlineWallpapers.UA);
            c.setRequestProperty("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
            c.getOutputStream().write(("q=" + enc(text)).getBytes(StandardCharsets.UTF_8));
            if (c.getResponseCode() != 200) throw new IllegalStateException("HTTP " + c.getResponseCode());
            try (InputStream in = c.getInputStream()) { body = new String(OnlineWallpapers.readAll(in, 2 << 20), StandardCharsets.UTF_8); }
        } finally { c.disconnect(); }
        JSONArray r = new JSONArray(body), parts = r.optJSONArray(0);
        String src = r.optString(2, "");
        if (src.equalsIgnoreCase(lang) || src.equalsIgnoreCase(lang.split("-")[0])) return "{\"state\":\"same\"}";
        if (parts == null) return NONE;
        StringBuilder all = new StringBuilder();
        for (int i = 0; i < parts.length(); i++) { JSONArray p = parts.optJSONArray(i); if (p != null && !p.isNull(0)) all.append(p.optString(0)); }
        String[] want = text.split("\n", -1), got = all.toString().split("\n", -1);
        if (want.length != got.length) return NONE; // lines that no longer line up are worse than none
        JSONArray lines = new JSONArray();
        for (String g : got) lines.put(g.trim());
        return new JSONObject().put("state", "ok").put("src", src).put("lines", lines).toString();
    }

    /** Title without what streaming services add: (feat. …), - Remastered 2011, [Explicit], - Radio Edit and similar. */
    static String cleanTitle(String t) {
        String s = t.replaceAll("(?i)\\s*[(\\[](feat|ft|with)\\.?\\s[^)\\]]*[)\\]]", "")
                .replaceAll("(?i)\\s*[(\\[][^)\\]]*(remaster|explicit|clean|edit|version|mono|stereo|live|bonus|deluxe)[^)\\]]*[)\\]]", "")
                .replaceAll("(?i)\\s+-\\s+.*(remaster|edit|version|mix|live|mono|stereo).*$", "");
        return s.trim().isEmpty() ? t.trim() : s.trim();
    }

    /** First artist only: "A, B", "A & B", "A feat. B" and "A x B" become "A". */
    static String mainArtist(String a) { String s = a.split("(?i)\\s*(,|&| feat\\.? | ft\\.? | x | und | and |;)\\s*")[0].trim(); return s.isEmpty() ? a.trim() : s; }

    private static String norm(String s) { return s.toLowerCase(java.util.Locale.ROOT).replaceAll("[^\\p{L}\\p{N}]", ""); }

    /** Same song: the titles match once cleaned, the artist overlaps, and the length is within a few seconds when both are known. */
    private static boolean same(JSONObject o, String artist, String title, int seconds) {
        String t1 = norm(cleanTitle(o.optString("trackName"))), t2 = norm(cleanTitle(title));
        String a1 = norm(o.optString("artistName")), a2 = norm(mainArtist(artist));
        if (t1.isEmpty() || !t1.equals(t2)) return false;
        if (a2.isEmpty() || !(a1.contains(a2) || a2.contains(a1))) return false;
        double d = o.optDouble("duration", 0);
        return seconds <= 0 || d <= 0 || Math.abs(d - seconds) <= 3;
    }

    /** The version playing is the one whose length matches best; synced lyrics win a tie (within a second). */
    private static boolean better(JSONObject o, JSONObject than, int seconds) {
        double a = seconds > 0 ? Math.abs(o.optDouble("duration", 1e9) - seconds) : 0, b = seconds > 0 ? Math.abs(than.optDouble("duration", 1e9) - seconds) : 0;
        boolean sa = !o.optString("syncedLyrics").isEmpty(), sb = !than.optString("syncedLyrics").isEmpty();
        if (Math.abs(a - b) <= 1) return sa && !sb;
        return a < b;
    }

    private static boolean hasText(JSONObject o) { return !o.optString("syncedLyrics").isEmpty() || !o.optString("plainLyrics").isEmpty() || o.optBoolean("instrumental"); }

    private static String fetch(String artist, String title, String album, int seconds) throws Exception {
        String clean = cleanTitle(title), main = mainArtist(artist);
        JSONObject hit = null;
        // An exact signature first: LRCLIB matches it on artist, title, album and length.
        String exact = http("https://lrclib.net/api/get?artist_name=" + enc(main) + "&track_name=" + enc(clean)
                + (album.isEmpty() ? "" : "&album_name=" + enc(album)) + (seconds > 0 ? "&duration=" + seconds : ""));
        if (exact != null) { JSONObject o = new JSONObject(exact); if (hasText(o) && same(o, artist, title, seconds)) hit = o; }
        if (hit == null) {
            String found = http("https://lrclib.net/api/search?artist_name=" + enc(main) + "&track_name=" + enc(clean));
            JSONArray list = found == null ? new JSONArray() : new JSONArray(found);
            for (int i = 0; i < list.length(); i++) {
                JSONObject o = list.getJSONObject(i);
                if (!hasText(o) || !same(o, artist, title, seconds)) continue; // a different song or version is worse than none
                if (hit == null || better(o, hit, seconds)) hit = o;
            }
        }
        if (hit == null) return NONE;
        if (hit.optBoolean("instrumental")) return "{\"state\":\"instrumental\"}";
        JSONArray synced = new JSONArray();
        for (String line : hit.optString("syncedLyrics").split("\n")) {
            Matcher m = LINE.matcher(line.trim());
            if (!m.matches()) continue;
            long ms = time(m.group(1), m.group(2), m.group(3));
            String text = m.group(4).trim();
            // Enhanced LRC times each word: "<00:12.34> word <00:12.80> next". Keep those times, show plain text.
            JSONArray words = new JSONArray();
            Matcher w = WORD.matcher(text);
            while (w.find()) { String word = w.group(4).trim(); if (!word.isEmpty()) words.put(new JSONArray().put(time(w.group(1), w.group(2), w.group(3))).put(word)); }
            JSONArray row = new JSONArray().put(ms).put(text.replaceAll("<\\d{1,3}:\\d{2}(?:[.:]\\d{1,3})?>", "").replaceAll("\\s+", " ").trim());
            if (words.length() > 0) row.put(words);
            synced.put(row);
        }
        String plain = hit.optString("plainLyrics");
        if (synced.length() == 0 && plain.isEmpty()) return NONE;
        return new JSONObject().put("state", "ok").put("synced", synced).put("plain", plain.length() > 20000 ? plain.substring(0, 20000) : plain).toString();
    }

    private static long time(String min, String sec, String frac) {
        String f = frac == null ? "0" : frac;
        return Integer.parseInt(min) * 60000L + Integer.parseInt(sec) * 1000L + Math.round(Integer.parseInt(f) * Math.pow(10, 3 - f.length()));
    }

    private static String enc(String s) throws Exception { return URLEncoder.encode(s, "UTF-8"); }

    /** Body of a 200 answer, null for 404; throws on other failures so the track is tried again. */
    private static String http(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        try {
            c.setConnectTimeout(8000); c.setReadTimeout(15000);
            c.setRequestProperty("User-Agent", OnlineWallpapers.UA);
            int code = c.getResponseCode();
            if (code == 404) return null;
            if (code != 200) throw new IllegalStateException("HTTP " + code);
            try (InputStream in = c.getInputStream()) { return new String(OnlineWallpapers.readAll(in, 2 << 20), StandardCharsets.UTF_8); }
        } finally { c.disconnect(); }
    }
}
