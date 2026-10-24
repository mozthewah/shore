package app.cleanframe.tv;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.media.tv.TvContract;
import android.media.tv.TvInputInfo;
import android.media.tv.TvInputManager;
import android.provider.Settings;
import android.view.accessibility.AccessibilityManager;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Implements what device.js does with Tizen APIs, using public Android intents. */
final class DeviceBridge {
    private final Context context;
    private final PackageManager pm;
    private final OnlineWallpapers online;
    private final TopShelf topShelf;
    private final Companion phone;

    DeviceBridge(Context context) { this(context, null, null, null); }

    DeviceBridge(Context context, OnlineWallpapers online, TopShelf topShelf, Companion phone) {
        this.context = context.getApplicationContext();
        this.pm = this.context.getPackageManager();
        this.online = online;
        this.topShelf = topShelf;
        this.phone = phone;
    }

    /** {access, playing, title, artist, app, pkg} from the active media sessions (needs notification access). */
    @JavascriptInterface
    public String nowPlaying() { return NowPlayingService.info(context); }

    /** Opens the screen where the user allows CleanFrame to read what is playing. */
    @JavascriptInterface
    public boolean nowPlayingSettings() {
        return start(new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")) || settings();
    }

    /** Shore Companion: {enabled, url, qr, count, place}. */
    @JavascriptInterface
    public String phoneInfo() { return phone == null ? "{}" : phone.info(); }

    /** Switches the companion server on or off (remembered across restarts). */
    @JavascriptInterface
    public void phoneEnable(boolean on) { if (phone != null) phone.setEnabled(on); }

    /** New pairing key; phones have to scan the code again. */
    @JavascriptInterface
    public void phoneForget() { if (phone != null) phone.forget(); }

    /** Wallpaper id shown on the TV, used as the companion's background. */
    @JavascriptInterface
    public void phoneWallpaper(String id) { if (phone != null) phone.setWallpaper(id); }

    @JavascriptInterface
    public void phoneClear() { if (phone != null) phone.clear(); }

    /** Top Shelf recommendations already on disk: {pkg: {service, items:[{title, sub, card, hero, url}]}}. */
    @JavascriptInterface
    public String topShelfIndex() { return topShelf == null ? "{}" : topShelf.index(); }

    /** Refreshes recommendations for these Home packages (JSON array) in the background. */
    @JavascriptInterface
    public void topShelf(String packagesJson) { if (topShelf != null && packagesJson != null) topShelf.request(packagesJson); }

    /** Opens an https:// or app deep link inside one package; false lets the page launch the app instead. */
    @JavascriptInterface
    public boolean openLink(String url, String pkg) {
        if (url == null || pkg == null || pkg.equals(context.getPackageName())) return false;
        if (url.startsWith("http://") || !url.startsWith("https://") && !url.matches("[a-z][a-z0-9+.-]*://[^\\s]+")) return false;
        Intent intent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(url)).setPackage(pkg);
        return start(intent); // false when the app has no matching link handler
    }

    /** {source, unsplash}: the chosen online photo source and whether Unsplash has a build-time key. */
    @JavascriptInterface
    public String onlineInfo() {
        try {
            return new JSONObject().put("source", online == null ? "off" : online.source()).put("unsplash", OnlineWallpapers.unsplashAvailable())
                    .put("pexels", OnlineWallpapers.pexelsAvailable()).put("klipy", OnlineWallpapers.klipyAvailable()).put("phone", phone != null).toString();
        } catch (Exception e) { return "{}"; }
    }

    /** Chooses an online photo source ("off" clears the cache). force refreshes even when recent. */
    @JavascriptInterface
    public void onlineSource(String source, boolean force) {
        if (online != null && source != null) online.select(source, force);
    }

    @JavascriptInterface
    public boolean launch(String pkg) {
        if (pkg == null || pkg.equals(context.getPackageName())) return false;
        Intent intent = pm.getLeanbackLaunchIntentForPackage(pkg);
        if (intent == null) intent = pm.getLaunchIntentForPackage(pkg);
        return intent != null && start(intent);
    }

    /** JSON array of {appId, name} for every app the TV can launch. */
    @JavascriptInterface
    public String apps() {
        JSONArray out = new JSONArray();
        Set<String> seen = new HashSet<>();
        seen.add(context.getPackageName());
        collect(Intent.CATEGORY_LEANBACK_LAUNCHER, out, seen);
        collect(Intent.CATEGORY_LAUNCHER, out, seen); // phone-style apps some TVs still show
        return out.toString();
    }

    private void collect(String category, JSONArray out, Set<String> seen) {
        Intent query = new Intent(Intent.ACTION_MAIN).addCategory(category);
        List<ResolveInfo> found = pm.queryIntentActivities(query, 0);
        for (ResolveInfo info : found) {
            String pkg = info.activityInfo.packageName;
            if (!seen.add(pkg)) continue;
            try {
                CharSequence label = info.loadLabel(pm);
                out.put(new JSONObject().put("appId", pkg).put("name", label == null ? pkg : label.toString()));
            } catch (Exception ignored) { }
        }
    }

