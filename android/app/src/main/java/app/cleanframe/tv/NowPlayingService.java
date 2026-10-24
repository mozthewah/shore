package app.cleanframe.tv;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.service.notification.NotificationListenerService;

import org.json.JSONObject;

import java.util.List;

/**
 * Lets CleanFrame read the active media sessions (title, artist, app) for the "Now playing" line.
 * Android only hands media sessions to an enabled notification listener, so the user has to allow
 * CleanFrame in Settings > Apps > Special app access > Notification access. Notifications themselves are ignored.
 */
public class NowPlayingService extends NotificationListenerService {
    /** {access, playing, title, artist, app, pkg}. playing is false when nothing is playing or access is missing. */
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
                return out.put("playing", true).put("title", clip(title)).put("artist", clip(artist)).put("app", appName(context, pkg)).put("pkg", pkg).toString();
            }
        } catch (SecurityException e) {
            // Notification access not granted: access stays false.
        } catch (Exception ignored) { }
        return out.toString();
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
