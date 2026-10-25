package app.cleanframe.tv;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * The last Home wallpaper as a small JPEG, shown natively the moment Shore's window opens and faded out once
 * the page has painted. After a reboot the WebView needs several seconds; this keeps the screen from staying black.
 * The page saves a new one only when the wallpaper changes.
 */
final class Backdrop {
    private static final ExecutorService IO = Executors.newSingleThreadExecutor();
    private static final int MAX_BYTES = 600 * 1024;

    private Backdrop() { }

    private static File file(Context c) { return new File(c.getFilesDir(), "backdrop.jpg"); }

    /** The saved backdrop, or null. Small enough to decode on the main thread at start. */
    static Bitmap load(Context c) {
        File f = file(c);
        if (!f.isFile()) return null;
        try { return BitmapFactory.decodeFile(f.getPath()); } catch (Throwable e) { return null; }
    }

    /** dataUrl: "data:image/jpeg;base64,...", from a canvas on the page. */
    static void save(Context context, String dataUrl) {
        final Context c = context.getApplicationContext();
        if (dataUrl == null || !dataUrl.startsWith("data:image/jpeg;base64,") || dataUrl.length() > MAX_BYTES * 4 / 3 + 64) return;
        IO.execute(() -> {
            try {
                byte[] bytes = Base64.decode(dataUrl.substring(dataUrl.indexOf(',') + 1), Base64.DEFAULT);
                if (bytes.length < 3 || (bytes[0] & 255) != 0xFF || (bytes[1] & 255) != 0xD8) return;
                File tmp = new File(c.getFilesDir(), "backdrop.jpg.tmp");
                try (FileOutputStream out = new FileOutputStream(tmp)) { out.write(bytes); }
                if (!tmp.renameTo(file(c))) tmp.delete();
            } catch (Exception ignored) { }
        });
    }

    static void clear(Context c) { file(c).delete(); }

}
