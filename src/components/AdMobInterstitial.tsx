import React, { useState, useEffect } from 'react';
import { Play, Sparkles, X } from 'lucide-react';

interface AdMobInterstitialProps {
  onDismiss: () => void;
  movieTitle: string;
}

export const AdMobInterstitial: React.FC<AdMobInterstitialProps> = ({ onDismiss, movieTitle }) => {
  const [secondsLeft, setSecondsLeft] = useState(3);
  const ADMOB_UNIT_ID = "ca-app-pub-5684555136963044/1233900974";

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#11141E] border border-white/10 p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        {/* Ad Tag */}
        <div className="absolute top-3 left-4 flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px] uppercase tracking-wider border border-amber-500/30">
            AdMob Interstitial
          </span>
        </div>

        {/* Skip Button */}
        <button
          onClick={onDismiss}
          disabled={secondsLeft > 0}
          className={`absolute top-3 right-4 px-3 py-1 rounded-full text-xs font-bold transition-all ${
            secondsLeft > 0
              ? 'bg-white/10 text-white/50 cursor-not-allowed'
              : 'bg-white text-black hover:bg-white/90 active:scale-95'
          }`}
        >
          {secondsLeft > 0 ? `Skip in ${secondsLeft}s` : 'Skip Ad ✕'}
        </button>

        {/* Ad Body */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E50914] to-amber-500 flex items-center justify-center mt-6 mb-4 shadow-xl shadow-red-950/40">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          Movix Premium Pass
        </h3>
        <p className="text-xs text-white/60 mb-4 px-2">
          Enjoy <span className="text-white font-semibold">{movieTitle}</span> and thousands more in uncompressed 4K HDR without interruption.
        </p>

        {/* Action Button */}
        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF4154] to-[#E50914] text-white font-bold text-sm shadow-lg shadow-red-600/30 active:scale-95 transition-transform flex items-center justify-center space-x-2 mb-3"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Continue to Stream</span>
        </button>

        <div className="text-[10px] text-white/30 font-mono">
          Ad Unit: {ADMOB_UNIT_ID}
        </div>
      </div>
    </div>
  );
};
