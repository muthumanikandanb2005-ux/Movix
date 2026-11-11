package com.movix.app;

import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeWebViewClient;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;

public class MainActivity extends BridgeActivity {
    // AdMob IDs provided by user (Kept strictly private and never exposed to UI)
    private static final String AD_UNIT_INTERSTITIAL_1 = "ca-app-pub-5684555136963044/1233900974";
    private static final String AD_UNIT_ID_2 = "ca-app-pub-5684555136963044/2645561704";

    private InterstitialAd mInterstitialAd;
    private RewardedAd mRewardedAd;
    private AdView mAdView;
    private boolean isAdLoading = false;
    private boolean isVideoPlayerOpen = false;
    private final Handler mBannerRefreshHandler = new Handler(Looper.getMainLooper());
    private final Runnable mBannerRefreshRunnable = new Runnable() {
        @Override
        public void run() {
            if (mAdView != null && !isVideoPlayerOpen && getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT) {
                mAdView.loadAd(new AdRequest.Builder().build());
            }
            mBannerRefreshHandler.postDelayed(this, 30000);
        }
    };


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable complete display cutout adaptation (flat, curved, dynamic island, mini capsule, drop notch, punch hole)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            try {
                android.view.WindowManager.LayoutParams lp = getWindow().getAttributes();
                lp.layoutInDisplayCutoutMode = android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                getWindow().setAttributes(lp);
            } catch (Exception ignored) {}
        }
        try {
            getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
        } catch (Exception ignored) {}

        // Configure WebView for butter-smooth streaming & flawless landscape orientation
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings webSettings = webView.getSettings();
            webSettings.setMediaPlaybackRequiresUserGesture(false);
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setDatabaseEnabled(true);
            webSettings.setAllowFileAccess(false);
            webSettings.setAllowContentAccess(true);
            webSettings.setUseWideViewPort(true);
            webSettings.setLoadWithOverviewMode(true);
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
            webSettings.setJavaScriptCanOpenWindowsAutomatically(false);
            webSettings.setSupportMultipleWindows(false);

            // Enable third-party cookies for cross-origin media streaming tokens & iframes
            try {
                android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);
            } catch (Exception ignored) {}
            
            // Enable hardware acceleration for butter-smooth 60fps video streaming
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            
            // Expose JavaScript bridge for web layer
            webView.addJavascriptInterface(new AdMobBridge(), "AndroidAdMob");

            // Strictly intercept & block rogue ad popups/new windows from escaping to Google Chrome
            webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
                    // Strictly block popup windows from opening Chrome or spawning extra WebViews in memory
                    return false;
                }
            });

            // Intercept & block external ad redirects while allowing smooth media streaming
            webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    if (request == null || request.getUrl() == null) return false;
                    Uri url = request.getUrl();
                    String scheme = url.getScheme();

                    // Block intent, market, and chrome schemes that launch external apps
                    if (scheme != null && !scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https")) {
                        return true;
                    }

                    // Allow subframes (iframes, video players, streaming CDNs, quality tracks) to load media seamlessly
                    if (!request.isForMainFrame()) {
                        return false;
                    }

                    String host = url.getHost();
                    // Only permit local application scheme (https://localhost) for top-level main frame
                    if ("https".equalsIgnoreCase(scheme) && "localhost".equalsIgnoreCase(host)) {
                        return false;
                    }

                    // Block rogue ad networks & popups from hijacking the main app and launching external Chrome
                    return true;
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    if (url == null) return false;
                    Uri uri = Uri.parse(url);
                    String scheme = uri.getScheme();

                    if (scheme != null && !scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https")) {
                        return true;
                    }

                    // Allow video streaming streams and iframe redirects to load smoothly
                    return false;
                }
            });
        }

        // Initialize Google Mobile Ads SDK for monetization
        MobileAds.initialize(this, initializationStatus -> {
            loadInterstitialAd();
            loadRewardedAd();
            setupBannerAd();
        });
    }

    private void enableImmersiveMode() {
        runOnUiThread(() -> {
            try {
                // Notch, dynamic island, drop notch & punch hole edge-to-edge layout
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    getWindow().getAttributes().layoutInDisplayCutoutMode = 
                        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                }

                // Android 11+ (API 30+) WindowInsetsController for sticky immersive fullscreen
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    final WindowInsetsController insetsController = getWindow().getInsetsController();
                    if (insetsController != null) {
                        insetsController.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                        insetsController.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                    }
                }

                // Legacy System UI flags
                View decorView = getWindow().getDecorView();
                decorView.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
                );
            } catch (Exception ignored) {}
        });
    }

    private void disableImmersiveMode() {
        runOnUiThread(() -> {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    getWindow().getAttributes().layoutInDisplayCutoutMode = 
                        WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT;
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    final WindowInsetsController insetsController = getWindow().getInsetsController();
                    if (insetsController != null) {
                        insetsController.show(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                    }
                }

                View decorView = getWindow().getDecorView();
                decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
            } catch (Exception ignored) {}
        });
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // During cinema mode or when video player is open, hide banner ad and adapt screen
        if (newConfig.orientation == Configuration.ORIENTATION_LANDSCAPE) {
            if (mAdView != null) {
                mAdView.setVisibility(View.GONE);
            }
            if (isVideoPlayerOpen) {
                enableImmersiveMode();
            }
        } else if (newConfig.orientation == Configuration.ORIENTATION_PORTRAIT) {
            if (isVideoPlayerOpen) {
                // Keep immersive fullscreen active even in portrait mode!
                enableImmersiveMode();
                if (mAdView != null) mAdView.setVisibility(View.GONE);
            } else if (mAdView != null) {
                mAdView.setVisibility(View.VISIBLE);
            }
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && isVideoPlayerOpen) {
            enableImmersiveMode();
        }
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().freeMemory();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().freeMemory();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onPause() {
        super.onPause();
        if (mAdView != null) {
            mAdView.pause();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (mAdView != null) {
            mAdView.resume();
        }
    }

    @Override
    public void onDestroy() {
        if (mAdView != null) {
            mAdView.destroy();
            mAdView = null;
        }
        super.onDestroy();
    }

    private void loadInterstitialAd() {
        if (isAdLoading || mInterstitialAd != null) return;
        isAdLoading = true;

        AdRequest adRequest = new AdRequest.Builder().build();
        // Load with primary unit ID
        InterstitialAd.load(this, AD_UNIT_INTERSTITIAL_1, adRequest, new InterstitialAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull InterstitialAd interstitialAd) {
                mInterstitialAd = interstitialAd;
                isAdLoading = false;
                setupInterstitialCallbacks();
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                // Fallback to secondary Ad Unit ID in case unit 1 has limit or is pending
                InterstitialAd.load(MainActivity.this, AD_UNIT_ID_2, adRequest, new InterstitialAdLoadCallback() {
                    @Override
                    public void onAdLoaded(@NonNull InterstitialAd secondaryAd) {
                        mInterstitialAd = secondaryAd;
                        isAdLoading = false;
                        setupInterstitialCallbacks();
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError err) {
                        mInterstitialAd = null;
                        isAdLoading = false;
                    }
                });
            }
        });
    }

    private void loadRewardedAd() {
        if (mRewardedAd != null) return;
        AdRequest adRequest = new AdRequest.Builder().build();
        RewardedAd.load(this, AD_UNIT_ID_2, adRequest, new RewardedAdLoadCallback() {
            @Override
            public void onAdLoaded(@NonNull RewardedAd rewardedAd) {
                mRewardedAd = rewardedAd;
                mRewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                    @Override
                    public void onAdDismissedFullScreenContent() {
                        mRewardedAd = null;
                        loadRewardedAd();
                        notifyWebAdDismissed();
                    }

                    @Override
                    public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                        mRewardedAd = null;
                        loadRewardedAd();
                        notifyWebAdDismissed();
                    }
                });
            }

            @Override
            public void onAdFailedToLoad(@NonNull LoadAdError loadAdError) {
                mRewardedAd = null;
            }
        });
    }

    private void setupInterstitialCallbacks() {
        if (mInterstitialAd == null) return;
        mInterstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                mInterstitialAd = null;
                loadInterstitialAd(); // Preload next ad immediately
                notifyWebAdDismissed();
            }

            @Override
            public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                mInterstitialAd = null;
                loadInterstitialAd();
                notifyWebAdDismissed();
            }
        });
    }

    private void setupBannerAd() {
        runOnUiThread(() -> {
            try {
                mAdView = new AdView(this);
                mAdView.setAdUnitId(AD_UNIT_ID_2);
                mAdView.setAdSize(AdSize.BANNER);

                FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                );
                params.gravity = Gravity.BOTTOM;
                // Keep 65dp clearance from bottom so BottomNav is not covered
                float density = getResources().getDisplayMetrics().density;
                params.bottomMargin = (int) (65 * density);
                mAdView.setLayoutParams(params);

                mAdView.setAdListener(new com.google.android.gms.ads.AdListener() {
                    @Override
                    public void onAdLoaded() {
                        super.onAdLoaded();
                        if (getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT && !isVideoPlayerOpen) {
                            mAdView.setVisibility(View.VISIBLE);
                        } else {
                            mAdView.setVisibility(View.GONE);
                        }
                    }

                    @Override
                    public void onAdFailedToLoad(@NonNull LoadAdError error) {
                        super.onAdFailedToLoad(error);
                        new Handler(Looper.getMainLooper()).postDelayed(() -> {
                            if (mAdView != null && !isVideoPlayerOpen) {
                                mAdView.loadAd(new AdRequest.Builder().build());
                            }
                        }, 30000);
                    }
                });

                ViewGroup root = findViewById(android.R.id.content);
                if (root != null) {
                    root.addView(mAdView);
                }

                AdRequest adRequest = new AdRequest.Builder().build();
                mAdView.loadAd(adRequest);
                mBannerRefreshHandler.removeCallbacks(mBannerRefreshRunnable);
                mBannerRefreshHandler.postDelayed(mBannerRefreshRunnable, 30000);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    private void notifyWebAdDismissed() {
        new Handler(Looper.getMainLooper()).post(() -> {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('admob:dismissed'));", null);
            }
        });
    }

    public class AdMobBridge {
        @JavascriptInterface
        public void showInterstitialAd() {
            new Handler(Looper.getMainLooper()).post(() -> {
                if (mInterstitialAd != null) {
                    mInterstitialAd.show(MainActivity.this);
                } else if (mRewardedAd != null) {
                    mRewardedAd.show(MainActivity.this, rewardItem -> {});
                } else {
                    loadInterstitialAd();
                    loadRewardedAd();
                }
            });
        }

        @JavascriptInterface
        public void showRewardedAd() {
            new Handler(Looper.getMainLooper()).post(() -> {
                if (mRewardedAd != null) {
                    mRewardedAd.show(MainActivity.this, rewardItem -> {
                        if (getBridge() != null && getBridge().getWebView() != null) {
                            getBridge().getWebView().evaluateJavascript("window.dispatchEvent(new CustomEvent('admob:rewarded'));", null);
                        }
                    });
                    mRewardedAd = null;
                    loadRewardedAd();
                } else if (mInterstitialAd != null) {
                    mInterstitialAd.show(MainActivity.this);
                } else {
                    loadRewardedAd();
                    loadInterstitialAd();
                    notifyWebAdDismissed();
                }
            });
        }

        @JavascriptInterface
        public void setPlayerActive(boolean active) {
            new Handler(Looper.getMainLooper()).post(() -> {
                isVideoPlayerOpen = active;
                if (active) {
                    if (mAdView != null) {
                        mAdView.setVisibility(View.GONE);
                    }
                    enableImmersiveMode();
                    // Maximize device media volume to 100% full on cinema player launch
                    try {
                        android.media.AudioManager am = (android.media.AudioManager) getSystemService(android.content.Context.AUDIO_SERVICE);
                        if (am != null) {
                            int maxVol = am.getStreamMaxVolume(android.media.AudioManager.STREAM_MUSIC);
                            am.setStreamVolume(android.media.AudioManager.STREAM_MUSIC, maxVol, 0);
                        }
                    } catch (Exception ignored) {}
                } else {
                    disableImmersiveMode();
                    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                    if (mAdView != null && getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT) {
                        mAdView.setVisibility(View.VISIBLE);
                    }
                }
            });
        }

        @JavascriptInterface
        public void setModalOpen(boolean open) {
            new Handler(Looper.getMainLooper()).post(() -> {
                if (mAdView != null) {
                    if (open) {
                        mAdView.setVisibility(View.GONE);
                    } else if (!isVideoPlayerOpen && getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT) {
                        mAdView.setVisibility(View.VISIBLE);
                    }
                }
            });
        }

        @JavascriptInterface
        public void showBannerAd() {
            new Handler(Looper.getMainLooper()).post(() -> {
                if (mAdView != null && !isVideoPlayerOpen && getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT) {
                    mAdView.setVisibility(View.VISIBLE);
                }
            });
        }

        @JavascriptInterface
        public void hideBannerAd() {
            new Handler(Looper.getMainLooper()).post(() -> {
                if (mAdView != null) {
                    mAdView.setVisibility(View.GONE);
                }
            });
        }

        @JavascriptInterface
        public boolean isAdReady() {
            return mInterstitialAd != null || mRewardedAd != null;
        }

        @JavascriptInterface
        public void setLandscape() {
            new Handler(Looper.getMainLooper()).post(() -> {
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                enableImmersiveMode();
            });
        }

        @JavascriptInterface
        public void setPortrait() {
            new Handler(Looper.getMainLooper()).post(() -> {
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
                disableImmersiveMode();
            });
        }

        @JavascriptInterface
        public void setAutoOrientation() {
            new Handler(Looper.getMainLooper()).post(() -> {
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_FULL_SENSOR);
                disableImmersiveMode();
            });
        }

        @JavascriptInterface
        public void setDeviceVolume(float ratio) {
            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                    android.media.AudioManager am = (android.media.AudioManager) getSystemService(android.content.Context.AUDIO_SERVICE);
                    if (am != null) {
                        int maxVol = am.getStreamMaxVolume(android.media.AudioManager.STREAM_MUSIC);
                        int target = Math.round(maxVol * Math.max(0f, Math.min(1f, ratio)));
                        am.setStreamVolume(android.media.AudioManager.STREAM_MUSIC, target, 0);
                    }
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void setDeviceBrightness(float ratio) {
            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                    android.view.WindowManager.LayoutParams lp = getWindow().getAttributes();
                    lp.screenBrightness = Math.max(0.05f, Math.min(1.0f, ratio));
                    getWindow().setAttributes(lp);
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void openUpdateUrl(String url) {
            downloadAndInstallUpdate(url);
        }

        @JavascriptInterface
        public void downloadAndInstallUpdate(final String urlString) {
            new Thread(() -> {
                java.io.InputStream in = null;
                java.io.FileOutputStream out = null;
                java.net.HttpURLConnection conn = null;
                File targetFile = null;
                try {
                    postOtaProgress(5, 0, 100);
                    File cacheDir = getCacheDir();
                    targetFile = new File(cacheDir, "movix-update-" + System.currentTimeMillis() + ".apk");
                    if (targetFile.exists()) {
                        targetFile.delete();
                    }

                    // Clean up any stale update apks in cache
                    File[] oldFiles = cacheDir.listFiles((d, name) -> name.startsWith("movix-update") && name.endsWith(".apk"));
                    if (oldFiles != null) {
                        for (File f : oldFiles) {
                            try { f.delete(); } catch (Exception ignored) {}
                        }
                    }

                    String currentUrl = urlString;
                    // Support following redirects (HTTP 301, 302, 303, 307) commonly used by GitHub releases & CDNs
                    for (int redirectCount = 0; redirectCount < 8; redirectCount++) {
                        java.net.URL url = new java.net.URL(currentUrl);
                        conn = (java.net.HttpURLConnection) url.openConnection();
                        conn.setInstanceFollowRedirects(false);
                        conn.setConnectTimeout(15000);
                        conn.setReadTimeout(30000);
                        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android " + android.os.Build.VERSION.RELEASE + ")");
                        conn.connect();

                        int status = conn.getResponseCode();
                        if (status == java.net.HttpURLConnection.HTTP_MOVED_PERM
                                || status == java.net.HttpURLConnection.HTTP_MOVED_TEMP
                                || status == java.net.HttpURLConnection.HTTP_SEE_OTHER
                                || status == 307
                                || status == 308) {
                            String newUrl = conn.getHeaderField("Location");
                            if (newUrl != null && !newUrl.isEmpty()) {
                                conn.disconnect();
                                currentUrl = newUrl;
                                continue;
                            }
                        }
                        break;
                    }

                    int totalBytes = conn.getContentLength();
                    in = new java.io.BufferedInputStream(conn.getInputStream(), 16384);
                    out = new java.io.FileOutputStream(targetFile);

                    byte[] buffer = new byte[16384];
                    int bytesRead;
                    long downloadedBytes = 0;
                    long lastProgressUpdate = System.currentTimeMillis();

                    while ((bytesRead = in.read(buffer)) != -1) {
                        out.write(buffer, 0, bytesRead);
                        downloadedBytes += bytesRead;
                        long now = System.currentTimeMillis();
                        if (now - lastProgressUpdate > 150) {
                            lastProgressUpdate = now;
                            int percent = totalBytes > 0 ? (int) ((downloadedBytes * 100) / totalBytes) : 50;
                            postOtaProgress(Math.min(98, percent), downloadedBytes, totalBytes > 0 ? totalBytes : downloadedBytes);
                        }
                    }
                    out.flush();

                    // Verify APK integrity: size must be at least 10 MB and valid package
                    if (targetFile.exists() && targetFile.length() > 10000000) {
                        android.content.pm.PackageInfo info = getPackageManager().getPackageArchiveInfo(targetFile.getAbsolutePath(), 0);
                        if (info != null) {
                            postOtaProgress(100, targetFile.length(), targetFile.length());

                            // Launch native Package Installer via FileProvider
                            final File finalFile = targetFile;
                            new Handler(Looper.getMainLooper()).post(() -> {
                                try {
                                    Uri apkUri = androidx.core.content.FileProvider.getUriForFile(
                                        MainActivity.this,
                                        getPackageName() + ".fileprovider",
                                        finalFile
                                    );
                                    Intent install = new Intent(Intent.ACTION_VIEW);
                                    install.setDataAndType(apkUri, "application/vnd.android.package-archive");
                                    install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                                    install.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                    startActivity(install);
                                } catch (Exception ex) {
                                    ex.printStackTrace();
                                    fallbackBrowserDownload(urlString);
                                }
                            });
                            return;
                        }
                    }

                    // If file was corrupt or incomplete, fallback to browser
                    fallbackBrowserDownload(urlString);
                } catch (Exception e) {
                    e.printStackTrace();
                    fallbackBrowserDownload(urlString);
                } finally {
                    try { if (in != null) in.close(); } catch (Exception ignored) {}
                    try { if (out != null) out.close(); } catch (Exception ignored) {}
                    try { if (conn != null) conn.disconnect(); } catch (Exception ignored) {}
                }
            }).start();
        }

        private void fallbackBrowserDownload(final String urlString) {
            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                    Intent browser = new Intent(Intent.ACTION_VIEW, Uri.parse(urlString));
                    browser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(browser);
                } catch (Exception ignored) {}
                postOtaProgress(100, 100, 100);
            });
        }

        private void postOtaProgress(int percent, long currentBytes, long totalBytes) {
            new Handler(Looper.getMainLooper()).post(() -> {
                try {
                    if (bridge != null && bridge.getWebView() != null) {
                        String js = String.format(java.util.Locale.US,
                            "if (window.onOtaProgress) { window.onOtaProgress(%d, %d, %d); }",
                            percent, currentBytes, totalBytes);
                        bridge.getWebView().evaluateJavascript(js, null);
                    }
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public String getAppVersion() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) {
                return "2.2.3";
            }
        }

        @JavascriptInterface
        public int getAppVersionCode() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
            } catch (Exception e) {
                return 202300;
            }
        }
    }
}
