import React, { useState } from 'react';
import { ExternalLink, Info, X } from 'lucide-react';

export const AdMobBanner: React.FC = () => {
  const [closed, setClosed] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // AdMob IDs provided by user
  const ADMOB_APP_ID = "ca-app-pub-5684555136963044~1297480157";
  const ADMOB_UNIT_ID = "ca-app-pub-5684555136963044/1233900974";

  if (closed) return null;

  return (
    <div className="w-full px-5 my-4">
      <div className="relative w-full rounded-xl bg-gradient-to-r from-[#141824] via-[#1b2234] to-[#141824] border border-[#2b354f]/50 p-3 sm:p-4 shadow-lg overflow-hidden">
        {/* AdMob label badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-extrabold text-[9px] uppercase tracking-wider border border-amber-500/30">
              Ad
            </span>
            <span className="text-white/40 text-[10px]">Google AdMob</span>
          </div>

          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="text-white/40 hover:text-white/80 p-1"
              title="AdMob Unit Info"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setClosed(true)}
              className="text-white/40 hover:text-white/80 p-1"
              title="Close Ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ad Content */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-base shadow-md flex-shrink-0">
            MOVIX+
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">
              Movix Ultra 4K HDR Pass
            </h4>
            <p className="text-[11px] text-white/60 line-clamp-1">
              Unlimited downloads, zero buffer & Dolby Atmos audio.
            </p>
          </div>
          <button className="flex-shrink-0 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#E50914] to-[#FF4154] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all">
            Get 4K
          </button>
        </div>

        {/* AdMob Verification Details */}
        {showInfo && (
          <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-white/50 font-mono space-y-0.5">
            <div><span className="text-amber-400">App ID:</span> {ADMOB_APP_ID}</div>
            <div><span className="text-emerald-400">Unit ID:</span> {ADMOB_UNIT_ID}</div>
          </div>
        )}
      </div>
    </div>
  );
};
