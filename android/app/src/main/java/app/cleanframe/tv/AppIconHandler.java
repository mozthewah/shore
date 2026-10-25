package app.cleanframe.tv;

import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.AdaptiveIconDrawable;
import android.graphics.drawable.Drawable;
import android.webkit.WebResourceResponse;

import androidx.webkit.WebViewAssetLoader;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Serves installed-app icons at /appicon/<package>.png and Android TV banners at /appbanner/<package>.png.
 * /appicon/pack/<icon pack>/<package>.png is the icon pack's icon (404 when the pack has none), and
 * /appicon/mono/<icon pack or _>/<package>.png a white single-colour version the page tints with a CSS mask.
 * Both are made once per app and kept in memory, never per frame.
 */
final class AppIconHandler implements WebViewAssetLoader.PathHandler {
    private static final int SIZE = 192, BANNER_W = 640, BANNER_H = 360;
    private static final String PKG = "[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+";
    private final Context context;
    private final PackageManager pm;
    private final boolean banner;
    private final Map<String, byte[]> cache = new LinkedHashMap<String, byte[]>(64, .75f, true) {
        @Override protected boolean removeEldestEntry(Map.Entry<String, byte[]> e) { return size() > 96; }
    };

    AppIconHandler(Context context) { this(context, false); }

    AppIconHandler(Context context, boolean banner) {
        this.context = context.getApplicationContext();
        this.pm = this.context.getPackageManager();
        this.banner = banner;
    }

    @Override
    public WebResourceResponse handle(String path) {
        if (!banner && (path.startsWith("pack/") || path.startsWith("mono/"))) return styled(path);
        String pkg = path.endsWith(".png") ? path.substring(0, path.length() - 4) : path;
        if (!pkg.matches(PKG)) return null;
        try {
            Drawable icon = banner ? banner(pm, pkg) : pm.getApplicationIcon(pkg);
            if (icon == null) return null; // no banner: the page shows its own card
            int w = banner ? BANNER_W : SIZE, h = banner ? BANNER_H : SIZE;
            return png(draw(icon, w, h));
        } catch (PackageManager.NameNotFoundException e) {
            return null;
        }
    }

    private WebResourceResponse styled(String path) {
        String[] parts = path.split("/");
        if (parts.length != 3 || !parts[2].endsWith(".png")) return null;
        String pack = parts[1], pkg = parts[2].substring(0, parts[2].length() - 4);
        boolean mono = parts[0].equals("mono");
        if (!pkg.matches(PKG) || !(pack.matches(PKG) || mono && pack.equals("_"))) return null;
        byte[] bytes;
        synchronized (cache) { bytes = cache.get(path); }
        if (bytes == null) {
            Drawable icon = pack.equals("_") ? null : IconPacks.icon(context, pack, pkg);
            if (icon == null && !mono) return null;
            try { if (icon == null) icon = pm.getApplicationIcon(pkg); } catch (PackageManager.NameNotFoundException e) { return null; }
            Bitmap b = mono ? mono(icon) : drawShaped(icon);
            bytes = bytes(b);
            synchronized (cache) { cache.put(path, bytes); }
        }
        return new WebResourceResponse("image/png", null, new ByteArrayInputStream(bytes));
    }

    private static Bitmap draw(Drawable icon, int w, int h) {
        Bitmap bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        icon.setBounds(0, 0, w, h);
        icon.draw(new Canvas(bitmap));
        return bitmap;
    }

    /** At the drawable's own shape: banner-shaped pack icons (common in Projectivy packs) stay wide instead of squashed. */
    private static Bitmap drawShaped(Drawable icon) {
        float r = ratio(icon);
        return r > 1.15f ? draw(icon, Math.round(SIZE * r), SIZE) : r < .87f ? draw(icon, SIZE, Math.round(SIZE / r)) : draw(icon, SIZE, SIZE);
    }

    /** Width over height, kept between 1:2.5 and 2.5:1; square when the drawable has no size. */
    private static float ratio(Drawable icon) {
        int w = icon.getIntrinsicWidth(), h = icon.getIntrinsicHeight();
        return w > 0 && h > 0 ? Math.max(.4f, Math.min(2.5f, w / (float) h)) : 1f;
    }

