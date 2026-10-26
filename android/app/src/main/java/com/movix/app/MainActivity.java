package com.movix.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;

import com.getcapacitor.BridgeActivity;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure WebView for uninterrupted video streaming & audio playback
        if (getBridge() != null && getBridge().getWebView() != null) {
            android.webkit.WebView webView = getBridge().getWebView();
            android.webkit.WebSettings webSettings = webView.getSettings();
            webSettings.setMediaPlaybackRequiresUserGesture(false);
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setDatabaseEnabled(true);
            webSettings.setAllowFileAccess(true);
            webSettings.setAllowContentAccess(true);
            webSettings.setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // Expose JavaScript bridge for web layer
            webView.addJavascriptInterface(new AdMobBridge(), "AndroidAdMob");
        }

        // Initialize Google Mobile Ads SDK for monetization
        MobileAds.initialize(this, initializationStatus -> {
            loadInterstitialAd();
            loadRewardedAd();
            setupBannerAd();
        });
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
                mAdView.setLayoutParams(params);

                mAdView.setAdListener(new com.google.android.gms.ads.AdListener() {
                    @Override
                    public void onAdLoaded() {
                        super.onAdLoaded();
                        mAdView.setVisibility(View.VISIBLE);
                    }
                });

                ViewGroup root = findViewById(android.R.id.content);
                if (root != null) {
                    root.addView(mAdView);
                }

                AdRequest adRequest = new AdRequest.Builder().build();
                mAdView.loadAd(adRequest);
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
                    notifyWebAdDismissed();
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
        public void showBannerAd() {
            new Handler(Looper.getMainLooper()).post(() -> {
                if (mAdView != null) {
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
    }
}
