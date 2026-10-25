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

    private static String fetch(String artist, String title, String album, int seconds) throws Exception {
        String q = "artist_name=" + enc(artist) + "&track_name=" + enc(title);
        JSONObject hit = null;
        String exact = http("https://lrclib.net/api/get?" + q + (album.isEmpty() ? "" : "&album_name=" + enc(album)) + (seconds > 0 ? "&duration=" + seconds : ""));
        if (exact != null) hit = new JSONObject(exact);
        if (hit == null || hit.optString("syncedLyrics").isEmpty() && hit.optString("plainLyrics").isEmpty()) {
            String found = http("https://lrclib.net/api/search?" + q);
            JSONArray list = found == null ? new JSONArray() : new JSONArray(found);
            JSONObject best = null;
            for (int i = 0; i < list.length(); i++) {
                JSONObject o = list.getJSONObject(i);
                if (o.optString("syncedLyrics").isEmpty() && o.optString("plainLyrics").isEmpty()) continue;
                boolean close = seconds <= 0 || Math.abs(o.optDouble("duration", 0) - seconds) <= 3;
                if (best == null || close && !o.optString("syncedLyrics").isEmpty()) best = o;
                if (close && !o.optString("syncedLyrics").isEmpty()) break;
            }
            if (best != null) hit = best;
        }
        if (hit == null) return NONE;
        if (hit.optBoolean("instrumental")) return "{\"state\":\"instrumental\"}";
        JSONArray synced = new JSONArray();
        for (String line : hit.optString("syncedLyrics").split("\n")) {
            Matcher m = LINE.matcher(line.trim());
            if (!m.matches()) continue;
            String frac = m.group(3) == null ? "0" : m.group(3);
            long ms = Integer.parseInt(m.group(1)) * 60000L + Integer.parseInt(m.group(2)) * 1000L
                    + Math.round(Integer.parseInt(frac) * Math.pow(10, 3 - frac.length()));
            synced.put(new JSONArray().put(ms).put(m.group(4).trim()));
        }
        String plain = hit.optString("plainLyrics");
        if (synced.length() == 0 && plain.isEmpty()) return NONE;
        return new JSONObject().put("state", "ok").put("synced", synced).put("plain", plain.length() > 20000 ? plain.substring(0, 20000) : plain).toString();
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
