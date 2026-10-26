import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

export const AdMobBanner: React.FC = () => {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <div className="w-full px-5 my-4">
      <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#121624] via-[#1a2136] to-[#121624] border border-[#26314f]/60 p-3.5 sm:p-4 shadow-xl overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Ad Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-black text-[9px] uppercase tracking-wider border border-amber-500/30">
              AD
            </span>
            <span className="text-white/40 text-[10px] font-medium">Sponsored Stream</span>
          </div>

          <button 
            onClick={() => setClosed(true)}
            className="text-white/40 hover:text-white/80 p-1 rounded-full hover:bg-white/5 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ad Body */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#E50914] to-purple-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-red-950/40 flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate leading-tight">
              Movix Ultra 4K Cinema Pass
            </h4>
            <p className="text-[11px] text-white/60 line-clamp-1 mt-0.5">
              Enjoy all OTT premieres with zero latency & Dolby Atmos sound.
            </p>
          </div>

          <button className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#FF4154] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all">
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
};
