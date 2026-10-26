import React, { useState, useEffect } from 'react';
import { Play, Sparkles } from 'lucide-react';

interface AdMobInterstitialProps {
  onDismiss: () => void;
  movieTitle: string;
}

export const AdMobInterstitial: React.FC<AdMobInterstitialProps> = ({ onDismiss, movieTitle }) => {
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    // 1. Try Native Android AdMob SDK
    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob && typeof androidAdMob.showInterstitialAd === 'function') {
      const handleAdDismissed = () => {
        onDismiss();
      };
      window.addEventListener('admob:dismissed', handleAdDismissed, { once: true });
      androidAdMob.showInterstitialAd();
      
      // Fallback timeout in case ad takes too long or fails silently
      const fallbackTimer = setTimeout(() => {
        window.removeEventListener('admob:dismissed', handleAdDismissed);
        onDismiss();
      }, 6000);

      return () => {
        window.removeEventListener('admob:dismissed', handleAdDismissed);
        clearTimeout(fallbackTimer);
      };
    }

    // 2. Web Fallback 3-Second Pre-roll Countdown
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
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
          onClick={onDismiss}
          disabled={secondsLeft > 0}
          className={`absolute top-3.5 right-4 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            secondsLeft > 0
              ? 'bg-white/10 text-white/50 cursor-not-allowed'
              : 'bg-white text-black hover:bg-white/90 active:scale-95 shadow-md'
          }`}
        >
          {secondsLeft > 0 ? `Skip in ${secondsLeft}s` : 'Skip Ad ✕'}
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
          Connecting high-speed 4K streaming server for <span className="text-white font-bold">"{movieTitle}"</span>.
        </p>

        {/* Action Button */}
        <button
          onClick={onDismiss}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF4154] to-[#E50914] text-white font-bold text-sm shadow-lg shadow-red-600/30 active:scale-95 transition-transform flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{secondsLeft > 0 ? `Loading Stream (${secondsLeft}s)...` : 'Continue to Movie'}</span>
        </button>
      </div>
    </div>
  );
};
