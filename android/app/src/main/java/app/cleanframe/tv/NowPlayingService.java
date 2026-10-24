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
import android.service.notification.NotificationListenerService;
import android.webkit.WebResourceResponse;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.List;

/**
 * Lets CleanFrame read the active media sessions (title, artist, app) for the "Now playing" line.
 * Android only hands media sessions to an enabled notification listener, so the user has to allow
 * CleanFrame in Settings > Apps > Special app access > Notification access. Notifications themselves are ignored.
 */
public class NowPlayingService extends NotificationListenerService {
    private static final Object ART_LOCK = new Object();
    private static String artKey = "", artId = "";

    /** {access, playing, title, artist, app, pkg, art, back}. playing is false when nothing is playing or access is missing.
     *  art is the cover (/nowplaying/<id>.jpg) and back a soft, dimmed full-screen version of it; both are empty without a cover. */
    static String info(Context context) {
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
                String id = art(context, meta, pkg + "|" + title + "|" + artist + "|" + text(meta, MediaMetadata.METADATA_KEY_ALBUM, MediaMetadata.METADATA_KEY_ALBUM));
                out.put("playing", true).put("title", clip(title)).put("artist", clip(artist)).put("app", appName(context, pkg)).put("pkg", pkg);
                if (!id.isEmpty()) out.put("art", "/nowplaying/" + id + ".jpg").put("back", "/nowplaying/" + id + "-b.jpg");
                return out.toString();
            }
        } catch (SecurityException e) {
            // Notification access not granted: access stays false.
        } catch (Exception ignored) { }
        return out.toString();
    }

    /** Writes the cover once per track: a sharp square and a blurred, dimmed 16:9 backdrop. Returns "" without a cover. */
    private static String art(Context context, MediaMetadata meta, String key) {
        synchronized (ART_LOCK) {
            if (key.equals(artKey)) return artId;
            artKey = key; artId = "";
            Bitmap cover = cover(context, meta);
            if (cover == null) return "";
            File dir = new File(context.getCacheDir(), "nowplaying");
            File[] old = dir.listFiles();
            if (old != null) for (File f : old) f.delete();
            if (!dir.isDirectory() && !dir.mkdirs()) return "";
            String id = Integer.toHexString(key.hashCode()) + Long.toHexString(System.currentTimeMillis() & 0xffffff);
            try {
                save(square(cover, 512), new File(dir, id + ".jpg"), 90);
                save(backdrop(cover), new File(dir, id + "-b.jpg"), 86);
                artId = id;
            } catch (Exception e) { artId = ""; }
            return artId;
        }
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

    /** Box-averaged down to 32x18, then smoothly back up: a cheap, strong blur that never runs in the WebView. */
    private static Bitmap backdrop(Bitmap src) {
        int w = src.getWidth(), h = src.getHeight(), cropH = Math.min(h, w * 9 / 16), cropW = Math.min(w, h * 16 / 9);
        Rect from = new Rect((w - cropW) / 2, (h - cropH) / 2, (w + cropW) / 2, (h + cropH) / 2);
        Bitmap b = Bitmap.createBitmap(512, 288, Bitmap.Config.ARGB_8888);
        new Canvas(b).drawBitmap(src, from, new Rect(0, 0, 512, 288), new Paint(Paint.FILTER_BITMAP_FLAG));
        while (b.getWidth() > 32) b = Bitmap.createScaledBitmap(b, b.getWidth() / 2, b.getHeight() / 2, true);
        for (int pass = 0; pass < 2; pass++) {
            b = Bitmap.createScaledBitmap(b, 128, 72, true);
            b = Bitmap.createScaledBitmap(b, 48, 27, true);
        }
        Bitmap out = Bitmap.createBitmap(640, 360, Bitmap.Config.ARGB_8888);
        ColorMatrix m = new ColorMatrix();
        m.setSaturation(1.25f);
        ColorMatrix dim = new ColorMatrix();
        dim.setScale(.72f, .72f, .72f, 1f);
        m.postConcat(dim);
        Paint p = new Paint(Paint.FILTER_BITMAP_FLAG);
        p.setColorFilter(new ColorMatrixColorFilter(m));
        new Canvas(out).drawBitmap(Bitmap.createScaledBitmap(b, 160, 90, true), null, new Rect(0, 0, 640, 360), p);
        return out;
    }

    private static void save(Bitmap b, File f, int quality) throws Exception {
        try (FileOutputStream out = new FileOutputStream(f)) { b.compress(Bitmap.CompressFormat.JPEG, quality, out); }
    }

    /** Serves /nowplaying/<id>.jpg and /nowplaying/<id>-b.jpg from the cache. */
    static WebViewAssetLoader.PathHandler handler(Context context) {
        final Context app = context.getApplicationContext();
        return path -> {
            if (!path.matches("[0-9a-f]+(-b)?\\.jpg")) return null;
            File f = new File(new File(app.getCacheDir(), "nowplaying"), path);
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
