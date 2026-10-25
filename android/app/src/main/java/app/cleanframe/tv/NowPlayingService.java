package app.cleanframe.tv;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.Paint;
import android.graphics.Rect;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.net.Uri;
import android.os.SystemClock;
import android.service.notification.NotificationListenerService;
import android.webkit.WebResourceResponse;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Lets CleanFrame read the active media sessions (title, artist, app) for the "Now playing" line.
 * Android only hands media sessions to an enabled notification listener, so the user has to allow
 * CleanFrame in Settings > Apps > Special app access > Notification access. Notifications themselves are ignored.
 */
public class NowPlayingService extends NotificationListenerService {
    private static final Object ART_LOCK = new Object();
    private static String artKey = "", artId = "";
    /** Online lookups (only when the owner allows them): one at a time, off the bridge thread. */
    private static final ExecutorService NET = Executors.newSingleThreadExecutor();
    /** Artist (lower case) -> wide picture file name, or "" while looking / when there is none. */
    private static final Map<String, String> WIDE = new HashMap<>();
    private static final String UA = "Shore/1.0 (+https://github.com/taynotfound/shore)";

    /** {access, playing, title, artist, app, pkg, art, back}. playing is false when nothing is playing or access is missing.
     *  art is the cover (/nowplaying/<id>.jpg) and back a soft, dimmed full-screen version of it; both are empty without a cover.
     *  With lookup, Shore also asks iTunes for a sharper cover and TheAudioDB for a wide artist picture (wide, 1920x1080),
     *  sending only the artist, title and album; results arrive on a later call. */
    static String info(Context context) { return info(context, false); }

    /** The playing session, or pkg's session once it is paused. */
    private static MediaController session(Context context, String pkg) {
        MediaSessionManager msm = (MediaSessionManager) context.getSystemService(Context.MEDIA_SESSION_SERVICE);
        if (msm == null) return null;
        MediaController target = null;
        for (MediaController c : msm.getActiveSessions(new ComponentName(context, NowPlayingService.class))) {
            PlaybackState s = c.getPlaybackState();
            if (s != null && s.getState() == PlaybackState.STATE_PLAYING) return c;
            if (target == null && pkg != null && pkg.equals(c.getPackageName())) target = c;
        }
        return target;
    }

    /** Jumps to a position in the session's track, when the app allows seeking. */
    static boolean seek(Context context, String pkg, long ms) {
        try {
            MediaController c = session(context, pkg);
            PlaybackState s = c == null ? null : c.getPlaybackState();
            if (s == null || (s.getActions() & PlaybackState.ACTION_SEEK_TO) == 0) return false;
            c.getTransportControls().seekTo(Math.max(0, ms));
            return true;
        } catch (Exception e) { return false; }
    }

