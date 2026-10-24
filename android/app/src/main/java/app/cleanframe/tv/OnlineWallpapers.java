package app.cleanframe.tv;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Shader;
import android.media.MediaMetadataRetriever;
import android.webkit.WebResourceResponse;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.Set;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Online photo sources. Each photo is downloaded once and turned into the same files the bundled
 * gallery ships with (1920x1080 photo, thumbnail, panel, four registered material fields), so the
 * web UI never blurs or reads pixels at runtime. Files are served under assets/ by {@link #handler()}.
 */
final class OnlineWallpapers {
    interface Listener { void changed(String entriesJson, String status); }

    static final String[] SOURCES = { "off", "nasa", "bing", "wikimedia", "picsum", "unsplash-nature", "unsplash-city", "unsplash-space",
            "loops", "pexels-ocean", "pexels-rain", "pexels-clouds", "pexels-city", "klipy-lofi", "klipy-rain", "klipy-space" };
    private static final int MAX_PHOTOS = 8, W = 1920, H = 1080;
    private static final long REFRESH_MS = 6L * 60 * 60 * 1000;
    static final String UA = "CleanFrame-TCL/1.0 (Android TV home screen; https://github.com/taynotfound/CleanFrame-TCL)";

    private final Context context;
    private final File root, wallDir, matDir, index;
    private final SharedPreferences prefs;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private volatile Listener listener;
    private volatile boolean busy;

    OnlineWallpapers(Context context) {
        this.context = context.getApplicationContext();
        root = new File(this.context.getFilesDir(), "online");
        wallDir = new File(root, "wallpapers");
        matDir = new File(root, "materials");
        index = new File(root, "index.json");
        prefs = this.context.getSharedPreferences("online-wallpapers", Context.MODE_PRIVATE);
        wallDir.mkdirs(); matDir.mkdirs();
    }

    void setListener(Listener l) { listener = l; }

    static boolean unsplashAvailable() { return !BuildConfig.UNSPLASH_ACCESS_KEY.isEmpty(); }
    static boolean pexelsAvailable() { return !BuildConfig.PEXELS_API_KEY.isEmpty(); }
    static boolean klipyAvailable() { return !BuildConfig.KLIPY_API_KEY.isEmpty(); }

    /** Anonymous per-install id that Klipy's API requires; not linked to any account. */
    private String customerId() {
        String id = prefs.getString("klipy-customer", null);
        if (id == null) { id = java.util.UUID.randomUUID().toString(); prefs.edit().putString("klipy-customer", id).apply(); }
        return id;
    }

    String source() { return prefs.getString("source", "off"); }

    /** Called from the page. A new source refreshes immediately; the same source refreshes when stale. */
    void select(String source, boolean force) {
        boolean known = false;
        for (String s : SOURCES) if (s.equals(source)) known = true;
        if (!known) return;
        boolean changed = !source.equals(source());
        prefs.edit().putString("source", source).apply();
        if (source.equals("off")) { worker.execute(() -> { writeIndex(new JSONArray()); clean(new HashSet<>()); notifyChanged("off"); }); return; }
        long age = System.currentTimeMillis() - prefs.getLong("refreshed", 0);
        if (changed || force || age > REFRESH_MS) refresh();
    }

    void refreshIfStale() {
        if (!source().equals("off") && System.currentTimeMillis() - prefs.getLong("refreshed", 0) > REFRESH_MS) refresh();
    }

    private void refresh() {
        if (busy) return;
        busy = true;
        final String source = source();
        notifyStatus("loading");
        worker.execute(() -> {
            String status = "ready";
            try {
                List<Photo> photos = fetch(source);
                JSONArray entries = new JSONArray();
                Set<String> keep = new HashSet<>();
                for (Photo p : photos) {
                    if (entries.length() >= MAX_PHOTOS) break;
                    if (!source.equals(source())) return; // superseded by another choice
                    try {
                        if (!new File(wallDir, p.id + ".jpg").exists() || p.video && !new File(wallDir, p.id + ".mp4").exists()) build(p);
                        entries.put(entry(p));
                        keep.add(p.id);
                    } catch (Exception ignored) { /* skip one bad photo, keep the rest */ }
                }
                if (entries.length() == 0) status = "empty";
                else {
                    writeIndex(entries);
                    clean(keep);
                    prefs.edit().putLong("refreshed", System.currentTimeMillis()).apply();
                }
            } catch (Exception e) {
                status = "error";
            } finally {
                busy = false;
            }
            notifyChanged(status);
        });
    }

    /** JSON array of gallery entries for the page (same shape as catalog.js entries). */
    String entries() {
        try { return readIndex().toString(); } catch (Exception e) { return "[]"; }
    }

    // ---------- Sources ----------

    private static final class Photo {
        String id, name, url, credit;
        boolean video; // MP4 loop: url is https:// or asset:<path>
        Photo(String id, String name, String url, String credit) { this.id = id; this.name = name; this.url = url; this.credit = credit; }
        Photo loop() { video = true; return this; }
    }

    private List<Photo> fetch(String source) throws Exception {
        List<Photo> out = new ArrayList<>();
        if (source.equals("nasa")) {
            Calendar from = Calendar.getInstance(TimeZone.getTimeZone("America/New_York"));
            from.add(Calendar.DAY_OF_YEAR, -20);
            String start = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(from.getTime());
            JSONArray days = new JSONArray(get("https://api.nasa.gov/planetary/apod?thumbs=false&api_key="
                    + BuildConfig.NASA_API_KEY + "&start_date=" + start));
            for (int i = days.length() - 1; i >= 0; i--) {
                JSONObject d = days.getJSONObject(i);
                if (!"image".equals(d.optString("media_type"))) continue;
                String url = d.optString("hdurl", d.optString("url"));
                if (!url.startsWith("https://")) continue;
                out.add(new Photo("nasa-" + d.getString("date"), d.optString("title", "Astronomy Picture"), url,
                        d.has("copyright") ? "© " + d.getString("copyright").trim() + " · NASA APOD" : "NASA APOD"));
            }
        } else if (source.equals("bing")) {
            JSONArray images = new JSONObject(get("https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8&mkt=de-DE")).getJSONArray("images");
            for (int i = 0; i < images.length(); i++) {
                JSONObject im = images.getJSONObject(i);
                String title = im.optString("title");
                String copy = im.optString("copyright");
                if (title.isEmpty()) title = copy.contains(" (") ? copy.substring(0, copy.indexOf(" (")) : "Bing photo";
                out.add(new Photo("bing-" + im.getString("startdate"), title,
                        "https://www.bing.com" + im.getString("urlbase") + "_1920x1080.jpg", copy.contains("(") ? copy.substring(copy.indexOf('(') + 1).replace(")", "") : "Bing"));
            }
        } else if (source.equals("wikimedia")) {
            Calendar day = Calendar.getInstance(TimeZone.getTimeZone("UTC"));
            SimpleDateFormat path = new SimpleDateFormat("yyyy/MM/dd", Locale.US), id = new SimpleDateFormat("yyyyMMdd", Locale.US);
            path.setTimeZone(TimeZone.getTimeZone("UTC")); id.setTimeZone(TimeZone.getTimeZone("UTC"));
            for (int i = 0; i < 16 && out.size() < MAX_PHOTOS; i++, day.add(Calendar.DAY_OF_YEAR, -1)) {
                try {
                    JSONObject feed = new JSONObject(get("https://api.wikimedia.org/feed/v1/wikipedia/en/featured/" + path.format(day.getTime())));
                    JSONObject im = feed.optJSONObject("image");
                    if (im == null) continue;
                    JSONObject orig = im.getJSONObject("image");
                    if (orig.getInt("width") < orig.getInt("height") * 1.25) continue; // landscape only
                    JSONObject thumb = im.optJSONObject("thumbnail");
                    String url = orig.getString("source");
                    if (orig.getInt("width") > 4000 && thumb != null) url = url.replace("/commons/", "/commons/thumb/") + "/2560px-" + url.substring(url.lastIndexOf('/') + 1);
                    JSONObject artist = im.optJSONObject("artist");
                    String name = im.optJSONObject("description") != null ? im.getJSONObject("description").optString("text") : "";
                    if (name.isEmpty() || name.length() > 60) name = im.optString("title").replace("File:", "").replaceAll("\\.[A-Za-z]+$", "").replace('_', ' ');
                    if (name.length() > 60) name = name.substring(0, 57) + "…";
                    out.add(new Photo("wiki-" + id.format(day.getTime()), name, url,
                            (artist != null ? artist.optString("text", "Wikimedia Commons") : "Wikimedia Commons") + " · Wikimedia Commons"));
                } catch (Exception ignored) { }
            }
        } else if (source.equals("picsum")) {
            JSONArray list = new JSONArray(get("https://picsum.photos/v2/list?limit=30&page=" + (1 + new Random().nextInt(30))));
            for (int i = 0; i < list.length() && out.size() < MAX_PHOTOS; i++) {
                JSONObject p = list.getJSONObject(i);
                if (p.getInt("width") < p.getInt("height") * 1.3) continue;
                out.add(new Photo("picsum-" + p.getString("id"), "Photo by " + p.getString("author"),
                        "https://picsum.photos/id/" + p.getString("id") + "/1920/1080", p.getString("author") + " · Unsplash via Picsum"));
            }
        } else if (source.startsWith("unsplash-") && unsplashAvailable()) {
            String query = source.equals("unsplash-city") ? "city architecture" : source.equals("unsplash-space") ? "night sky stars" : "nature landscape";
            JSONArray list = new JSONArray(get("https://api.unsplash.com/photos/random?orientation=landscape&content_filter=high&count="
                    + MAX_PHOTOS + "&query=" + URLEncoder.encode(query, "UTF-8") + "&client_id=" + BuildConfig.UNSPLASH_ACCESS_KEY));
            for (int i = 0; i < list.length(); i++) {
                JSONObject p = list.getJSONObject(i);
                String author = p.getJSONObject("user").optString("name", "Unsplash");
                String desc = p.optString("alt_description", "");
                if (desc.isEmpty() || "null".equals(desc)) desc = "Photo by " + author;
                desc = desc.substring(0, 1).toUpperCase(Locale.ROOT) + desc.substring(1);
                if (desc.length() > 60) desc = desc.substring(0, 57) + "…";
                out.add(new Photo("unsplash-" + p.getString("id").replaceAll("[^A-Za-z0-9_-]", ""), desc,
                        p.getJSONObject("urls").getString("raw") + "&w=1920&h=1080&fit=crop&q=85&fm=jpg", author + " · Unsplash"));
                // Unsplash API guidelines: report the download.
                try { get(p.getJSONObject("links").getString("download_location") + "&client_id=" + BuildConfig.UNSPLASH_ACCESS_KEY); } catch (Exception ignored) { }
            }
        } else if (source.equals("loops")) {
            String[] names = context.getAssets().list("loops");
            if (names != null) for (String n : names) {
                if (!n.endsWith(".mp4")) continue;
                String base = n.substring(0, n.length() - 4);
                out.add(new Photo("loop-" + base, base.substring(0, 1).toUpperCase(Locale.ROOT) + base.substring(1).replace('-', ' '),
                        "asset:loops/" + n, "CleanFrame-TCL · generated loop").loop());
            }
        } else if (source.startsWith("pexels-") && pexelsAvailable()) {
            String query = source.equals("pexels-city") ? "city night timelapse" : source.equals("pexels-clouds") ? "clouds timelapse" : source.equals("pexels-rain") ? "rain window" : "ocean waves";
            JSONArray videos = new JSONObject(get("https://api.pexels.com/videos/search?orientation=landscape&size=medium&per_page=15&query="
                    + URLEncoder.encode(query, "UTF-8"), "Authorization", BuildConfig.PEXELS_API_KEY)).getJSONArray("videos");
            for (int i = 0; i < videos.length() && out.size() < MAX_PHOTOS; i++) {
                JSONObject v = videos.getJSONObject(i);
                if (v.optInt("duration", 0) > 60) continue;
                JSONArray files = v.getJSONArray("video_files");
                String best = null; int bestW = 0;
                for (int f = 0; f < files.length(); f++) {
                    JSONObject file = files.getJSONObject(f);
                    int w = file.optInt("width", 0);
                    if ("video/mp4".equals(file.optString("file_type")) && w <= 1920 && w > bestW && w >= file.optInt("height", 0)) { best = file.getString("link"); bestW = w; }
                }
                if (best == null || bestW < 1280) continue;
                String slug = v.optString("url").replaceAll("/+$", "");
                slug = slug.substring(slug.lastIndexOf('/') + 1).replaceAll("-?\\d+$", "").replace('-', ' ');
                String name = slug.isEmpty() ? "Pexels video" : slug.substring(0, 1).toUpperCase(Locale.ROOT) + slug.substring(1);
                if (name.length() > 60) name = name.substring(0, 57) + "…";
                out.add(new Photo("pexels-" + v.getString("id"), name, best, v.getJSONObject("user").optString("name", "Pexels") + " · Pexels").loop());
            }
        } else if (source.startsWith("klipy-") && klipyAvailable()) {
            String query = source.equals("klipy-rain") ? "rain window cozy" : source.equals("klipy-space") ? "space stars loop" : "lofi aesthetic";
            JSONArray data = new JSONObject(get("https://api.klipy.com/api/v1/" + BuildConfig.KLIPY_API_KEY + "/gifs/search?per_page=30&content_filter=high&format_filter=mp4"
                    + "&customer_id=" + customerId() + "&q=" + URLEncoder.encode(query, "UTF-8"))).getJSONObject("data").getJSONArray("data");
            for (int i = 0; i < data.length() && out.size() < MAX_PHOTOS; i++) {
                JSONObject g = data.getJSONObject(i), file = g.optJSONObject("file");
                JSONObject mp4 = null;
                if (file != null) for (String size : new String[] { "hd", "md" }) {
                    JSONObject level = file.optJSONObject(size);
                    if (level != null && level.optJSONObject("mp4") != null && !level.getJSONObject("mp4").optString("url").isEmpty()) { mp4 = level.getJSONObject("mp4"); break; }
                }
                if (mp4 == null) continue;
                int w = mp4.optInt("width", 0), h = mp4.optInt("height", 0);
                if (w < h * 1.3 || w < 400) continue;
                String title = g.optString("title", "GIF").trim();
                if (title.isEmpty()) title = "GIF";
                if (title.length() > 60) title = title.substring(0, 57) + "…";
                out.add(new Photo("klipy-" + String.valueOf(g.opt("id")).replaceAll("[^A-Za-z0-9_-]", ""), title, mp4.getString("url"), "Powered by KLIPY").loop());
            }
        }
        return out;
    }

    // ---------- Image pipeline ----------

    private void build(Photo p) throws IOException {
        if (p.video) { buildLoop(p); return; }
        byte[] data = download(p.url, 25 * 1024 * 1024);
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(data, 0, data.length, bounds);
        if (bounds.outWidth <= 0) throw new IOException("Not an image");
        if (bounds.outWidth < 1280 || bounds.outHeight < 700) throw new IOException("Too small for a 4K screen");
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inSampleSize = 1;
        while (bounds.outWidth / (opts.inSampleSize * 2) >= W && bounds.outHeight / (opts.inSampleSize * 2) >= H) opts.inSampleSize *= 2;
        opts.inPreferredConfig = Bitmap.Config.ARGB_8888;
        Bitmap src = BitmapFactory.decodeByteArray(data, 0, data.length, opts);
        if (src == null) throw new IOException("Decode failed");

        // Centred 16:9 crop, the same rule as the bundled gallery.
        Bitmap photo = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888);
        int sw = src.getWidth(), sh = src.getHeight();
        Rect from = sw * H > sh * W ? new Rect((sw - sh * W / H) / 2, 0, (sw + sh * W / H) / 2, sh) : new Rect(0, (sh - sw * H / W) / 2, sw, (sh + sw * H / W) / 2);
        new Canvas(photo).drawBitmap(src, from, new Rect(0, 0, W, H), new Paint(Paint.FILTER_BITMAP_FLAG));
        src.recycle();
        bundle(p.id, photo);
    }

    /** Animated wallpaper: keep the MP4 and render the still bundle from its first frame (the glass stays still). */
    private void buildLoop(Photo p) throws IOException {
        File video = new File(wallDir, p.id + ".mp4"), tmp = new File(wallDir, p.id + ".mp4.part");
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            if (p.url.startsWith("asset:")) { try (InputStream in = context.getAssets().open(p.url.substring(6))) { out.write(readAll(in, 120 * 1024 * 1024)); } }
            else out.write(download(p.url, 120 * 1024 * 1024));
        }
        MediaMetadataRetriever mmr = new MediaMetadataRetriever();
        Bitmap frame;
        try { mmr.setDataSource(tmp.getPath()); frame = mmr.getFrameAtTime(0); } finally { try { mmr.release(); } catch (Exception ignored) { } }
        if (frame == null) { tmp.delete(); throw new IOException("No video frame"); }
        Bitmap photo = Bitmap.createBitmap(W, H, Bitmap.Config.ARGB_8888);
        int sw = frame.getWidth(), sh = frame.getHeight();
        Rect from = sw * H > sh * W ? new Rect((sw - sh * W / H) / 2, 0, (sw + sh * W / H) / 2, sh) : new Rect(0, (sh - sw * H / W) / 2, sw, (sh + sw * H / W) / 2);
        new Canvas(photo).drawBitmap(frame, from, new Rect(0, 0, W, H), new Paint(Paint.FILTER_BITMAP_FLAG));
        frame.recycle();
        bundle(p.id, photo);
        if (!tmp.renameTo(video)) throw new IOException("Rename failed");
    }

    private void bundle(String id, Bitmap photo) throws IOException {
        save(photo, new File(wallDir, id + ".jpg"), 90);
        save(scaled(photo, 512, 288), new File(wallDir, id + "-thumb.jpg"), 85);

        Bitmap frost = field(photo, 42, 1f, 0);
        save(frost, new File(matDir, id + "-field-frost.jpg"), 88);
        save(scaled(frost, 320, 180), new File(wallDir, id + "-panel.jpg"), 85);
        frost.recycle();
        Bitmap blur = field(photo, 28, .92f, 0);
        save(blur, new File(matDir, id + "-field-blur.jpg"), 88);
        blur.recycle();
        Bitmap clear = field(photo, 2, 1.06f, 0);
        save(clear, new File(matDir, id + "-field-clear.jpg"), 88);
        clear.recycle();
        Bitmap soft = field(photo, 14, .96f, 1);
        save(soft, new File(matDir, id + "-study-soft.jpg"), 88);
        soft.recycle();

        JSONObject look = analyse(photo);
        photo.recycle();
        prefs.edit().putString("meta-" + id, look.toString()).apply();
    }

    /** Gaussian-like blur (three box passes at reduced scale), saturation, optional lower scrim. */
    private static Bitmap field(Bitmap photo, float sigma, float saturation, int scrim) {
        int scale = sigma >= 8 ? 4 : 1;
        Bitmap small = scale == 1 ? photo.copy(Bitmap.Config.ARGB_8888, true) : scaled(photo, W / scale, H / scale);
        int w = small.getWidth(), h = small.getHeight();
        int[] px = new int[w * h];
        small.getPixels(px, 0, w, 0, 0, w, h);
        float s = sigma / scale;
        int r = Math.max(1, (int) Math.floor((Math.sqrt(4 * s * s + 1) - 1) / 2));
        for (int pass = 0; pass < 3; pass++) { boxH(px, w, h, r); boxV(px, w, h, r); }
        if (saturation != 1f) saturate(px, saturation);
        small.setPixels(px, 0, w, 0, 0, w, h);
        Bitmap out = scale == 1 ? small : scaled(small, W, H);
        if (out != small) small.recycle();
        if (scrim == 1) {
            Bitmap m = out.isMutable() ? out : out.copy(Bitmap.Config.ARGB_8888, true);
            Paint paint = new Paint();
            paint.setShader(new LinearGradient(0, 560, 0, H, Color.argb(0, 4, 10, 12), Color.argb(120, 4, 10, 12), Shader.TileMode.CLAMP));
            new Canvas(m).drawRect(0, 560, W, H, paint);
            return m;
        }
        return out;
    }

    static void boxH(int[] px, int w, int h, int r) {
        int[] row = new int[w];
        int d = 2 * r + 1;
        for (int y = 0; y < h; y++) {
            int o = y * w, sr = 0, sg = 0, sb = 0;
            for (int i = -r; i <= r; i++) { int c = px[o + Math.min(w - 1, Math.max(0, i))]; sr += (c >> 16) & 255; sg += (c >> 8) & 255; sb += c & 255; }
            for (int x = 0; x < w; x++) {
                row[x] = 0xff000000 | ((sr / d) << 16) | ((sg / d) << 8) | (sb / d);
                int a = px[o + Math.min(w - 1, x + r + 1)], b = px[o + Math.max(0, x - r)];
                sr += ((a >> 16) & 255) - ((b >> 16) & 255); sg += ((a >> 8) & 255) - ((b >> 8) & 255); sb += (a & 255) - (b & 255);
            }
            System.arraycopy(row, 0, px, o, w);
        }
    }

    static void boxV(int[] px, int w, int h, int r) {
        int[] col = new int[h];
        int d = 2 * r + 1;
        for (int x = 0; x < w; x++) {
            int sr = 0, sg = 0, sb = 0;
            for (int i = -r; i <= r; i++) { int c = px[Math.min(h - 1, Math.max(0, i)) * w + x]; sr += (c >> 16) & 255; sg += (c >> 8) & 255; sb += c & 255; }
            for (int y = 0; y < h; y++) {
                col[y] = 0xff000000 | ((sr / d) << 16) | ((sg / d) << 8) | (sb / d);
                int a = px[Math.min(h - 1, y + r + 1) * w + x], b = px[Math.max(0, y - r) * w + x];
                sr += ((a >> 16) & 255) - ((b >> 16) & 255); sg += ((a >> 8) & 255) - ((b >> 8) & 255); sb += (a & 255) - (b & 255);
            }
            for (int y = 0; y < h; y++) px[y * w + x] = col[y];
        }
    }

    private static void saturate(int[] px, float k) {
        for (int i = 0; i < px.length; i++) {
            int c = px[i], r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
            float l = .2126f * r + .7152f * g + .0722f * b;
            px[i] = 0xff000000 | (clamp(l + (r - l) * k) << 16) | (clamp(l + (g - l) * k) << 8) | clamp(l + (b - l) * k);
        }
    }

    private static int clamp(float v) { return v < 0 ? 0 : v > 255 ? 255 : Math.round(v); }

    /** Brightness of the clock, controls and dock regions decides ink polarity, like the offline catalogue. */
    private static JSONObject analyse(Bitmap photo) {
        try {
            float clock = luma(photo, 100, 40, 700, 260), tr = luma(photo, 1100, 40, 1820, 170), br = luma(photo, 960, 640, 1840, 1000), all = luma(photo, 0, 0, W, H);
            return new JSONObject()
                    .put("tone", all > .55f ? "light" : "dark")
                    .put("ut", new JSONObject().put("tr", tr > .62f ? "mist" : "light").put("br", br > .62f ? "mist" : "light"))
                    .put("frostVeil", all > .6f ? .3 : all > .45f ? .2 : .12)
                    .put("clockMist", clock > .55f)
                    .put("dockQuiet", br < .25f);
        } catch (Exception e) { return new JSONObject(); }
    }

    private static float luma(Bitmap b, int x0, int y0, int x1, int y1) {
        long sum = 0; int n = 0;
        for (int y = y0; y < y1; y += 8) for (int x = x0; x < x1; x += 8) {
            int c = b.getPixel(x, y);
            sum += (54 * ((c >> 16) & 255) + 183 * ((c >> 8) & 255) + 19 * (c & 255)) >> 8; n++;
        }
        return n == 0 ? 0 : sum / (255f * n);
    }

    private static Bitmap scaled(Bitmap b, int w, int h) { return Bitmap.createScaledBitmap(b, w, h, true); }

    private static void save(Bitmap b, File f, int quality) throws IOException {
        File tmp = new File(f.getPath() + ".part");
        try (FileOutputStream out = new FileOutputStream(tmp)) { b.compress(Bitmap.CompressFormat.JPEG, quality, out); }
        if (!tmp.renameTo(f)) throw new IOException("Rename failed");
    }

    // ---------- Index ----------

    private JSONObject entry(Photo p) throws Exception {
        JSONObject e = new JSONObject().put("id", p.id).put("name", p.name).put("credit", p.credit).put("online", true)
                .put("src", "assets/wallpapers/" + p.id + ".jpg").put("thumb", "assets/wallpapers/" + p.id + "-thumb.jpg")
                .put("tone", "dark").put("ut", new JSONObject().put("tr", "light").put("br", "light"))
                .put("frostVeil", .2).put("listColumn", 0).put("dockQuiet", false).put("clockMist", true);
        if (p.video) e.put("video", "assets/wallpapers/" + p.id + ".mp4");
        String meta = prefs.getString("meta-" + p.id, null);
        if (meta != null) {
            JSONObject m = new JSONObject(meta);
            for (java.util.Iterator<String> it = m.keys(); it.hasNext(); ) { String k = it.next(); e.put(k, m.get(k)); }
        }
        return e;
    }

    private synchronized JSONArray readIndex() throws Exception {
        if (!index.exists()) return new JSONArray();
        try (InputStream in = new FileInputStream(index)) { return new JSONArray(new String(readAll(in, 1 << 20), StandardCharsets.UTF_8)); }
    }

    private synchronized void writeIndex(JSONArray entries) {
        try (FileOutputStream out = new FileOutputStream(index)) { out.write(entries.toString().getBytes(StandardCharsets.UTF_8)); }
        catch (IOException ignored) { }
    }

    /** Removes cached files for photos no longer in the index. */
    private void clean(Set<String> keep) {
        SharedPreferences.Editor edit = prefs.edit();
        for (File dir : new File[] { wallDir, matDir }) {
            File[] files = dir.listFiles();
            if (files == null) continue;
            for (File f : files) {
                String name = f.getName(), id = name.replaceAll("(-thumb|-panel|-field-blur|-field-frost|-field-clear|-study-soft)?\\.(jpg|mp4)(\\.part)?$", "");
                if (!keep.contains(id)) { f.delete(); edit.remove("meta-" + id); }
            }
        }
        edit.apply();
    }

    // ---------- Serving ----------

    /** Serves cached online photos at the same assets/ paths as the bundled gallery. */
    WebViewAssetLoader.PathHandler handler() {
        return path -> {
            try {
                if (path.equals("wallpapers/online.js")) {
                    String js = "/* Written by the Android shell from its online photo cache. */\nwindow.CleanFrameOnlineWallpapers = " + entries() + ";\n";
                    return new WebResourceResponse("text/javascript", "utf-8", new ByteArrayInputStream(js.getBytes(StandardCharsets.UTF_8)));
                }
                if (!path.matches("(wallpapers|materials)/[A-Za-z0-9_-]+\\.(jpg|mp4)")) return null;
                File f = new File(root, path);
                return f.exists() ? new WebResourceResponse(path.endsWith(".mp4") ? "video/mp4" : "image/jpeg", null, new FileInputStream(f)) : null;
            } catch (IOException e) { return null; }
        };
    }

    // ---------- Network ----------

    private static String get(String url) throws IOException { return get(url, null, null); }

    private static String get(String url, String header, String value) throws IOException { return new String(download(url, 4 * 1024 * 1024, header, value), StandardCharsets.UTF_8); }

    private static byte[] download(String url, int limit) throws IOException { return download(url, limit, null, null); }

    static byte[] download(String url, int limit, String header, String value) throws IOException {
        for (int hop = 0; hop < 5; hop++) {
            if (!url.startsWith("https://")) throw new IOException("HTTPS only");
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(15000); c.setReadTimeout(30000);
            c.setInstanceFollowRedirects(false);
            c.setRequestProperty("User-Agent", UA);
            if (header != null) c.setRequestProperty(header, value);
            int code = c.getResponseCode();
            if (code >= 300 && code < 400 && c.getHeaderField("Location") != null) { url = new URL(new URL(url), c.getHeaderField("Location")).toString(); c.disconnect(); continue; }
            if (code != 200) { c.disconnect(); throw new IOException("HTTP " + code); }
            try (InputStream in = c.getInputStream()) { return readAll(in, limit); } finally { c.disconnect(); }
        }
        throw new IOException("Too many redirects");
    }

    static byte[] readAll(InputStream in, int limit) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        for (int n; (n = in.read(buf)) > 0; ) { out.write(buf, 0, n); if (out.size() > limit) throw new IOException("Too large"); }
        return out.toByteArray();
    }

    private void notifyStatus(String status) { Listener l = listener; if (l != null) l.changed(null, status); }
    private void notifyChanged(String status) { Listener l = listener; if (l != null) l.changed(entries(), status); }
}
