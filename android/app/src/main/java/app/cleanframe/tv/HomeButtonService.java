package app.cleanframe.tv;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

/**
 * Google TV always resolves Home to its own launcher and ignores the default-home setting.
 * This service (enabled by the user in Settings > Accessibility) sends Home to CleanFrame:
 * a short press opens CleanFrame, a long press opens the original Google TV Home.
 */
public class HomeButtonService extends AccessibilityService {
    static final String GOOGLE_HOME = "com.google.android.apps.tv.launcherx";
    private static final long LONG_PRESS_MS = 800;
    /** Overlays that can sit on top of Google TV Home without the user leaving it. */
    private static final String[] OVERLAYS = { "com.android.systemui", "com.tcl.dashboard", "com.tcl.globalkeyoverlay",
            "com.google.android.inputmethod.latin", "com.tcl.inputmethod.international" };

    /** Set by DeviceBridge.systemHome() so a deliberate trip to Google TV Home is not undone. */
    static volatile long allowSystemHomeUntil;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean inSystemHome, longFired;
    private final Runnable longPress = new Runnable() {
        @Override public void run() { longFired = true; openSystemHome(); }
    };

    @Override
    protected boolean onKeyEvent(KeyEvent event) {
        if (event.getKeyCode() != KeyEvent.KEYCODE_HOME) return false;
        if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
            longFired = false;
            handler.postDelayed(longPress, LONG_PRESS_MS);
        } else if (event.getAction() == KeyEvent.ACTION_UP) {
            handler.removeCallbacks(longPress);
            if (!longFired) openCleanFrame();
        }
        return true;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || event.getPackageName() == null) return;
        String pkg = event.getPackageName().toString();
        if (pkg.equals(GOOGLE_HOME)) {
            if (inSystemHome || SystemClock.uptimeMillis() < allowSystemHomeUntil) { inSystemHome = true; return; }
            openCleanFrame(); // e.g. leaving an app or waking from standby lands on Google TV Home
            return;
        }
        for (String overlay : OVERLAYS) if (pkg.equals(overlay)) return;
        inSystemHome = false;
    }

    @Override
    public void onInterrupt() { handler.removeCallbacks(longPress); }

    private void openCleanFrame() {
        inSystemHome = false;
        startActivity(new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT));
    }

    private void openSystemHome() {
        allowSystemHomeUntil = SystemClock.uptimeMillis() + 5000;
        if (!new DeviceBridge(this).systemHome()) openCleanFrame();
    }
}
