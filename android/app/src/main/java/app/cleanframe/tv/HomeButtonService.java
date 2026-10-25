package app.cleanframe.tv;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Log;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

/**
 * Google TV always resolves Home to its own launcher and ignores the default-home setting.
 * This service (enabled by the user in Settings > Accessibility) sends Home to CleanFrame:
 * a short press opens CleanFrame, a long press opens the original Google TV Home.
 * It also applies the remote button assignments in RemoteKeys and captures a button for the learn step.
 */
public class HomeButtonService extends AccessibilityService {
    static final String GOOGLE_HOME = "com.google.android.apps.tv.launcherx";
    private static final long LONG_PRESS_MS = 800;
    /** Overlays that can sit on top of Google TV Home without the user leaving it. */
    private static final String[] OVERLAYS = { "com.android.systemui", "com.tcl.dashboard", "com.tcl.globalkeyoverlay",
            "com.google.android.inputmethod.latin", "com.tcl.inputmethod.international" };

    /** Set by DeviceBridge.systemHome() so a deliberate trip to Google TV Home is not undone. */
    static volatile long allowSystemHomeUntil;
    /** True while Android has this service bound, i.e. it is enabled and receiving keys. */
    static volatile boolean connected;
    private static final String TAG = "CleanFrameKeys";

    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean inSystemHome, longFired;
    /** Key code whose press was captured by the learn step; its key-up is swallowed too. */
    private int learnedCode = -1;
    private final Runnable longPress = new Runnable() {
        @Override public void run() { longFired = true; openSystemHome(); }
    };


    @Override
    protected void onServiceConnected() { connected = true; RemoteKeys.notifyChanged(); }

    @Override
    public boolean onUnbind(Intent intent) { connected = false; RemoteKeys.notifyChanged(); return super.onUnbind(intent); }

    @Override
    protected boolean onKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        boolean down = event.getAction() == KeyEvent.ACTION_DOWN, up = event.getAction() == KeyEvent.ACTION_UP;
        if (RemoteKeys.learning()) Log.i(TAG, (down ? "down " : up ? "up " : "other ") + code + " " + KeyEvent.keyCodeToString(code)
                + " scan=" + event.getScanCode() + " repeat=" + event.getRepeatCount() + " device=" + event.getDeviceId() + " source=0x" + Integer.toHexString(event.getSource()));
        if (code != KeyEvent.KEYCODE_HOME) return remoteKey(event, code, down, up);
        if (down && event.getRepeatCount() == 0) {
            longFired = false;
            handler.postDelayed(longPress, LONG_PRESS_MS);
        } else if (event.getAction() == KeyEvent.ACTION_UP) {
            handler.removeCallbacks(longPress);
            if (!longFired) openCleanFrame(true);
        }
        return true;
    }

    /** Learn step and saved assignments for every key except Home. Navigation keys always pass through. */
    private boolean remoteKey(KeyEvent event, int code, boolean down, boolean up) {
        if (code == learnedCode) { if (up) learnedCode = -1; return true; }
        if (RemoteKeys.navigation(code)) return false;
        if (RemoteKeys.learning()) {
            if (down && event.getRepeatCount() == 0) {
                RemoteKeys.learn(false);
                learnedCode = code;
                RemoteKeys.Listener l = RemoteKeys.listener;
                if (l != null) l.learned(code, KeyEvent.keyCodeToString(code), event.getScanCode());
            }
            return true;
        }
        String action = RemoteKeys.action(this, code);
        if (action == null) return false;
        if (up && !event.isCanceled()) perform(action);
        return true;
    }

    private void perform(String action) {
        DeviceBridge bridge = new DeviceBridge(this);
        boolean ok = true;
        if (action.equals("home")) openCleanFrame(true);
        else if (action.equals("screensaver")) ok = bridge.screensaver();
        else if (action.startsWith("app:")) ok = bridge.launch(action.substring(4));
        else if (action.startsWith("input:")) ok = bridge.openInput(action.substring(6));
        if (!ok) Log.w(TAG, "Could not perform " + action);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || event.getPackageName() == null) return;
        String pkg = event.getPackageName().toString();
        if (pkg.equals(GOOGLE_HOME)) {
            if (inSystemHome || SystemClock.uptimeMillis() < allowSystemHomeUntil) { inSystemHome = true; return; }
            openCleanFrame(false); // e.g. leaving an app or waking from standby lands on Google TV Home
            return;
        }
        for (String overlay : OVERLAYS) if (pkg.equals(overlay)) return;
        inSystemHome = false;
    }

    @Override
    public void onInterrupt() { handler.removeCallbacks(longPress); }

    /** homeKey: the Home button itself, which also leaves Settings or All apps for Home. */
    private void openCleanFrame(boolean homeKey) {
        inSystemHome = false;
        startActivity(new Intent(this, MainActivity.class).putExtra(MainActivity.EXTRA_HOME_KEY, homeKey)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT));
    }

    private void openSystemHome() {
        allowSystemHomeUntil = SystemClock.uptimeMillis() + 5000;
        if (!new DeviceBridge(this).systemHome()) openCleanFrame(false);
    }
}