    /** The music view: everything info() gives, playing or paused, plus album, position (ms, as of now), duration and seekability. */
    static String detail(Context context, String pkg, boolean lookup) {
        JSONObject out = new JSONObject();
        try {
            out.put("access", true).put("found", false);
            MediaController c = session(context, pkg);
            if (c == null) return out.toString();
            PlaybackState state = c.getPlaybackState();
            MediaMetadata meta = c.getMetadata();
            if (state == null || meta == null) return out.toString();
            String title = text(meta, MediaMetadata.METADATA_KEY_TITLE, MediaMetadata.METADATA_KEY_DISPLAY_TITLE);
            if (title.isEmpty()) return out.toString();
            String artist = text(meta, MediaMetadata.METADATA_KEY_ARTIST, MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE);
            if (artist.isEmpty()) artist = text(meta, MediaMetadata.METADATA_KEY_ALBUM_ARTIST, MediaMetadata.METADATA_KEY_ALBUM);
            String album = text(meta, MediaMetadata.METADATA_KEY_ALBUM, MediaMetadata.METADATA_KEY_ALBUM), owner = c.getPackageName();
            boolean playing = state.getState() == PlaybackState.STATE_PLAYING;
            long pos = state.getPosition();
            if (playing && pos >= 0 && state.getLastPositionUpdateTime() > 0)
                pos += (long) ((SystemClock.elapsedRealtime() - state.getLastPositionUpdateTime()) * state.getPlaybackSpeed());
            String id = art(context, meta, owner + "|" + title + "|" + artist + "|" + album, artist, title, album, lookup);
            out.put("found", true).put("playing", playing).put("title", clip(title)).put("artist", clip(artist)).put("album", clip(album))
                    .put("app", appName(context, owner)).put("pkg", owner)
                    .put("pos", Math.max(0, pos)).put("dur", Math.max(0, meta.getLong(MediaMetadata.METADATA_KEY_DURATION)))
                    .put("speed", playing ? state.getPlaybackSpeed() : 0).put("seek", (state.getActions() & PlaybackState.ACTION_SEEK_TO) != 0);
            if (!id.isEmpty()) out.put("art", "/nowplaying/" + id + ".jpg").put("back", "/nowplaying/" + id + "-b.jpg");
        } catch (SecurityException e) {
            try { out.put("access", false); } catch (Exception ignored) { }
        } catch (Exception ignored) { }
        return out.toString();
    }

    /** Play/pause, next or previous for the playing session, or for pkg's session once it is paused. */
    static boolean control(Context context, String pkg, String action) {
        try {
            MediaController target = session(context, pkg);
            if (target == null) return false;
            MediaController.TransportControls t = target.getTransportControls();
            PlaybackState s = target.getPlaybackState();
            boolean playing = s != null && s.getState() == PlaybackState.STATE_PLAYING;
            switch (action) {
                case "toggle": if (playing) t.pause(); else t.play(); return true;
                case "next": t.skipToNext(); return true;
                case "prev": t.skipToPrevious(); return true;
                default: return false;
            }
        } catch (Exception e) { return false; }
    }

    static String info(Context context, boolean lookup) {
        JSONObject out = new JSONObject();
        try {
            out.put("access", false).put("playing", false);
            MediaSessionManager msm = (MediaSessionManager) context.getSystemService(Context.MEDIA_SESSION_SERVICE);
            if (msm == null) return out.toString();
            List<MediaController> sessions = msm.getActiveSessions(new ComponentName(context, NowPlayingService.class));
            out.put("access", true);
            for (MediaController c : sessions) {
                PlaybackState state = c.getPlaybackState();
                MediaMetadata meta = c.getMetadata();
                if (state == null || state.getState() != PlaybackState.STATE_PLAYING || meta == null) continue;
                String title = text(meta, MediaMetadata.METADATA_KEY_TITLE, MediaMetadata.METADATA_KEY_DISPLAY_TITLE);
                if (title.isEmpty()) continue;
                String artist = text(meta, MediaMetadata.METADATA_KEY_ARTIST, MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE);
                if (artist.isEmpty()) artist = text(meta, MediaMetadata.METADATA_KEY_ALBUM_ARTIST, MediaMetadata.METADATA_KEY_ALBUM);
                String pkg = c.getPackageName();
                String album = text(meta, MediaMetadata.METADATA_KEY_ALBUM, MediaMetadata.METADATA_KEY_ALBUM);
                String id = art(context, meta, pkg + "|" + title + "|" + artist + "|" + album, artist, title, album, lookup);
                out.put("playing", true).put("title", clip(title)).put("artist", clip(artist)).put("app", appName(context, pkg)).put("pkg", pkg);
                if (!id.isEmpty()) out.put("art", "/nowplaying/" + id + ".jpg").put("back", "/nowplaying/" + id + "-b.jpg");
                String wide = lookup ? wide(context, artist) : "";
                if (!wide.isEmpty()) out.put("wide", "/nowplaying/a/" + wide + ".jpg");
                return out.toString();
            }
        } catch (SecurityException e) {
            // Notification access not granted: access stays false.
        } catch (Exception ignored) { }
        return out.toString();
    }

