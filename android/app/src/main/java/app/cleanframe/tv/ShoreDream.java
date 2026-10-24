package app.cleanframe.tv;

import android.graphics.Color;
import android.service.dreams.DreamService;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/**
 * Shore as the TV's system screensaver: the same page as Home, opened straight into its screensaver.
 * Only used where the TV lets the owner pick a third-party screensaver; any button wakes the TV as usual.
 */
public class ShoreDream extends DreamService {
    private WebView web;
    private OnlineWallpapers online;

    @Override
    public void onAttachedToWindow() {
        super.onAttachedToWindow();
        setInteractive(false);
        setFullscreen(true);
        setScreenBright(true);

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportZoom(false);

        online = new OnlineWallpapers(this);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/assets/", online.handler())
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .addPathHandler("/nowplaying/", NowPlayingService.handler(this))
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return true; }
        });
        web.addJavascriptInterface(new DeviceBridge(this, online, null, null), "CleanFrameAndroid");
        setContentView(web);
        web.loadUrl(MainActivity.ORIGIN + "/assets/index.html#screensaver");
    }

    @Override
    public void onDetachedFromWindow() {
        if (online != null) online.setListener(null);
        if (web != null) { web.removeJavascriptInterface("CleanFrameAndroid"); web.destroy(); web = null; }
        super.onDetachedFromWindow();
    }
}
