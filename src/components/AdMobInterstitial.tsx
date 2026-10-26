import React, { useState, useEffect } from 'react';
import { Play, Sparkles } from 'lucide-react';

interface AdMobInterstitialProps {
  onDismiss: () => void;
  movieTitle: string;
}

export const AdMobInterstitial: React.FC<AdMobInterstitialProps> = ({ onDismiss, movieTitle }) => {
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  return (
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
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

        {/* Animated Brand Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#E50914] via-purple-600 to-amber-500 flex items-center justify-center mt-7 mb-4 shadow-xl shadow-red-950/40 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-xl font-black text-white mb-1.5 font-display">
          Movix Cinema Experience
        </h3>
        <p className="text-xs text-white/70 mb-5 px-3 leading-relaxed">
          Loading <span className="text-white font-bold">"{movieTitle}"</span> stream in Ultra HD with high-speed direct servers.
        </p>

        {/* Action Button */}
        <button
          onClick={onDismiss}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF4154] to-[#E50914] text-white font-bold text-sm shadow-lg shadow-red-600/30 active:scale-95 transition-transform flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Continue to Stream</span>
        </button>
      </div>
    </div>
  );
};