    /** JSON array of {id, name, type, state} for HDMI and other physical inputs. state: 0 connected, 1 standby, 2 disconnected. */
    @JavascriptInterface
    public String inputs() {
        JSONArray out = new JSONArray();
        TvInputManager tv = (TvInputManager) context.getSystemService(Context.TV_INPUT_SERVICE);
        if (tv == null) return out.toString();
        List<TvInputInfo> all = tv.getTvInputList();
        // HDMI-CEC devices appear as child inputs of their port; their label is the device's own name ("PlayStation 5").
        java.util.Map<String, String> cec = new java.util.HashMap<>();
        for (TvInputInfo info : all) {
            if (info.getParentId() == null) continue;
            CharSequence label = info.loadLabel(context);
            if (label != null && label.length() > 0 && !cec.containsKey(info.getParentId())) cec.put(info.getParentId(), label.toString());
        }
        for (TvInputInfo info : all) {
            if (!info.isPassthroughInput() || info.isHidden(context) || info.getParentId() != null) continue;
            try {
                CharSequence custom = info.loadCustomLabel(context), label = info.loadLabel(context);
                String device = cec.get(info.getId());
                String name = custom != null && custom.length() > 0 ? custom.toString() : device != null ? device : label != null ? label.toString() : info.getId();
                out.put(new JSONObject().put("id", info.getId()).put("name", name)
                        .put("type", info.getType()).put("state", tv.getInputState(info.getId()))
                        .put("port", label != null ? label.toString() : ""));
            } catch (Exception ignored) { }
        }
        return out.toString();
    }

    /** Switches the TV to a physical input through the system TV app. */
    @JavascriptInterface
    public boolean openInput(String id) {
        if (id == null || id.isEmpty()) return false;
        return start(new Intent(Intent.ACTION_VIEW, TvContract.buildChannelUriForPassthroughInput(id)));
    }

    /** {service, learning, keys:[{code, name, action}]}: whether the button service is on, a learn step is waiting, and the saved assignments. */
    @JavascriptInterface
    public String remoteInfo() {
        try {
            return new JSONObject().put("service", remoteServiceOn()).put("learning", RemoteKeys.learning()).put("keys", RemoteKeys.list(context)).toString();
        } catch (Exception e) { return "{}"; }
    }

    private boolean remoteServiceOn() {
        if (HomeButtonService.connected) return true;
        AccessibilityManager am = (AccessibilityManager) context.getSystemService(Context.ACCESSIBILITY_SERVICE);
        if (am == null) return false;
        for (AccessibilityServiceInfo info : am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)) {
            if (info.getResolveInfo() != null && info.getResolveInfo().serviceInfo != null
                    && context.getPackageName().equals(info.getResolveInfo().serviceInfo.packageName)) return true;
        }
        return false;
    }

    /** Starts (or cancels) the learn step: the next non-navigation button is reported to the page instead of acting. */
    @JavascriptInterface
    public boolean remoteLearn(boolean on) {
        RemoteKeys.learn(on && remoteServiceOn());
        return RemoteKeys.learning();
    }

    /** Saves what a button does; "default" restores the TV's own behaviour. */
    @JavascriptInterface
    public void remoteSet(int keyCode, String name, String action) {
        if (keyCode <= 0 || RemoteKeys.navigation(keyCode)) return;
        RemoteKeys.put(context, keyCode, name, action);
    }

    @JavascriptInterface
    public boolean accessibilitySettings() {
        return start(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) || settings();
    }

    @JavascriptInterface
    public boolean settings() {
        return start(new Intent(Settings.ACTION_SETTINGS));
    }

    /** Opens the TV's original launcher (Google TV / TCL Home), never CleanFrame itself. */
    @JavascriptInterface
    public boolean systemHome() {
        HomeButtonService.allowSystemHomeUntil = android.os.SystemClock.uptimeMillis() + 5000;
        Intent home = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME);
        for (ResolveInfo info : pm.queryIntentActivities(home, 0)) {
            ActivityInfo a = info.activityInfo;
            if (a.packageName.equals(context.getPackageName())) continue;
            if (a.packageName.equals("com.android.settings")) continue; // fallback "home" on some builds
            Intent intent = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                    .setComponent(new ComponentName(a.packageName, a.name));
            if (start(intent)) return true;
        }
        return false;
    }

    /** Stand-in for Art Mode: start the system screensaver (Ambient mode on Google TV). */
    @JavascriptInterface
    public boolean screensaver() {
        Intent dream = new Intent(Intent.ACTION_MAIN)
                .setClassName("com.android.systemui", "com.android.systemui.Somnambulator");
        if (start(dream)) return true;
        return start(new Intent(Settings.ACTION_DREAM_SETTINGS));
    }

    private boolean start(Intent intent) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(intent);
            return true;
        } catch (ActivityNotFoundException | SecurityException e) {
            return false;
        }
    }
}
