package app.cleanframe.tv;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.webkit.WebResourceResponse;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Apple TV–style Top Shelf for the Shelf layout. Google TV gives third-party launchers no preview
 * programs or watch-next rows, so recommendations come from public catalogues (TMDB, ARD, ZDF, arte,
 * YouTube, Twitch). Each image is downloaded once and resized to a 16:9 card and a hero backdrop,
 * then served at /topshelf/img/. /topshelf/banner/<pkg>.jpg is the app's own TV banner, pre-blurred
 * and darkened, for apps without recommendations. Nothing is blurred in the WebView.
 */
final class TopShelf {
    interface Listener { void changed(String indexJson); }

    private static final long FRESH_MS = 60L * 60 * 1000;
    private static final int MAX_ITEMS = 10, CARD_W = 480, CARD_H = 270, HERO_W = 1280, HERO_H = 720;

    /** Package -> source. tmdb:<provider name on TMDB> or a keyless/keyed feed. */
    private static final Map<String, String> SOURCE = new HashMap<>();
    /** Source -> name shown as "Trending on <name>". */
    private static final Map<String, String> SERVICE = new HashMap<>();
    static {
        SOURCE.put("com.netflix.ninja", "tmdb:Netflix");
        SOURCE.put("com.disney.disneyplus", "tmdb:Disney Plus");
        SOURCE.put("com.amazon.amazonvideo.livingroom", "tmdb:Amazon Prime Video");
        SOURCE.put("de.prosiebensat1digital.seventv", "tmdb:Joyn");
        SOURCE.put("de.exaring.waipu", "tmdb:waipu.tv");
        SOURCE.put("com.apple.atve.androidtv.appletv", "tmdb:Apple TV");
        SOURCE.put("de.swr.avp.ard.tv", "ard");
        SOURCE.put("com.zdf.android.mediathek", "zdf");
        SOURCE.put("tv.arte.plus7", "arte");
        SOURCE.put("com.google.android.youtube.tv", "youtube");
        SOURCE.put("io.gh.reisxd.tizentube.cobalt", "youtube");
        SOURCE.put("tv.twitch.android.app", "twitch");
        SERVICE.put("tmdb:Netflix", "Netflix");
        SERVICE.put("tmdb:Disney Plus", "Disney+");
        SERVICE.put("tmdb:Amazon Prime Video", "Prime Video");
        SERVICE.put("tmdb:Joyn", "Joyn");
        SERVICE.put("tmdb:waipu.tv", "waipu.tv");
        SERVICE.put("tmdb:Apple TV", "Apple TV");
        SERVICE.put("ard", "ARD Mediathek");
        SERVICE.put("zdf", "ZDF");
        SERVICE.put("arte", "ARTE");
        SERVICE.put("youtube", "YouTube");
        SERVICE.put("twitch", "Twitch");
    }

    private final Context context;
    private final PackageManager pm;
    private final File root, imgDir, bannerDir, indexFile;
    private final SharedPreferences prefs;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Set<String> wanted = new LinkedHashSet<>();
    private volatile Listener listener;
    private boolean busy, again;
    private String twitchToken;
    private long twitchExpires;

    TopShelf(Context context) {
        this.context = context.getApplicationContext();
        pm = this.context.getPackageManager();
        root = new File(this.context.getCacheDir(), "topshelf");
        imgDir = new File(root, "img");
        bannerDir = new File(root, "banner");
        indexFile = new File(root, "index.json");
        prefs = this.context.getSharedPreferences("top-shelf", Context.MODE_PRIVATE);
        imgDir.mkdirs(); bannerDir.mkdirs();
    }

    void setListener(Listener l) { listener = l; }

    static boolean available(String source) {
        if (source == null) return false;
        if (source.startsWith("tmdb:")) return !BuildConfig.TMDB_TOKEN.isEmpty();
        if (source.equals("youtube")) return !BuildConfig.YOUTUBE_API_KEY.isEmpty();
        if (source.equals("twitch")) return !BuildConfig.TWITCH_CLIENT_ID.isEmpty() && !BuildConfig.TWITCH_CLIENT_SECRET.isEmpty();
        return true;
    }

    /** {pkg: {service, items:[{title, sub, card, hero, url}]}} for every package with recommendations. */
    synchronized String index() {
        try {
            if (!indexFile.exists()) return "{}";
            try (InputStream in = new FileInputStream(indexFile)) { return new String(OnlineWallpapers.readAll(in, 1 << 20), StandardCharsets.UTF_8); }
        } catch (Exception e) { return "{}"; }
    }

