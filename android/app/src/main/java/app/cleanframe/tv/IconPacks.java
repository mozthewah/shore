package app.cleanframe.tv;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.res.Resources;
import android.graphics.drawable.Drawable;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xmlpull.v1.XmlPullParser;
import org.xmlpull.v1.XmlPullParserFactory;

import java.io.InputStream;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Third-party icon packs in the common launcher format (ADW, Nova, Projectivy and most others):
 * an app that answers one of the theme intents and maps components to drawables in appfilter.xml.
 * Shore only reads the pack's resources; nothing in the pack runs.
 */
final class IconPacks {
    private static final String[] ACTIONS = { "org.adw.launcher.THEMES", "com.novalauncher.THEME", "com.teslacoilsw.launcher.THEME",
            "com.anddoes.launcher.THEME", "com.gau.go.launcherex.theme", "com.spocky.projengmenu.icons.ACTION_PICK_ICON" };
    private static final Map<String, Map<String, String>> MAPS = new HashMap<>();

    private IconPacks() { }

    /** Installed packs as [{id: package, name: label}], sorted by name. */
    static String list(Context context) {
        PackageManager pm = context.getPackageManager();
        Map<String, String> found = new LinkedHashMap<>();
        for (String action : ACTIONS) {
            for (ResolveInfo r : pm.queryIntentActivities(new Intent(action), PackageManager.GET_META_DATA)) {
                String pkg = r.activityInfo.packageName;
                if (!found.containsKey(pkg)) found.put(pkg, String.valueOf(r.activityInfo.applicationInfo.loadLabel(pm)));
            }
        }
        java.util.List<Map.Entry<String, String>> sorted = new java.util.ArrayList<>(found.entrySet());
        sorted.sort((a, b) -> a.getValue().compareToIgnoreCase(b.getValue()));
        JSONArray out = new JSONArray();
        try { for (Map.Entry<String, String> e : sorted) out.put(new JSONObject().put("id", e.getKey()).put("name", e.getValue())); } catch (Exception ignored) { }
        return out.toString();
    }

    /** Packages the pack draws an icon for. */
    static String apps(Context context, String pack) {
        JSONArray out = new JSONArray();
        for (String pkg : map(context, pack).keySet()) out.put(pkg);
        return out.toString();
    }

    /** The pack's icon for an app, or null when the pack has none. */
    static Drawable icon(Context context, String pack, String pkg) {
        String name = map(context, pack).get(pkg);
        if (name == null) return null;
        try {
            Resources res = context.getPackageManager().getResourcesForApplication(pack);
            int id = res.getIdentifier(name, "drawable", pack);
            if (id == 0) id = res.getIdentifier(name, "mipmap", pack);
            return id == 0 ? null : res.getDrawable(id, null);
        } catch (Exception e) { return null; }
    }

    /** package -> drawable name. The app's launcher activity wins over other components of the same package. */
    private static synchronized Map<String, String> map(Context context, String pack) {
        Map<String, String> cached = MAPS.get(pack);
        if (cached != null) return cached;
        Map<String, String> out = new HashMap<>();
        if (pack != null && pack.matches("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+")) {
            PackageManager pm = context.getPackageManager();
            try {
                Resources res = pm.getResourcesForApplication(pack);
                int id = res.getIdentifier("appfilter", "xml", pack);
                Map<String, String> launch = launchClasses(pm);
                if (id != 0) read(res.getXml(id), out, launch);
                else {
                    XmlPullParser p = XmlPullParserFactory.newInstance().newPullParser();
                    try (InputStream in = res.getAssets().open("appfilter.xml")) { p.setInput(in, null); read(p, out, launch); }
                }
            } catch (Exception ignored) { }
        }
        MAPS.put(pack, out);
        return out;
    }

    private static void read(XmlPullParser p, Map<String, String> out, Map<String, String> launch) throws Exception {
        Map<String, Boolean> exact = new HashMap<>();
        for (int e = p.getEventType(); e != XmlPullParser.END_DOCUMENT; e = p.next()) {
            if (e != XmlPullParser.START_TAG || !"item".equals(p.getName())) continue;
            String component = p.getAttributeValue(null, "component"), drawable = p.getAttributeValue(null, "drawable");
            if (component == null || drawable == null || drawable.isEmpty() || !component.startsWith("ComponentInfo{")) continue;
            String inner = component.substring(14, component.length() - (component.endsWith("}") ? 1 : 0));
            int slash = inner.indexOf('/');
            String pkg = slash < 0 ? inner : inner.substring(0, slash), cls = slash < 0 ? "" : inner.substring(slash + 1);
            if (pkg.isEmpty() || Boolean.TRUE.equals(exact.get(pkg))) continue;
            boolean isLaunch = !cls.isEmpty() && cls.equals(launch.get(pkg));
            if (isLaunch || !out.containsKey(pkg)) { out.put(pkg, drawable); if (isLaunch) exact.put(pkg, true); }
        }
    }

    /** Launcher activity of every launchable app (TV launcher first), from one query each. */
    private static Map<String, String> launchClasses(PackageManager pm) {
        Map<String, String> out = new HashMap<>();
        for (String category : new String[] { Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER }) {
            for (ResolveInfo r : pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category), 0))
                if (!out.containsKey(r.activityInfo.packageName)) out.put(r.activityInfo.packageName, r.activityInfo.name);
        }
        return out;
    }

    /** Forget a pack's map, for example after it was updated. */
    static synchronized void reset() { MAPS.clear(); }
}