    /** Writes the cover once per track: a sharp square and a soft, dimmed 16:9 backdrop. Returns "" without a cover.
     *  A small or missing cover is replaced by iTunes' 1000 px artwork when lookups are allowed. */
    private static String art(final Context context, MediaMetadata meta, final String key, final String artist, final String title, final String album, boolean lookup) {
        synchronized (ART_LOCK) {
            if (key.equals(artKey)) return artId;
            artKey = key; artId = "";
            Bitmap cover = cover(context, meta);
            if (cover != null) artId = write(context, key, cover);
            if (lookup && !artist.isEmpty() && (cover == null || Math.min(cover.getWidth(), cover.getHeight()) < 600)) NET.execute(() -> {
                Bitmap hi = itunesCover(artist, title, album);
                if (hi == null) hi = lastfmCover(artist, title, album);
                if (hi == null) return;
                synchronized (ART_LOCK) {
                    if (!key.equals(artKey)) return; // the track changed meanwhile
                    String id = write(context, key, hi);
                    if (!id.isEmpty()) artId = id;
                }
            });
            return artId;
        }
    }

    private static String write(Context context, String key, Bitmap cover) {
        File dir = new File(context.getCacheDir(), "nowplaying");
        File[] old = dir.listFiles();
        if (old != null) for (File f : old) f.delete();
        if (!dir.isDirectory() && !dir.mkdirs()) return "";
        String id = Integer.toHexString(key.hashCode()) + Long.toHexString(System.currentTimeMillis() & 0xffffff);
        try {
            save(square(cover, 800), new File(dir, id + ".jpg"), 90);
            save(backdrop(cover), new File(dir, id + "-b.jpg"), 90);
            return id;
        } catch (Exception | OutOfMemoryError e) { return ""; }
    }

    /** iTunes Search (no key): the track's artwork, asked for at 1000 px. */
    private static Bitmap itunesCover(String artist, String title, String album) {
        try {
            String term = URLEncoder.encode(artist + " " + (album.isEmpty() ? title : album), "UTF-8");
            byte[] body = fetch("https://itunes.apple.com/search?media=music&entity=" + (album.isEmpty() ? "song" : "album") + "&limit=1&term=" + term, 200000);
            if (body == null) return null;
            JSONArray results = new JSONObject(new String(body, "UTF-8")).optJSONArray("results");
            JSONObject hit = results == null ? null : results.optJSONObject(0);
            if (hit == null || !same(hit.optString("artistName"), artist)) return null;
            String url = hit.optString("artworkUrl100");
            if (!url.startsWith("https://")) return null;
            byte[] img = fetch(url.replace("100x100bb", "1000x1000bb"), 4000000);
            return img == null ? null : BitmapFactory.decodeByteArray(img, 0, img.length);
        } catch (Exception | OutOfMemoryError e) { return null; }
    }

    /** Last.fm (optional key in local.properties): the album's cover, or the track's album when the app names none; full size. */
    private static Bitmap lastfmCover(String artist, String title, String album) {
        if (BuildConfig.LASTFM_API_KEY.isEmpty()) return null;
        try {
            String base = "https://ws.audioscrobbler.com/2.0/?format=json&autocorrect=1&api_key=" + URLEncoder.encode(BuildConfig.LASTFM_API_KEY, "UTF-8") + "&artist=" + URLEncoder.encode(artist, "UTF-8");
            byte[] body = fetch(base + (album.isEmpty() ? "&method=track.getInfo&track=" + URLEncoder.encode(title, "UTF-8") : "&method=album.getInfo&album=" + URLEncoder.encode(album, "UTF-8")), 400000);
            if (body == null) return null;
            JSONObject root = new JSONObject(new String(body, "UTF-8")), item = album.isEmpty() ? root.optJSONObject("track") : root.optJSONObject("album");
            if (item != null && album.isEmpty()) item = item.optJSONObject("album");
            JSONArray images = item == null ? null : item.optJSONArray("image");
            String url = "";
            for (int i = 0; images != null && i < images.length(); i++) { String u = images.getJSONObject(i).optString("#text"); if (u.startsWith("https://")) url = u; } // largest last
            if (url.isEmpty() || url.contains("2a96cbd8b46e442fc41c2b86b821562f")) return null; // Last.fm's grey star placeholder
            byte[] img = fetch(url.replaceAll("/i/u/[0-9a-z]+x[0-9a-z]+/", "/i/u/"), 6000000); // the original instead of 300 px
            if (img == null) img = fetch(url, 2000000);
            return img == null ? null : BitmapFactory.decodeByteArray(img, 0, img.length);
        } catch (Exception | OutOfMemoryError e) { return null; }
    }