    /** Called from the page with the Home packages. Refreshes stale sources in the background. */
    void request(String packagesJson) {
        Set<String> sources = new LinkedHashSet<>();
        try {
            JSONArray list = new JSONArray(packagesJson);
            for (int i = 0; i < list.length(); i++) {
                String s = SOURCE.get(list.optString(i));
                if (available(s)) sources.add(s);
            }
        } catch (Exception e) { return; }
        synchronized (this) {
            wanted.clear(); wanted.addAll(sources);
            if (busy) { again = true; return; }
            busy = true;
        }
        worker.execute(this::run);
    }

    private void run() {
        while (true) {
            List<String> todo;
            synchronized (this) { todo = new ArrayList<>(wanted); again = false; }
            for (String source : todo) {
                if (System.currentTimeMillis() - prefs.getLong("at-" + source, 0) < FRESH_MS && imagesPresent(source)) continue;
                try {
                    JSONArray items = fetch(source);
                    if (items.length() > 0) { store(source, items); notifyChanged(); }
                    prefs.edit().putLong("at-" + source, System.currentTimeMillis()).apply();
                } catch (Exception ignored) { /* keep the previous items; try again next time */ }
            }
            synchronized (this) { if (!again) { busy = false; break; } }
        }
        clean();
    }

    // ---------- Sources ----------

    private static final class Item {
        final String title, sub, image, url;
        Item(String title, String sub, String image, String url) { this.title = title; this.sub = sub; this.image = image; this.url = url; }
    }

    private JSONArray fetch(String source) throws Exception {
        List<Item> found = new ArrayList<>();
        if (source.startsWith("tmdb:")) tmdb(source.substring(5), found);
        else if (source.equals("ard")) ard(found);
        else if (source.equals("zdf")) zdf(found);
        else if (source.equals("arte")) arte(found);
        else if (source.equals("youtube")) youtube(found);
        else if (source.equals("twitch")) twitch(found);
        JSONArray out = new JSONArray();
        Set<String> titles = new HashSet<>();
        for (Item it : found) {
            if (out.length() >= MAX_ITEMS) break;
            if (it.title == null || it.title.isEmpty() || it.image == null || !it.image.startsWith("https://") || !titles.add(it.title)) continue;
            try {
                String id = imageId(it.image);
                if (!new File(imgDir, id + "-card.jpg").exists() || !new File(imgDir, id + "-hero.jpg").exists()) images(it.image, id);
                out.put(new JSONObject().put("title", trim(it.title, 80)).put("sub", trim(it.sub == null ? "" : it.sub, 80))
                        .put("card", "/topshelf/img/" + id + "-card.jpg").put("hero", "/topshelf/img/" + id + "-hero.jpg")
                        .put("url", it.url == null ? "" : it.url));
            } catch (Exception ignored) { /* skip one bad image */ }
        }
        return out;
    }

