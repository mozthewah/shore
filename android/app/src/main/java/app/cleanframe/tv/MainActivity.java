package app.cleanframe.tv;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.media.tv.TvInputManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/** Full-screen WebView that runs the unchanged CleanFrame UI from the APK's assets. */
public class MainActivity extends Activity {
    static final String ORIGIN = "https://appassets.androidplatform.net";
    static final String EXTRA_SAVER = "app.cleanframe.tv.SAVER";
    private static volatile boolean saverRequest;
    private boolean loaded;

    static boolean takeSaverRequest() { boolean r = saverRequest; saverRequest = false; return r; }
    private WebView web;
    private TvInputManager tvInputs;
    private OnlineWallpapers online;
    private TopShelf topShelf;
    private Companion phone;
    private RemoteKeys.Listener remoteListener;

    /** Tells the page when an HDMI device is plugged in, powered on or switched off. */
    private final TvInputManager.TvInputCallback inputCallback = new TvInputManager.TvInputCallback() {
        @Override public void onInputStateChanged(String inputId, int state) { inputsChanged(); }
        @Override public void onInputAdded(String inputId) { inputsChanged(); }
        @Override public void onInputRemoved(String inputId) { inputsChanged(); }
        @Override public void onInputUpdated(String inputId) { inputsChanged(); }
    };

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        deleteSharedPreferences("atvremote"); // key of the removed remote-service pairing (0.8.4x)
        if (getIntent() != null && getIntent().getBooleanExtra(EXTRA_SAVER, false)) saverRequest = true;
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);

        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);            // preferences live in localStorage
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false); // muted animated wallpapers autoplay
        s.setSupportZoom(false);

        // A fixed https origin keeps localStorage stable across updates.
        online = new OnlineWallpapers(this);
        online.setListener((entries, status) -> runOnUiThread(() -> {
            if (web != null) web.evaluateJavascript("window.CleanFrameOnlineChanged&&window.CleanFrameOnlineChanged(" + (entries == null ? "null" : entries)
                    + "," + org.json.JSONObject.quote(status) + ")", null);
        }));
        topShelf = new TopShelf(this);
        topShelf.setListener(index -> runOnUiThread(() -> {
            if (web != null) web.evaluateJavascript("window.CleanFrameTopShelfChanged&&window.CleanFrameTopShelfChanged(" + index + ")", null);
        }));
        Updater.get(this).setListener(() -> runOnUiThread(() -> {
            if (web != null) web.evaluateJavascript("window.CleanFrameUpdateChanged&&window.CleanFrameUpdateChanged()", null);
        }));
        phone = new Companion(this);
        online.setPhone(phone);
        phone.setCommands(new Companion.Commands() {
            @Override public void set(String axis, String value) {
                runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.CleanFrameCompanionSet&&window.CleanFrameCompanionSet(" + org.json.JSONObject.quote(axis) + "," + org.json.JSONObject.quote(value) + ")", null); });
            }
            @Override public void restore(String json) {
                runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.CleanFrameCompanionRestore&&window.CleanFrameCompanionRestore(" + org.json.JSONObject.quote(json) + ")", null); });
            }
        });
        phone.setListener(count -> {
            online.phoneChanged();
            runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.CleanFramePhoneChanged&&window.CleanFramePhoneChanged(" + count + ")", null); });
        });
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/assets/", online.handler()) // online photos, then bundled files
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .addPathHandler("/appicon/", new AppIconHandler(this))
                .addPathHandler("/appbanner/", new AppIconHandler(this, true))
                .addPathHandler("/topshelf/", topShelf.handler())
                .addPathHandler("/nowplaying/", NowPlayingService.handler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true; // Home screen never navigates away.
            }

            @Override
            public void onPageFinished(WebView view, String url) { loaded = true; }
        });

        RemoteKeys.listener = remoteListener = new RemoteKeys.Listener() {
            @Override public void learned(int keyCode, String name, int scanCode) {
                String json = "{\"code\":" + keyCode + ",\"name\":" + org.json.JSONObject.quote(name) + ",\"scan\":" + scanCode + "}";
                runOnUiThread(() -> { if (web != null) web.evaluateJavascript("window.CleanFrameRemoteLearned&&window.CleanFrameRemoteLearned(" + json + ")", null); });
            }
            @Override public void changed() { runOnUiThread(MainActivity.this::remoteChanged); }
        };
        web.addJavascriptInterface(new DeviceBridge(this, online, topShelf, phone), "CleanFrameAndroid");
        web.loadUrl(ORIGIN + "/assets/index.html");
        tvInputs = (TvInputManager) getSystemService(TV_INPUT_SERVICE);
        if (tvInputs != null) tvInputs.registerCallback(inputCallback, new Handler(Looper.getMainLooper()));
        web.requestFocus();
    }

    /**
     * The remote's Back button is consumed by Android before the page sees it.
     * Forward it as Escape (keyCode 27), which CleanFrame already treats as Back.
     */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getKeyCode() == KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) sendKey("keydown");
            else if (event.getAction() == KeyEvent.ACTION_UP) sendKey("keyup");
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    /** One button from the phone remote. Returns whether it reached something. */
    private void inputsChanged() {
        if (web != null) web.evaluateJavascript("window.CleanFrameInputsChanged&&window.CleanFrameInputsChanged()", null);
    }

    private void remoteChanged() {
        if (web != null) web.evaluateJavascript("window.CleanFrameRemoteChanged&&window.CleanFrameRemoteChanged()", null);
    }

    private void sendKey(String type) {
        if (web == null) return;
        web.evaluateJavascript("(function(){var e=new KeyboardEvent('" + type + "',{key:'Escape',code:'Escape',bubbles:true,cancelable:true});"
                + "try{Object.defineProperty(e,'keyCode',{get:function(){return 27;}});Object.defineProperty(e,'which',{get:function(){return 27;}});}catch(x){}"
                + "document.dispatchEvent(e);})();", null);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (web != null) web.requestFocus(); // Home pressed while CleanFrame is the Home app
        if (intent != null && intent.getBooleanExtra(EXTRA_SAVER, false)) {
            if (web != null && loaded) web.evaluateJavascript("window.CleanFrameSaver&&window.CleanFrameSaver()", null);
            else saverRequest = true;
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) { web.onResume(); web.resumeTimers(); web.requestFocus(); inputsChanged(); remoteChanged(); }
        if (online != null) online.refreshIfStale();
        if (phone != null) phone.resume();
        Updater.get(this).checkIfStale();
    }

    @Override
    protected void onPause() {
        RemoteKeys.learn(false); // never capture a button while another app is in front
        if (web != null) web.onPause(); // stops wallpaper rotation work while an app is open
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (tvInputs != null) tvInputs.unregisterCallback(inputCallback);
        if (online != null) online.setListener(null);
        if (topShelf != null) topShelf.setListener(null);
        Updater.get(this).setListener(null);
        if (phone != null) { phone.setListener(null); phone.setCommands(null); phone.stop(); }
        if (RemoteKeys.listener == remoteListener) { RemoteKeys.listener = null; RemoteKeys.learn(false); }
        if (web != null) { web.removeJavascriptInterface("CleanFrameAndroid"); web.destroy(); web = null; }
        super.onDestroy();
    }
}
