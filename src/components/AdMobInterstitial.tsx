import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

interface AdMobInterstitialProps {
  onDismiss?: () => void;
  onAdDismissed?: () => void;
  onAdFailed?: () => void;
  movieTitle?: string;
}

export const AdMobInterstitial: React.FC<AdMobInterstitialProps> = ({
  onDismiss,
  onAdDismissed,
  onAdFailed,
  movieTitle = 'Movie'
}) => {
  const [secondsLeft, setSecondsLeft] = useState(2);
  const dismissedRef = useRef(false);

  // Safe dismissal that calls any provided dismissal callback exactly once
  const triggerDismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    try {
      if (typeof onDismiss === 'function') onDismiss();
      if (typeof onAdDismissed === 'function') onAdDismissed();
      if (typeof onAdFailed === 'function') onAdFailed();
    } catch (err) {
      console.error('Error during ad dismissal:', err);
    }
  };

  useEffect(() => {
    // 1. Try Native Android AdMob SDK
    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob && typeof androidAdMob.showInterstitialAd === 'function') {
      const handleNativeAdDismissed = () => {
        triggerDismiss();
      };

      window.addEventListener('admob:dismissed', handleNativeAdDismissed, { once: true });
      androidAdMob.showInterstitialAd();
      
      // Fallback timeout: If native ad takes longer than 3.5s, dismiss automatically to prevent black screen
      const fallbackTimer = setTimeout(() => {
        window.removeEventListener('admob:dismissed', handleNativeAdDismissed);
        triggerDismiss();
      }, 3500);

      return () => {
        window.removeEventListener('admob:dismissed', handleNativeAdDismissed);
        clearTimeout(fallbackTimer);
      };
    }

    // 2. Web Fallback 2-Second Countdown
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#111420] border border-white/10 p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Ad Tag */}
        <div className="absolute top-4 left-5 flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] uppercase tracking-wider border border-amber-500/30">
            Sponsored Ad
          </span>
        </div>

        {/* Skip Button */}
        <button
          onClick={triggerDismiss}
          className="absolute top-3.5 right-4 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white text-black hover:bg-white/90 active:scale-95 shadow-md"
        >
          {secondsLeft > 0 ? `Skip (${secondsLeft}s)` : 'Skip Ad ✕'}
        </button>

        {/* Animated Brand Emblem with 3D Movix Logo */}
        <div className="relative w-20 h-20 flex items-center justify-center mt-7 mb-4">
          <div className="absolute -inset-2 bg-gradient-to-tr from-purple-600/40 via-pink-600/40 to-amber-500/40 blur-lg rounded-full animate-pulse" />
          <img 
            src="/assets/movix_3d_logo.png" 
            alt="Movix" 
            className="w-16 h-16 object-contain relative z-10 drop-shadow-[0_4px_16px_rgba(236,72,153,0.7)]"
          />
        </div>

        <h3 className="text-xl font-black text-white mb-1.5 font-display">
          Movix Cinema
        </h3>
        <p className="text-xs text-white/70 mb-5 px-3 leading-relaxed">
          Connecting high-speed streaming server for <span className="text-white font-bold">"{movieTitle}"</span>.
        </p>

        {/* Action Button */}
        <button
          onClick={triggerDismiss}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF4154] to-[#E50914] text-white font-bold text-sm shadow-lg shadow-red-600/30 active:scale-95 transition-transform flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{secondsLeft > 0 ? `Loading Stream (${secondsLeft}s)...` : 'Continue to Movie'}</span>
        </button>
      </div>
    </div>
  );
};