    private static String norm(String name) { return name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", ""); }

    /** TMDB watch provider id for region DE, matched by name and remembered. */
    private int providerId(String name) throws Exception {
        int cached = prefs.getInt("provider-" + name, 0);
        if (cached != 0) return cached;
        for (String kind : new String[] { "tv", "movie" }) {
            JSONArray results = new JSONObject(tmdbGet("/watch/providers/" + kind + "?watch_region=DE")).getJSONArray("results");
            for (int i = 0; i < results.length(); i++) {
                JSONObject p = results.getJSONObject(i);
                if (norm(p.optString("provider_name")).equals(norm(name))) {
                    prefs.edit().putInt("provider-" + name, p.getInt("provider_id")).apply();
                    return p.getInt("provider_id");
                }
            }
        }
        return -1;
    }

    private void tmdb(String provider, List<Item> out) throws Exception {
        int id = providerId(provider);
        if (id <= 0) return;
        String q = "?with_watch_providers=" + id + "&watch_region=DE&with_watch_monetization_types=flatrate&sort_by=popularity.desc&language=de-DE&include_adult=false";
        JSONArray tv = new JSONObject(tmdbGet("/discover/tv" + q)).getJSONArray("results");
        JSONArray movie = new JSONObject(tmdbGet("/discover/movie" + q)).getJSONArray("results");
        for (int i = 0; i < Math.max(tv.length(), movie.length()); i++) {
            for (JSONArray list : new JSONArray[] { tv, movie }) {
                if (i >= list.length()) continue;
                JSONObject r = list.getJSONObject(i);
                String backdrop = r.optString("backdrop_path", "");
                if (backdrop.isEmpty() || "null".equals(backdrop)) continue;
                boolean isTv = list == tv;
                String date = r.optString(isTv ? "first_air_date" : "release_date", "");
                String sub = (isTv ? "Series" : "Film") + (date.length() >= 4 ? " · " + date.substring(0, 4) : "");
                out.add(new Item(r.optString(isTv ? "name" : "title"), sub, "https://image.tmdb.org/t/p/w1280" + backdrop, null));
            }
        }
    }

    private static String tmdbGet(String path) throws IOException {
        return text(http("GET", "https://api.themoviedb.org/3" + path, 4 << 20, "Authorization", "Bearer " + BuildConfig.TMDB_TOKEN, "Accept", "application/json"));
    }

    private void ard(List<Item> out) throws Exception {
        JSONArray widgets = new JSONObject(text(http("GET", "https://api.ardmediathek.de/page-gateway/pages/ard/home?embedded=true", 8 << 20))).getJSONArray("widgets");
        for (int w = 0; w < widgets.length() && out.size() < MAX_ITEMS * 2; w++) {
            JSONObject widget = widgets.getJSONObject(w);
            String type = widget.optString("type");
            if (!type.equals("stage") && !type.equals("gridlist")) continue;
            JSONArray teasers = widget.optJSONArray("teasers");
            if (teasers == null) continue;
            for (int i = 0; i < teasers.length(); i++) {
                JSONObject t = teasers.getJSONObject(i);
                JSONObject images = t.optJSONObject("images");
                JSONObject wide = images == null ? null : images.optJSONObject("aspect16x9");
                if (wide == null) continue;
                JSONObject show = t.optJSONObject("show");
                String sub = show != null && !show.optString("title").equals(t.optString("shortTitle")) ? show.optString("title") : widget.optString("title");
                out.add(new Item(t.optString("shortTitle"), sub, wide.optString("src").replace("{width}", "1280"), null));
            }
        }
    }

    private void zdf(List<Item> out) throws Exception {
        JSONObject page = new JSONObject(text(http("GET", "https://zdf-prod-futura.zdf.de/mediathekV2/start-page", 12 << 20)));
        List<JSONObject> teasers = new ArrayList<>();
        JSONArray stage = page.optJSONArray("stage");
        if (stage != null) for (int i = 0; i < stage.length(); i++) teasers.add(stage.getJSONObject(i));
        JSONArray clusters = page.optJSONArray("cluster");
        if (clusters != null) for (int c = 0; c < clusters.length(); c++) {
            JSONArray t = clusters.getJSONObject(c).optJSONArray("teaser");
            if (t != null) for (int i = 0; i < t.length(); i++) teasers.add(t.getJSONObject(i));
        }
        for (JSONObject t : teasers) {
            JSONObject pics = t.optJSONObject("teaserBild");
            if (pics == null) continue;
            String best = null; int bestW = 0;
            for (Iterator<String> it = pics.keys(); it.hasNext(); ) {
                JSONObject p = pics.optJSONObject(it.next());
                if (p == null) continue;
                int w = p.optInt("width"), h = p.optInt("height");
                if (h <= 0 || Math.abs(w * 9 - h * 16) > w / 20 || w > 1920) continue; // 16:9 only
                if (w > bestW) { bestW = w; best = p.optString("url"); }
            }
            if (best == null || bestW < 640) continue;
            String headline = t.optString("headline", "");
            String sub = !headline.isEmpty() ? headline : t.optString("channel", "");
            out.add(new Item(t.optString("titel"), sub, best, t.optString("sharingUrl", null)));
        }
    }

    private void arte(List<Item> out) throws Exception {
        JSONArray zones = new JSONObject(text(http("GET", "https://api.arte.tv/api/emac/v4/de/web/pages/HOME/", 8 << 20))).getJSONArray("zones");
        for (int z = 0; z < zones.length() && out.size() < MAX_ITEMS * 2; z++) {
            JSONObject content = zones.getJSONObject(z).optJSONObject("content");
            JSONArray data = content == null ? null : content.optJSONArray("data");
            if (data == null) continue;
            for (int i = 0; i < data.length(); i++) {
                JSONObject d = data.getJSONObject(i);
                JSONObject image = d.optJSONObject("mainImage");
                String url = image == null ? "" : image.optString("url", "");
                if (!url.contains("__SIZE__")) continue;
                String link = d.optString("deeplink", "");
                out.add(new Item(d.optString("title"), d.isNull("subtitle") ? "" : d.optString("subtitle"), url.replace("__SIZE__", "1280x720"),
                        link.startsWith("arte://") ? link : d.optString("url", null)));
            }
        }
    }

    private void youtube(List<Item> out) throws Exception {
        JSONArray items = new JSONObject(text(http("GET", "https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=DE&maxResults=15&key="
                + URLEncoder.encode(BuildConfig.YOUTUBE_API_KEY, "UTF-8"), 4 << 20))).getJSONArray("items");
        for (int i = 0; i < items.length(); i++) {
            JSONObject v = items.getJSONObject(i), s = v.getJSONObject("snippet"), thumbs = s.optJSONObject("thumbnails");
            if (thumbs == null) continue;
            String image = null;
            for (String size : new String[] { "maxres", "standard", "high" }) {
                if (thumbs.optJSONObject(size) != null) { image = thumbs.getJSONObject(size).optString("url"); break; }
            }
            out.add(new Item(s.optString("title"), s.optString("channelTitle"), image, "https://www.youtube.com/watch?v=" + v.optString("id")));
        }
    }

    private void twitch(List<Item> out) throws Exception {
        if (twitchToken == null || System.currentTimeMillis() > twitchExpires) {
            JSONObject token = new JSONObject(text(http("POST", "https://id.twitch.tv/oauth2/token?grant_type=client_credentials&client_id="
                    + URLEncoder.encode(BuildConfig.TWITCH_CLIENT_ID, "UTF-8") + "&client_secret=" + URLEncoder.encode(BuildConfig.TWITCH_CLIENT_SECRET, "UTF-8"), 1 << 16)));
            twitchToken = token.getString("access_token");
            twitchExpires = System.currentTimeMillis() + Math.max(60, token.optLong("expires_in", 3600) - 60) * 1000;
        }
        JSONArray streams = new JSONObject(text(http("GET", "https://api.twitch.tv/helix/streams?first=15&language=de", 4 << 20,
                "Client-Id", BuildConfig.TWITCH_CLIENT_ID, "Authorization", "Bearer " + twitchToken))).getJSONArray("data");
        for (int i = 0; i < streams.length(); i++) {
            JSONObject s = streams.getJSONObject(i);
            String game = s.optString("game_name", "");
            out.add(new Item(s.optString("user_name"), (game.isEmpty() ? "" : game + " · ") + s.optString("title"),
                    s.optString("thumbnail_url").replace("{width}", "1280").replace("{height}", "720"),
                    "https://www.twitch.tv/" + s.optString("user_login")));
        }
    }

    // ---------- Images ----------

    private static String imageId(String url) {
        return Integer.toHexString(url.hashCode()) + Integer.toHexString(url.length());
    }

    /** One download: a centred 16:9 crop, saved as a card and a hero backdrop. */
    private void images(String url, String id) throws IOException {
        byte[] data = http("GET", url, 12 << 20);
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(data, 0, data.length, bounds);
        if (bounds.outWidth < 320) throw new IOException("Not an image");
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inSampleSize = 1;
        while (bounds.outWidth / (opts.inSampleSize * 2) >= HERO_W) opts.inSampleSize *= 2;
        Bitmap src = BitmapFactory.decodeByteArray(data, 0, data.length, opts);
        if (src == null) throw new IOException("Decode failed");
        int sw = src.getWidth(), sh = src.getHeight();
        Rect from = sw * 9 > sh * 16 ? new Rect((sw - sh * 16 / 9) / 2, 0, (sw + sh * 16 / 9) / 2, sh) : new Rect(0, (sh - sw * 9 / 16) / 2, sw, (sh + sw * 9 / 16) / 2);
        save(crop(src, from, HERO_W, HERO_H), new File(imgDir, id + "-hero.jpg"), 82);
        save(crop(src, from, CARD_W, CARD_H), new File(imgDir, id + "-card.jpg"), 86);
        src.recycle();
    }

    private static Bitmap crop(Bitmap src, Rect from, int w, int h) {
        Bitmap out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        new Canvas(out).drawBitmap(src, from, new Rect(0, 0, w, h), new Paint(Paint.FILTER_BITMAP_FLAG));
        return out;
    }

    private static void save(Bitmap b, File f, int quality) throws IOException {
        File tmp = new File(f.getPath() + ".part");
        try (FileOutputStream out = new FileOutputStream(tmp)) { b.compress(Bitmap.CompressFormat.JPEG, quality, out); }
        b.recycle();
        if (!tmp.renameTo(f)) throw new IOException("Rename failed");
    }

    /** The app's TV banner as a soft, darkened backdrop (blurred once here, scaled up by the page). */
    private File softBanner(String pkg) throws Exception {
        File f = new File(bannerDir, pkg + ".jpg");
        if (f.exists() && f.lastModified() > System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000) return f;
        Drawable banner = AppIconHandler.banner(pm, pkg);
        if (banner == null) return null;
        int w = 256, h = 144;
        Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        banner.setBounds(0, 0, w, h);
        Canvas canvas = new Canvas(b);
        canvas.drawColor(0xff101214);
        banner.draw(canvas);
        int[] px = new int[w * h];
        b.getPixels(px, 0, w, 0, 0, w, h);
        for (int pass = 0; pass < 3; pass++) { OnlineWallpapers.boxH(px, w, h, 7); OnlineWallpapers.boxV(px, w, h, 7); }
        for (int i = 0; i < px.length; i++) {
            int c = px[i];
            px[i] = 0xff000000 | (((c >> 16) & 255) * 58 / 100 << 16) | (((c >> 8) & 255) * 58 / 100 << 8) | ((c & 255) * 58 / 100);
        }
        b.setPixels(px, 0, w, 0, 0, w, h);
        save(b, f, 90);
        return f;
    }

    // ---------- Index ----------

    private synchronized void store(String source, JSONArray items) throws Exception {
        JSONObject index = new JSONObject(index());
        for (Map.Entry<String, String> e : SOURCE.entrySet()) {
            if (e.getValue().equals(source)) index.put(e.getKey(), new JSONObject().put("service", SERVICE.get(source)).put("items", items));
        }
        try (OutputStream out = new FileOutputStream(indexFile)) { out.write(index.toString().getBytes(StandardCharsets.UTF_8)); }
    }

    /** False when the cache was cleared under an index entry, so the source is fetched again. */
    private boolean imagesPresent(String source) {
        try {
            JSONObject index = new JSONObject(index());
            for (Map.Entry<String, String> e : SOURCE.entrySet()) {
                JSONObject entry = e.getValue().equals(source) ? index.optJSONObject(e.getKey()) : null;
                JSONArray items = entry == null ? null : entry.optJSONArray("items");
                for (int i = 0; items != null && i < items.length(); i++) {
                    JSONObject it = items.getJSONObject(i);
                    for (String k : new String[] { "card", "hero" }) {
                        if (!new File(imgDir, it.optString(k).replace("/topshelf/img/", "")).exists()) return false;
                    }
                }
            }
            return true;
        } catch (Exception e) { return false; }
    }

    /** Removes cached images no longer referenced by the index. */
    private void clean() {
        String index = index();
        File[] files = imgDir.listFiles();
        if (files == null) return;
        for (File f : files) if (!index.contains(f.getName())) f.delete(); // org.json writes "/" as "\/", so match the name only
    }

    // ---------- Serving ----------

    WebViewAssetLoader.PathHandler handler() {
        return path -> {
            try {
                File f = null;
                if (path.matches("img/[0-9a-f]+-(card|hero)\\.jpg")) f = new File(imgDir, path.substring(4));
                else if (path.matches("banner/[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+\\.jpg")) f = softBanner(path.substring(7, path.length() - 4));
                return f != null && f.exists() ? new WebResourceResponse("image/jpeg", null, new FileInputStream(f)) : null;
            } catch (Exception e) { return null; }
        };
    }

    // ---------- Network ----------

    private static String text(byte[] b) { return new String(b, StandardCharsets.UTF_8); }

    private static String trim(String s, int max) { s = s.trim(); return s.length() > max ? s.substring(0, max - 1) + "…" : s; }

    /** HTTPS only, at most five redirects, with optional header name/value pairs. */
    private static byte[] http(String method, String url, int limit, String... headers) throws IOException {
        for (int hop = 0; hop < 5; hop++) {
            if (!url.startsWith("https://")) throw new IOException("HTTPS only");
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(15000); c.setReadTimeout(30000);
            c.setInstanceFollowRedirects(false);
            c.setRequestMethod(method);
            c.setRequestProperty("User-Agent", OnlineWallpapers.UA);
            for (int i = 0; i + 1 < headers.length; i += 2) c.setRequestProperty(headers[i], headers[i + 1]);
            if (method.equals("POST")) { c.setDoOutput(true); c.setFixedLengthStreamingMode(0); c.getOutputStream().close(); }
            int code = c.getResponseCode();
            if (code >= 300 && code < 400 && c.getHeaderField("Location") != null) { url = new URL(new URL(url), c.getHeaderField("Location")).toString(); c.disconnect(); continue; }
            if (code != 200) { c.disconnect(); throw new IOException("HTTP " + code); }
            try (InputStream in = c.getInputStream()) { return OnlineWallpapers.readAll(in, limit); } finally { c.disconnect(); }
        }
        throw new IOException("Too many redirects");
    }

    private void notifyChanged() { Listener l = listener; if (l != null) l.changed(index()); }
}
