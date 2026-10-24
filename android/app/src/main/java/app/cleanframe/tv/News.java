package app.cleanframe.tv;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Xml;

import org.json.JSONArray;
import org.json.JSONObject;
import org.xmlpull.v1.XmlPullParser;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Headlines for the line under the clock and the screensaver.
 * Fetches Google News top stories for the TV's language and country, or an RSS/Atom feed typed in the phone companion.
 * Only titles, sources and times are kept; nothing about the viewer is sent beyond the request itself.
 */
final class News {
    private static final long MAX_AGE = 30 * 60 * 1000L, RETRY = 10 * 60 * 1000L;
    private static final int MAX_ITEMS = 20, MAX_BYTES = 1024 * 1024;

    private static News instance;
    private final SharedPreferences prefs;
    private volatile boolean busy;

    static synchronized News get(Context context) {
        if (instance == null) instance = new News(context.getApplicationContext());
        return instance;
    }

    private News(Context context) { prefs = context.getSharedPreferences("news", Context.MODE_PRIVATE); }

    /** {at, feed, items:[{t, s, d}], error}; at is 0 before the first fetch. */
    String info() { return prefs.getString("info", "{\"at\":0,\"items\":[]}"); }

    /** Fetches in the background when the cache is older than 30 minutes or the feed changed. */
    void refresh(String feed, boolean force) {
        final String url = feed == null ? "" : feed.trim();
        if (!url.isEmpty() && !url.matches("(?i)https?://\\S{4,500}")) return;
        long at = prefs.getLong("at", 0), tried = prefs.getLong("tried", 0), now = System.currentTimeMillis();
        boolean same = url.equals(prefs.getString("feed", ""));
        if (busy || (!force && same && (now - at < MAX_AGE || now - tried < RETRY))) return;
        busy = true;
        prefs.edit().putLong("tried", now).apply();
        new Thread(() -> {
            try { store(url, parse(read(url.isEmpty() ? google() : url))); }
            catch (Exception e) {
                try { prefs.edit().putString("feed", url).putString("info", new JSONObject(info()).put("error", "fetch").put("feed", url).toString()).apply(); } catch (Exception ignored) { }
            } finally { busy = false; }
        }, "shore-news").start();
    }

    private void store(String feed, JSONArray items) throws Exception {
        if (items.length() == 0) throw new Exception("empty");
        long now = System.currentTimeMillis();
        prefs.edit().putLong("at", now).putString("feed", feed)
                .putString("info", new JSONObject().put("at", now).put("feed", feed).put("items", items).toString()).apply();
    }

    /** Top stories in the system language, e.g. hl=de&gl=DE&ceid=DE:de. */
    static String google() throws Exception {
        Locale l = Locale.getDefault();
        String lang = l.getLanguage().isEmpty() ? "en" : l.getLanguage(), country = l.getCountry();
        if (lang.equals("iw")) lang = "he";
        if (country.isEmpty()) country = lang.equals("en") ? "US" : lang.equals("uk") ? "UA" : lang.toUpperCase(Locale.ROOT);
        String hl = lang.equals("en") || lang.equals("pt") || lang.equals("zh") ? lang + "-" + country : lang;
        return "https://news.google.com/rss?hl=" + URLEncoder.encode(hl, "UTF-8") + "&gl=" + country + "&ceid=" + country + ":" + URLEncoder.encode(lang, "UTF-8");
    }

    /** RSS 2.0 items or Atom entries: title, source and date. Google's "Headline - Source" titles are split. */
    static JSONArray parse(byte[] xml) throws Exception {
        XmlPullParser p = Xml.newPullParser();
        p.setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, false);
        p.setInput(new ByteArrayInputStream(xml), null);
        JSONArray out = new JSONArray();
        String channel = "", title = null, source = "", date = "";
        boolean inItem = false;
        for (int e = p.getEventType(); e != XmlPullParser.END_DOCUMENT && out.length() < MAX_ITEMS; e = p.next()) {
            if (e == XmlPullParser.START_TAG) {
                String n = p.getName();
                if (n.equals("item") || n.equals("entry")) { inItem = true; title = null; source = ""; date = ""; }
                else if (n.equals("title")) { String t = text(p); if (inItem) title = t; else if (channel.isEmpty()) channel = t; }
                else if (inItem && n.equals("source")) source = text(p);
                else if (inItem && (n.equals("pubDate") || n.equals("published") || n.equals("updated") || n.equals("dc:date"))) { if (date.isEmpty()) date = text(p); }
            } else if (e == XmlPullParser.END_TAG && (p.getName().equals("item") || p.getName().equals("entry")) && inItem) {
                inItem = false;
                if (title == null || title.isEmpty()) continue;
                if (!source.isEmpty() && title.endsWith(" - " + source)) title = title.substring(0, title.length() - source.length() - 3).trim();
                out.put(new JSONObject().put("t", clip(title, 200)).put("s", clip(source.isEmpty() ? channel : source, 60)).put("d", time(date)));
            }
        }
        return out;
    }

    private static String text(XmlPullParser p) throws Exception {
        StringBuilder b = new StringBuilder();
        int depth = 1;
        while (depth > 0) {
            int e = p.next();
            if (e == XmlPullParser.TEXT || e == XmlPullParser.CDSECT) b.append(p.getText());
            else if (e == XmlPullParser.START_TAG) depth++;
            else if (e == XmlPullParser.END_TAG) depth--;
            else if (e == XmlPullParser.END_DOCUMENT) break;
        }
        return b.toString().replaceAll("<[^>]*>", "").replaceAll("\\s+", " ").trim();
    }

    private static String clip(String s, int max) { return s.length() <= max ? s : s.substring(0, max - 1) + "…"; }

    /** Milliseconds since 1970, or 0 when the date can't be read. */
    private static long time(String s) {
        String[] formats = { "EEE, dd MMM yyyy HH:mm:ss zzz", "EEE, dd MMM yyyy HH:mm:ss Z", "yyyy-MM-dd'T'HH:mm:ssXXX", "yyyy-MM-dd'T'HH:mm:ss.SSSXXX" };
        for (String f : formats) {
            try { Date d = new SimpleDateFormat(f, Locale.ENGLISH).parse(s.trim()); if (d != null) return d.getTime(); } catch (Exception ignored) { }
        }
        return 0;
    }

    private static byte[] read(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(20000);
        c.setInstanceFollowRedirects(true);
        c.setRequestProperty("User-Agent", "Shore/" + BuildConfig.VERSION_NAME + " (+https://github.com/taynotfound/shore)");
        c.setRequestProperty("Accept", "application/rss+xml, application/atom+xml, application/xml, text/xml");
        try {
            if (c.getResponseCode() / 100 != 2) throw new Exception("HTTP " + c.getResponseCode());
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buf = new byte[16 * 1024];
                int n;
                while ((n = in.read(buf)) > 0) { out.write(buf, 0, n); if (out.size() > MAX_BYTES) throw new Exception("too large"); }
                return out.toByteArray();
            }
        } finally { c.disconnect(); }
    }
}