    /** A wide picture of the artist from TheAudioDB (fan art, otherwise the wide thumb), kept for 30 days per artist. */
    private static String wide(final Context context, final String artist) {
        final String k = artist.trim().toLowerCase(Locale.ROOT);
        if (k.isEmpty() || k.length() > 120) return "";
        final String name = Integer.toHexString(k.hashCode()) + Integer.toHexString(k.length());
        synchronized (WIDE) {
            if (WIDE.containsKey(k)) return WIDE.get(k);
            WIDE.put(k, "");
        }
        final File dir = new File(context.getCacheDir(), "nowplaying-artists"), file = new File(dir, name + ".jpg"), none = new File(dir, name + ".none");
        long month = 30L * 24 * 3600 * 1000, now = System.currentTimeMillis();
        if (file.isFile() && now - file.lastModified() < month) { synchronized (WIDE) { WIDE.put(k, name); } return name; }
        if (none.isFile() && now - none.lastModified() < month / 4) return "";
        NET.execute(() -> {
            try {
                byte[] body = fetch("https://www.theaudiodb.com/api/v1/json/123/search.php?s=" + URLEncoder.encode(artist.trim(), "UTF-8"), 400000);
                JSONArray list = body == null ? null : new JSONObject(new String(body, "UTF-8")).optJSONArray("artists");
                JSONObject a = list == null ? null : list.optJSONObject(0);
                String url = "";
                if (a != null && same(a.optString("strArtist"), artist))
                    for (String f : new String[] { "strArtistFanart", "strArtistFanart2", "strArtistFanart3", "strArtistWideThumb" }) {
                        String u = a.optString(f, "");
                        if (u.startsWith("https://")) { url = u; break; }
                    }
                Bitmap b = url.isEmpty() ? null : decodeWide(fetch(url, 8000000));
                if (!dir.isDirectory()) dir.mkdirs();
                trim(dir, 40);
                if (b == null) { new FileOutputStream(none).close(); return; }
                save(b, file, 90);
                synchronized (WIDE) { WIDE.put(k, name); }
            } catch (Exception | OutOfMemoryError ignored) { }
        });
        return "";
    }

    /** Names match ignoring case, accents aside ("Beyonce" vs "Beyoncé" just misses, which is fine). */
    private static boolean same(String a, String b) { return a != null && a.trim().equalsIgnoreCase(b.trim()); }

    /** Decodes at no more than about 2x the screen, then crops to 16:9 at 1920x1080 and dims it slightly for the text. */
    private static Bitmap decodeWide(byte[] data) {
        if (data == null) return null;
        BitmapFactory.Options o = new BitmapFactory.Options();
        o.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(data, 0, data.length, o);
        if (o.outWidth < 960 || o.outHeight < 400) return null; // too small to look good full screen
        o.inJustDecodeBounds = false;
        o.inSampleSize = 1;
        while (o.outWidth / (o.inSampleSize * 2) >= 1920) o.inSampleSize *= 2;
        Bitmap src = BitmapFactory.decodeByteArray(data, 0, data.length, o);
        if (src == null) return null;
        int w = src.getWidth(), h = src.getHeight(), cropH = Math.min(h, w * 9 / 16), cropW = Math.min(w, h * 16 / 9);
        Rect from = new Rect((w - cropW) / 2, Math.max(0, (h - cropH) / 3), (w + cropW) / 2, Math.max(0, (h - cropH) / 3) + cropH);
        Bitmap out = Bitmap.createBitmap(1920, 1080, Bitmap.Config.ARGB_8888);
        ColorMatrix dim = new ColorMatrix();
        dim.setScale(.86f, .86f, .86f, 1f);
        Paint p = new Paint(Paint.FILTER_BITMAP_FLAG);
        p.setColorFilter(new ColorMatrixColorFilter(dim));
        new Canvas(out).drawBitmap(src, from, new Rect(0, 0, 1920, 1080), p);
        return out;
    }

