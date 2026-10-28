import React, { useState, useEffect } from 'react';
import { Sparkles, X, Play, Gift, ShieldCheck } from 'lucide-react';

interface AdMobBannerProps {
  onWatchAd?: () => void;
}

export const AdMobBanner: React.FC<AdMobBannerProps> = ({ onWatchAd }) => {
  const [closed, setClosed] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    // Tell Android to display native banner
    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob && typeof androidAdMob.showBannerAd === 'function') {
      androidAdMob.showBannerAd();
    }

    // Initialize Web AdSense container
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {}

    const handleRewarded = () => {
      setRewardClaimed(true);
    };
    window.addEventListener('admob:rewarded', handleRewarded);
    return () => window.removeEventListener('admob:rewarded', handleRewarded);
  }, []);

  if (closed) return null;

  const handleTriggerAd = () => {
    if (onWatchAd) {
      onWatchAd();
      return;
    }

    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob) {
      if (typeof androidAdMob.showRewardedAd === 'function') {
        androidAdMob.showRewardedAd();
      } else if (typeof androidAdMob.showInterstitialAd === 'function') {
        androidAdMob.showInterstitialAd();
      }
    } else {
      setRewardClaimed(true);
      alert('🎉 24-Hour VIP 4K Pass Activated! Thank you for supporting Movix!');
    }
  };

  return (
    <div className="w-full px-5 my-4 animate-in fade-in duration-300">
      <div className="relative w-full rounded-2xl bg-[#141824] border border-white/10 p-4 shadow-xl overflow-hidden group">
        {/* Subtle accent glow */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#E50914]/8 rounded-full blur-2xl pointer-events-none" />

        {/* Ad Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 font-extrabold text-[9px] uppercase tracking-wider border border-white/10">
              SPONSORED
            </span>
            <span className="text-white/50 text-[10px] font-mono">Google AdMob</span>
          </div>

          <button 
            onClick={() => setClosed(true)}
            className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ad Content */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#E50914] flex items-center justify-center text-white shadow-lg shadow-red-950/40 flex-shrink-0 animate-pulse">
            <Gift className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-white truncate leading-tight">
              {rewardClaimed ? '🎉 VIP 4K Pass Active!' : 'Watch 1 Ad • Unlock VIP 4K'}
            </h4>
            <p className="text-[11px] text-white/60 line-clamp-1 mt-0.5">
              {rewardClaimed 
                ? 'Unlimited ad-free high-speed streaming enabled for 24h.' 
                : 'Support Movix & get instant 4K HDR playback.'}
            </p>
          </div>

          <button
            onClick={handleTriggerAd}
            className={`flex-shrink-0 px-3.5 py-2.5 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1.5 ${
              rewardClaimed
                ? 'bg-emerald-600 text-white'
                : 'bg-[#E50914] hover:brightness-110 text-white'
            }`}
          >
            {rewardClaimed ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                <span>Active</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Watch Ad</span>
              </>
            )}
          </button>
        </div>

        {/* Web Google AdSense Display Slot */}
        <div className="mt-3 overflow-hidden rounded-xl bg-black/40 border border-white/5 flex items-center justify-center min-h-[50px]">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', textAlign: 'center' }}
            data-ad-layout="in-article"
            data-ad-format="fluid"
            data-ad-client="ca-pub-5684555136963044"
            data-ad-slot="2645561704"
          />
        </div>
      </div>
    </div>
  );
};
