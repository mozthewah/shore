package app.cleanframe.tv;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.ContentObserver;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.media.tv.TvContract;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.WebResourceResponse;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Continue watching: the rows apps publish to the system's Watch Next list. Reading other apps' rows
 * needs READ_TV_LISTINGS (a runtime permission, also grantable over adb); without
 * ACCESS_ALL_EPG_DATA the provider returns only rows marked searchable and refuses any selection,
 * so the whole table is read and filtered here. Card images are cached at 480x270 and served at
 * /watchnext/img/<id>.jpg.
 */
final class WatchNext {
    interface Listener { void changed(); }

    static final String PERMISSION = "android.permission.READ_TV_LISTINGS";
    private static final int MAX_ITEMS = 12, CARD_W = 480, CARD_H = 270;
    private static final String[] COLUMNS = { TvContract.WatchNextPrograms._ID, TvContract.WatchNextPrograms.COLUMN_PACKAGE_NAME,
            TvContract.WatchNextPrograms.COLUMN_TITLE, TvContract.WatchNextPrograms.COLUMN_EPISODE_TITLE,
            TvContract.WatchNextPrograms.COLUMN_SEASON_DISPLAY_NUMBER, TvContract.WatchNextPrograms.COLUMN_EPISODE_DISPLAY_NUMBER,
            TvContract.WatchNextPrograms.COLUMN_WATCH_NEXT_TYPE, TvContract.WatchNextPrograms.COLUMN_LAST_ENGAGEMENT_TIME_UTC_MILLIS,
            TvContract.WatchNextPrograms.COLUMN_LAST_PLAYBACK_POSITION_MILLIS, TvContract.WatchNextPrograms.COLUMN_DURATION_MILLIS,
            TvContract.WatchNextPrograms.COLUMN_POSTER_ART_URI, TvContract.WatchNextPrograms.COLUMN_THUMBNAIL_URI,
            TvContract.WatchNextPrograms.COLUMN_INTENT_URI, TvContract.WatchNextPrograms.COLUMN_BROWSABLE };

    private final Context context;
    private final File imgDir;
    private final Map<String, String[]> rows = new HashMap<>(); // id -> {package, intent uri, image uri}
    private volatile Listener listener;
    private boolean observing;

    private static WatchNext instance;

    static synchronized WatchNext get(Context context) {
        if (instance == null) instance = new WatchNext(context);
        return instance;
    }

    private WatchNext(Context context) {
        this.context = context.getApplicationContext();
        imgDir = new File(this.context.getCacheDir(), "watchnext");
        imgDir.mkdirs();
    }

    void setListener(Listener l) { listener = l; }

    boolean allowed() { return context.checkSelfPermission(PERMISSION) == PackageManager.PERMISSION_GRANTED; }

    /** {allowed, items:[{id, pkg, title, sub, progress, left, card}]}, most recent first. */
    String list() {
        JSONObject out = new JSONObject();
        JSONArray items = new JSONArray();
        try {
            out.put("allowed", allowed());
            if (!allowed()) return out.put("items", items).toString();
            observe();
            PackageManager pm = context.getPackageManager();
            List<JSONObject> found = new ArrayList<>();
            Map<String, String[]> next = new HashMap<>();
            try (Cursor c = context.getContentResolver().query(TvContract.WatchNextPrograms.CONTENT_URI, COLUMNS, null, null, null)) {
                while (c != null && c.moveToNext()) {
                    String id = String.valueOf(c.getLong(0)), pkg = c.getString(1), title = c.getString(2), intent = c.getString(12);
                    if (c.getInt(13) == 0 || pkg == null || title == null || title.isEmpty() || intent == null) continue;
                    if (pkg.equals(context.getPackageName()) || pm.getLaunchIntentForPackage(pkg) == null && pm.getLeanbackLaunchIntentForPackage(pkg) == null) continue;
                    long pos = c.getLong(8), dur = c.getLong(9);
                    String image = c.getString(10) != null ? c.getString(10) : c.getString(11);
                    StringBuilder sub = new StringBuilder();
                    if (c.getString(4) != null && c.getString(5) != null) sub.append('S').append(c.getString(4)).append(" E").append(c.getString(5));
                    else if (c.getString(3) != null) sub.append(c.getString(3));
                    JSONObject it = new JSONObject().put("id", id).put("pkg", pkg).put("title", title).put("sub", sub.toString())
                            .put("type", c.getInt(6)).put("at", c.getLong(7))
                            .put("progress", dur > 0 ? Math.max(0, Math.min(1, pos / (double) dur)) : 0)
                            .put("left", dur > 0 && pos > 0 ? Math.max(0, (dur - pos) / 60000) : -1)
                            .put("card", image == null ? "" : "/watchnext/img/" + id + ".jpg");
                    found.add(it);
                    next.put(id, new String[] { pkg, intent, image });
                }
            }
            found.sort((a, b) -> Long.compare(b.optLong("at"), a.optLong("at")));
            for (int i = 0; i < found.size() && i < MAX_ITEMS; i++) items.put(found.get(i));
            synchronized (rows) { rows.clear(); rows.putAll(next); }
            out.put("items", items);
        } catch (Exception e) {
            Log.w("ShoreWatchNext", "read failed", e);
            try { out.put("items", items); } catch (Exception ignored) { }
        }
        return out.toString();
    }