    private static void trim(File dir, int keep) {
        File[] files = dir.listFiles();
        if (files == null || files.length <= keep) return;
        Arrays.sort(files, (x, y) -> Long.compare(x.lastModified(), y.lastModified()));
        for (int i = 0; i < files.length - keep; i++) files[i].delete();
    }

    private static byte[] fetch(String url, int max) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(8000); c.setReadTimeout(15000);
            c.setRequestProperty("User-Agent", UA);
            if (c.getResponseCode() != 200) return null;
            try (InputStream in = c.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                byte[] buf = new byte[16384];
                int n, total = 0;
                while ((n = in.read(buf)) > 0) { total += n; if (total > max) return null; out.write(buf, 0, n); }
                return out.toByteArray();
            }
        } catch (Exception e) { return null; }
        finally { if (c != null) c.disconnect(); }
    }

    private static Bitmap cover(Context context, MediaMetadata meta) {
        String[] bitmaps = { MediaMetadata.METADATA_KEY_ALBUM_ART, MediaMetadata.METADATA_KEY_ART, MediaMetadata.METADATA_KEY_DISPLAY_ICON };
        for (String k : bitmaps) { Bitmap b = meta.getBitmap(k); if (b != null && b.getWidth() >= 32 && b.getHeight() >= 32) return b; }
        String[] uris = { MediaMetadata.METADATA_KEY_ALBUM_ART_URI, MediaMetadata.METADATA_KEY_ART_URI, MediaMetadata.METADATA_KEY_DISPLAY_ICON_URI };
        for (String k : uris) {
            String u = meta.getString(k);
            if (u == null || !(u.startsWith("content:") || u.startsWith("android.resource:"))) continue; // web covers are not fetched
            try (InputStream in = context.getContentResolver().openInputStream(Uri.parse(u))) {
                BitmapFactory.Options o = new BitmapFactory.Options();
                o.inSampleSize = 1;
                Bitmap b = in == null ? null : BitmapFactory.decodeStream(in, null, o);
                if (b != null) return b;
            } catch (Exception | OutOfMemoryError ignored) { }
        }
        return null;
    }

    private static Bitmap square(Bitmap src, int size) {
        int side = Math.min(src.getWidth(), src.getHeight());
        Rect from = new Rect((src.getWidth() - side) / 2, (src.getHeight() - side) / 2, (src.getWidth() + side) / 2, (src.getHeight() + side) / 2);
        Bitmap out = Bitmap.createBitmap(Math.min(size, side), Math.min(size, side), Bitmap.Config.ARGB_8888);
        new Canvas(out).drawBitmap(src, from, new Rect(0, 0, out.getWidth(), out.getHeight()), new Paint(Paint.FILTER_BITMAP_FLAG));
        return out;
    }

    /** Box-averaged down to 64x36, smoothed, then drawn back up to 1280x720 with a little noise so the soft
     *  gradients don't band. Made once per track on the CPU; the page only shows the finished image. */
    private static Bitmap backdrop(Bitmap src) {
        int w = src.getWidth(), h = src.getHeight(), cropH = Math.min(h, w * 9 / 16), cropW = Math.min(w, h * 16 / 9);
        Rect from = new Rect((w - cropW) / 2, (h - cropH) / 2, (w + cropW) / 2, (h + cropH) / 2);
        Bitmap b = Bitmap.createBitmap(1024, 576, Bitmap.Config.ARGB_8888);
        new Canvas(b).drawBitmap(src, from, new Rect(0, 0, 1024, 576), new Paint(Paint.FILTER_BITMAP_FLAG));
        while (b.getWidth() > 64) b = Bitmap.createScaledBitmap(b, b.getWidth() / 2, b.getHeight() / 2, true);
        for (int pass = 0; pass < 2; pass++) {
            b = Bitmap.createScaledBitmap(b, 256, 144, true);
            b = Bitmap.createScaledBitmap(b, 96, 54, true);
        }
        b = Bitmap.createScaledBitmap(b, 320, 180, true);
        b = Bitmap.createScaledBitmap(b, 640, 360, true);
        Bitmap out = Bitmap.createBitmap(1280, 720, Bitmap.Config.ARGB_8888);
        ColorMatrix m = new ColorMatrix();
        m.setSaturation(1.2f);
        ColorMatrix dim = new ColorMatrix();
        dim.setScale(.74f, .74f, .74f, 1f);
        m.postConcat(dim);
        Paint p = new Paint(Paint.FILTER_BITMAP_FLAG);
        p.setColorFilter(new ColorMatrixColorFilter(m));
        new Canvas(out).drawBitmap(b, null, new Rect(0, 0, 1280, 720), p);
        int[] px = new int[1280 * 720];
        out.getPixels(px, 0, 1280, 0, 0, 1280, 720);
        Random r = new Random(7);
        for (int i = 0; i < px.length; i++) {
            int n = r.nextInt(5) - 2, c = px[i];
            int red = Math.max(0, Math.min(255, ((c >> 16) & 255) + n)), g = Math.max(0, Math.min(255, ((c >> 8) & 255) + n)), bl = Math.max(0, Math.min(255, (c & 255) + n));
            px[i] = 0xff000000 | (red << 16) | (g << 8) | bl;
        }
        out.setPixels(px, 0, 1280, 0, 0, 1280, 720);
        return out;
    }

    private static void save(Bitmap b, File f, int quality) throws Exception {
        try (FileOutputStream out = new FileOutputStream(f)) { b.compress(Bitmap.CompressFormat.JPEG, quality, out); }
    }

    /** Serves /nowplaying/<id>.jpg and /nowplaying/<id>-b.jpg from the cache. */
    static WebViewAssetLoader.PathHandler handler(Context context) {
        final Context app = context.getApplicationContext();
        return path -> {
            File f;
            if (path.matches("[0-9a-f]+(-b)?\\.jpg")) f = new File(new File(app.getCacheDir(), "nowplaying"), path);
            else if (path.matches("a/[0-9a-f]+\\.jpg")) f = new File(new File(app.getCacheDir(), "nowplaying-artists"), path.substring(2));
            else return null;
            try {
                WebResourceResponse r = new WebResourceResponse("image/jpeg", null, new FileInputStream(f));
                java.util.Map<String, String> headers = new java.util.HashMap<>();
                headers.put("Cache-Control", "max-age=86400");
                r.setResponseHeaders(headers);
                return r;
            } catch (Exception e) { return null; }
        };
    }

    private static String text(MediaMetadata meta, String key, String fallback) {
        CharSequence s = meta.getText(key);
        if (s == null || s.length() == 0) s = meta.getText(fallback);
        return s == null ? "" : s.toString().trim();
    }

    private static String clip(String s) { return s.length() > 120 ? s.substring(0, 117) + "…" : s; }

    private static String appName(Context context, String pkg) {
        try {
            PackageManager pm = context.getPackageManager();
            ApplicationInfo info = pm.getApplicationInfo(pkg, 0);
            return pm.getApplicationLabel(info).toString();
        } catch (Exception e) { return ""; }
    }
}
