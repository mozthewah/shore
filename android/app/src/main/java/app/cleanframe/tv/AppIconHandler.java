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

/** Serves installed-app icons at /appicon/<package>.png so main.js can show them. */
final class AppIconHandler implements WebViewAssetLoader.PathHandler {
    private static final int SIZE = 192;
    private final PackageManager pm;

    AppIconHandler(Context context) {
        this.pm = context.getApplicationContext().getPackageManager();
    }

    @Override
    public WebResourceResponse handle(String path) {
        String pkg = path.endsWith(".png") ? path.substring(0, path.length() - 4) : path;
        if (!pkg.matches("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+")) return null;
        try {
            Drawable icon = pm.getApplicationIcon(pkg);
            Bitmap bitmap = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            icon.setBounds(0, 0, SIZE, SIZE);
            icon.draw(canvas);
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes);
            bitmap.recycle();
            return new WebResourceResponse("image/png", null, new ByteArrayInputStream(bytes.toByteArray()));
        } catch (PackageManager.NameNotFoundException e) {
            return null;
        }
    }
}