    /** Opens the row's own deep link, falling back to the app. */
    boolean open(String id) {
        String[] row;
        synchronized (rows) { row = rows.get(id); }
        if (row == null) return false;
        try {
            Intent i = Intent.parseUri(row[1], Intent.URI_INTENT_SCHEME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            i.setSelector(null);
            if (i.getComponent() == null) i.setPackage(row[0]); // the row's own app, never a chooser
            else if (!row[0].equals(i.getComponent().getPackageName())) throw new SecurityException("foreign target");
            context.startActivity(i);
            return true;
        } catch (Exception e) {
            PackageManager pm = context.getPackageManager();
            Intent launch = pm.getLeanbackLaunchIntentForPackage(row[0]);
            if (launch == null) launch = pm.getLaunchIntentForPackage(row[0]);
            if (launch == null) return false;
            try { context.startActivity(launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return true; } catch (Exception ignored) { return false; }
        }
    }

    private void observe() {
        if (observing) return;
        observing = true;
        context.getContentResolver().registerContentObserver(TvContract.WatchNextPrograms.CONTENT_URI, true, new ContentObserver(new Handler(Looper.getMainLooper())) {
            @Override public void onChange(boolean self) { Listener l = listener; if (l != null) l.changed(); }
        });
    }

    WebViewAssetLoader.PathHandler handler() {
        return path -> {
            if (!path.matches("img/[0-9]{1,18}\\.jpg")) return null;
            String id = path.substring(4, path.length() - 4);
            String[] row;
            synchronized (rows) { row = rows.get(id); }
            if (row == null || row[2] == null) return null;
            File f = new File(imgDir, Integer.toHexString(row[2].hashCode()) + ".jpg");
            try {
                if (!f.exists()) card(row[2], f);
                return new WebResourceResponse("image/jpeg", null, new FileInputStream(f));
            } catch (Exception e) { return null; }
        };
    }

    /** Fetches the image (content, resource or https) and centre-crops it to a 16:9 card. */
    private void card(String uri, File out) throws Exception {
        byte[] data;
        Uri u = Uri.parse(uri);
        String scheme = u.getScheme();
        if ("https".equals(scheme) || "http".equals(scheme)) {
            HttpURLConnection c = (HttpURLConnection) new URL(uri).openConnection();
            c.setConnectTimeout(10000); c.setReadTimeout(20000);
            c.setRequestProperty("User-Agent", OnlineWallpapers.UA);
            try (InputStream in = c.getInputStream()) { data = OnlineWallpapers.readAll(in, 8 << 20); } finally { c.disconnect(); }
        } else if (ContentResolver.SCHEME_CONTENT.equals(scheme) || ContentResolver.SCHEME_ANDROID_RESOURCE.equals(scheme)) {
            try (InputStream in = context.getContentResolver().openInputStream(u)) { data = OnlineWallpapers.readAll(in, 8 << 20); }
        } else throw new IllegalArgumentException("unsupported image");
        BitmapFactory.Options o = new BitmapFactory.Options();
        o.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(data, 0, data.length, o);
        int sample = 1;
        while (o.outWidth / (sample * 2) >= CARD_W && o.outHeight / (sample * 2) >= CARD_H) sample *= 2;
        o = new BitmapFactory.Options(); o.inSampleSize = sample;
        Bitmap src = BitmapFactory.decodeByteArray(data, 0, data.length, o);
        if (src == null) throw new IllegalArgumentException("not an image");
        float scale = Math.max(CARD_W / (float) src.getWidth(), CARD_H / (float) src.getHeight());
        int w = Math.round(CARD_W / scale), h = Math.round(CARD_H / scale), x = (src.getWidth() - w) / 2, y = (src.getHeight() - h) / 2;
        Bitmap dst = Bitmap.createBitmap(CARD_W, CARD_H, Bitmap.Config.RGB_565);
        new Canvas(dst).drawBitmap(src, new Rect(x, y, x + w, y + h), new Rect(0, 0, CARD_W, CARD_H), new Paint(Paint.FILTER_BITMAP_FLAG));
        File tmp = new File(out.getPath() + ".tmp");
        try (FileOutputStream os = new FileOutputStream(tmp)) { dst.compress(Bitmap.CompressFormat.JPEG, 85, os); }
        src.recycle(); dst.recycle();
        if (!tmp.renameTo(out)) throw new IllegalStateException("cache write failed");
    }
}
