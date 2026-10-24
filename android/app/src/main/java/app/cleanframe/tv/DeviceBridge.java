package app.cleanframe.tv;

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

    DeviceBridge(Context context) { this(context, null, null); }

    DeviceBridge(Context context, OnlineWallpapers online, TopShelf topShelf) {
        this.context = context.getApplicationContext();
        this.pm = this.context.getPackageManager();
        this.online = online;
        this.topShelf = topShelf;
    }

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
                    .put("pexels", OnlineWallpapers.pexelsAvailable()).put("klipy", OnlineWallpapers.klipyAvailable()).toString();
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
        for (TvInputInfo info : tv.getTvInputList()) {
            if (!info.isPassthroughInput() || info.isHidden(context)) continue;
            try {
                CharSequence custom = info.loadCustomLabel(context), label = info.loadLabel(context);
                String name = custom != null && custom.length() > 0 ? custom.toString() : label != null ? label.toString() : info.getId();
                out.put(new JSONObject().put("id", info.getId()).put("name", name)
                        .put("type", info.getType()).put("state", tv.getInputState(info.getId())));
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