    /** A square bitmap with the drawable centred at its own shape. */
    private static Bitmap letterbox(Drawable icon) {
        float r = ratio(icon);
        int w = r >= 1 ? SIZE : Math.round(SIZE * r), h = r >= 1 ? Math.round(SIZE / r) : SIZE, x = (SIZE - w) / 2, y = (SIZE - h) / 2;
        Bitmap bitmap = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888);
        icon.setBounds(x, y, x + w, y + h);
        icon.draw(new Canvas(bitmap));
        return bitmap;
    }

    /**
     * White glyph on transparent, trimmed and centred in a square so every app's mark sits at the same size.
     * Adaptive icons give their foreground layer (the logo without its plate). A plate that is still there
     * (flat icons, full-bleed foregrounds) is found from the edge midpoints and removed by distance from its
     * colour; when that leaves a near-solid block (photos, gradients) the light parts become the glyph.
     */
    private static Bitmap mono(Drawable icon) {
        Bitmap b;
        boolean adaptive = icon instanceof AdaptiveIconDrawable && ((AdaptiveIconDrawable) icon).getForeground() != null;
        if (adaptive) {
            // The foreground is 108 units with the 72-unit safe zone in the middle: draw it 1.5x and crop to the centre.
            b = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888);
            Drawable fg = ((AdaptiveIconDrawable) icon).getForeground();
            fg.setBounds(-SIZE / 4, -SIZE / 4, SIZE + SIZE / 4, SIZE + SIZE / 4);
            fg.draw(new Canvas(b));
        } else b = letterbox(icon);
        int[] src = new int[SIZE * SIZE], px = new int[SIZE * SIZE];
        b.getPixels(src, 0, SIZE, 0, 0, SIZE, SIZE);
        b.recycle();
        int in = SIZE / 16, mid = SIZE / 2, plate = 0, votes = 0, opaque = 0, raw = 0;
        int[] edges = { src[in * SIZE + mid], src[(SIZE - 1 - in) * SIZE + mid], src[mid * SIZE + in], src[mid * SIZE + SIZE - 1 - in] };
        for (int c : edges) {
            if (c >>> 24 < 200) continue;
            opaque++;
            int same = 0;
            for (int o : edges) if (o >>> 24 >= 200 && dist(c, o) < 60) same++;
            if (same > votes) { votes = same; plate = c; }
        }
        for (int c : src) if (c >>> 24 > 128) raw++;
        // A plate touches the edges in one colour (two sides are enough for a letterboxed banner). An adaptive
        // foreground normally has none, so it only counts when the foreground fills most of the icon.
        boolean solid = votes >= 2 && votes == opaque && (!adaptive || raw > src.length * 6 / 10);
        int covered = 0;
        for (int i = 0; i < src.length; i++) {
            int a = src[i] >>> 24;
            if (solid) a = a * Math.min(255, Math.max(0, (dist(src[i], plate) - 40) * 3)) / 255;
            px[i] = a;
            if (a > 128) covered++;
        }
        if (covered > src.length * 6 / 10) {
            // Still a block: keep what is lighter than the block's average.
            long sum = 0;
            for (int c : src) sum += luma(c);
            int avg = (int) (sum / src.length);
            for (int i = 0; i < src.length; i++) px[i] = (src[i] >>> 24) * Math.min(255, Math.max(0, (luma(src[i]) - avg - 24) * 4)) / 255;
        }
        int left = SIZE, top = SIZE, right = -1, bottom = -1;
        for (int y = 0; y < SIZE; y++) for (int x = 0; x < SIZE; x++) if (px[y * SIZE + x] > 24) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
        Bitmap out = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888);
        if (right < 0) return out;
        int[] glyph = new int[SIZE * SIZE];
        for (int i = 0; i < px.length; i++) glyph[i] = (px[i] << 24) | 0xffffff;
        Bitmap full = Bitmap.createBitmap(glyph, SIZE, SIZE, Bitmap.Config.ARGB_8888);
        int w = right - left + 1, h = bottom - top + 1, box = SIZE * 92 / 100;
        float k = Math.min(box / (float) w, box / (float) h);
        int dw = Math.round(w * k), dh = Math.round(h * k), dx = (SIZE - dw) / 2, dy = (SIZE - dh) / 2;
        new Canvas(out).drawBitmap(full, new android.graphics.Rect(left, top, right + 1, bottom + 1), new android.graphics.Rect(dx, dy, dx + dw, dy + dh), new android.graphics.Paint(android.graphics.Paint.FILTER_BITMAP_FLAG));
        full.recycle();
        return out;
    }

    private static int dist(int a, int b) { return Math.abs(((a >> 16) & 255) - ((b >> 16) & 255)) + Math.abs(((a >> 8) & 255) - ((b >> 8) & 255)) + Math.abs((a & 255) - (b & 255)); }

    private static int luma(int c) { return (((c >> 16) & 255) * 299 + ((c >> 8) & 255) * 587 + (c & 255) * 114) / 1000; }

    private static byte[] bytes(Bitmap bitmap) {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes);
        bitmap.recycle();
        return bytes.toByteArray();
    }

    private static WebResourceResponse png(Bitmap bitmap) {
        return new WebResourceResponse("image/png", null, new ByteArrayInputStream(bytes(bitmap)));
    }

    /** The leanback launcher activity's banner, else the application banner. */
    static Drawable banner(PackageManager pm, String pkg) throws PackageManager.NameNotFoundException {
        android.content.Intent launch = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (launch != null && launch.getComponent() != null) {
            Drawable d = pm.getActivityBanner(launch.getComponent());
            if (d != null) return d;
        }
        return pm.getApplicationBanner(pkg);
    }
}
