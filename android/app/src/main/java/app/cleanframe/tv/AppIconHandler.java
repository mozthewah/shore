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
            Bitmap b = mono ? mono(icon) : draw(icon, SIZE, SIZE);
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

    /**
     * White glyph on transparent. Adaptive icons give their foreground layer (the logo without its plate).
     * Flat icons lose the plate by distance from the corner colour, so a logo on a solid square stays a logo.
     */
    private static Bitmap mono(Drawable icon) {
        Bitmap b;
        boolean plate = true;
        if (icon instanceof AdaptiveIconDrawable && ((AdaptiveIconDrawable) icon).getForeground() != null) {
            // The foreground is 108 units with the 72-unit safe zone in the middle: draw it 1.5x and crop to the centre.
            b = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888);
            Drawable fg = ((AdaptiveIconDrawable) icon).getForeground();
            fg.setBounds(-SIZE / 4, -SIZE / 4, SIZE + SIZE / 4, SIZE + SIZE / 4);
            fg.draw(new Canvas(b));
            plate = false;
        } else b = draw(icon, SIZE, SIZE);
        int[] px = new int[SIZE * SIZE];
        b.getPixels(px, 0, SIZE, 0, 0, SIZE, SIZE);
        int bg = px[SIZE * 6 + 6], bgA = bg >>> 24, br = (bg >> 16) & 255, bgG = (bg >> 8) & 255, bb = bg & 255;
        boolean solid = plate && bgA > 200;
        for (int i = 0; i < px.length; i++) {
            int c = px[i], a = c >>> 24;
            if (solid) {
                int d = Math.abs(((c >> 16) & 255) - br) + Math.abs(((c >> 8) & 255) - bgG) + Math.abs((c & 255) - bb);
                a = a * Math.min(255, Math.max(0, (d - 40) * 3)) / 255;
            }
            px[i] = (a << 24) | 0xffffff;
        }
        b.setPixels(px, 0, SIZE, 0, 0, SIZE, SIZE);
        return b;
    }

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
