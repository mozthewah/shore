package app.cleanframe.tv;

import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.webkit.WebResourceResponse;

import androidx.webkit.WebViewAssetLoader;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

/** Serves installed-app icons at /appicon/<package>.png and Android TV banners at /appbanner/<package>.png. */
final class AppIconHandler implements WebViewAssetLoader.PathHandler {
    private static final int SIZE = 192, BANNER_W = 640, BANNER_H = 360;
    private final PackageManager pm;
    private final boolean banner;

    AppIconHandler(Context context) { this(context, false); }

    AppIconHandler(Context context, boolean banner) {
        this.pm = context.getApplicationContext().getPackageManager();
        this.banner = banner;
    }

    @Override
    public WebResourceResponse handle(String path) {
        String pkg = path.endsWith(".png") ? path.substring(0, path.length() - 4) : path;
        if (!pkg.matches("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+")) return null;
        try {
            Drawable icon = banner ? banner(pkg) : pm.getApplicationIcon(pkg);
            if (icon == null) return null; // no banner: the page shows its own card
            int w = banner ? BANNER_W : SIZE, h = banner ? BANNER_H : SIZE;
            Bitmap bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            icon.setBounds(0, 0, w, h);
            icon.draw(canvas);
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes);
            bitmap.recycle();
            return new WebResourceResponse("image/png", null, new ByteArrayInputStream(bytes.toByteArray()));
        } catch (PackageManager.NameNotFoundException e) {
            return null;
        }
    }

    /** The leanback launcher activity's banner, else the application banner. */
    private Drawable banner(String pkg) throws PackageManager.NameNotFoundException {
        android.content.Intent launch = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (launch != null && launch.getComponent() != null) {
            Drawable d = pm.getActivityBanner(launch.getComponent());
            if (d != null) return d;
        }
        return pm.getApplicationBanner(pkg);
    }
}
