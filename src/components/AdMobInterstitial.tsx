import React, { useState, useEffect, useRef } from 'react';
import { Play, Volume2, VolumeX, ShieldCheck } from 'lucide-react';

interface AdMobInterstitialProps {
  onDismiss?: () => void;
  onAdDismissed?: () => void;
  onAdFailed?: () => void;
  movieTitle?: string;
}

// High-speed CDN advertisement commercials
const AD_VIDEOS = [
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4'
];

export const AdMobInterstitial: React.FC<AdMobInterstitialProps> = ({
  onDismiss,
  onAdDismissed,
  onAdFailed,
  movieTitle = 'Movie'
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dismissedRef = useRef(false);

  // Pick ad video based on time
  const adVideoUrl = AD_VIDEOS[Math.floor(Date.now() / 1000) % AD_VIDEOS.length];

  const triggerDismiss = (failed = false) => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    // Small delay so the user sees the skip action before movie starts
    setTimeout(() => {
      try {
        if (failed && typeof onAdFailed === 'function') {
          onAdFailed();
        } else {
          if (typeof onAdDismissed === 'function') onAdDismissed();
          if (typeof onDismiss === 'function') onDismiss();
        }
      } catch (err) {
        console.error('Error during ad dismissal:', err);
      }
    }, 80);
  };

  useEffect(() => {
    // Hide native banner while interstitial video ad is playing
    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob && typeof androidAdMob.hideBannerAd === 'function') {
      androidAdMob.hideBannerAd();
    }

    // 1. Try native Android AdMob Interstitial
    if (androidAdMob && typeof androidAdMob.showInterstitialAd === 'function') {
      const handleNativeAdDismissed = () => {
        triggerDismiss();
      };
      window.addEventListener('admob:dismissed', handleNativeAdDismissed, { once: true });
      androidAdMob.showInterstitialAd();
    }

    // 2. Guaranteed In-App Video Ad countdown (5 seconds mandatory)
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSkipClick = () => {
    if (!canSkip) return;
    if (videoRef.current) videoRef.current.pause();
    triggerDismiss();
  };

  const handleVideoEnded = () => {
    triggerDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-0 select-none animate-in fade-in duration-200">
      {/* Video Ad Canvas */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={adVideoUrl}
          autoPlay
          playsInline
          muted={isMuted}
          onEnded={handleVideoEnded}
          onError={() => {
            // In case of video error, keep countdown running then allow continue
            setCanSkip(true);
          }}
          className="w-full h-full object-cover sm:object-contain"
        />

        {/* Top Ad Branding Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 sm:p-5 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/50 to-transparent z-20">
          <div className="flex items-center space-x-2.5">
            <span className="px-2 py-0.5 rounded bg-yellow-500 text-black font-black text-[10px] uppercase tracking-wider">
              Ad
            </span>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xs tracking-wide">
                Google AdMob Sponsored
              </span>
              <span className="text-white/60 text-[10px]">
                Ad 1 of 1 • Movie starts after ad
              </span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 transition-all active:scale-95"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Bottom Bar: Skip Button & Movie Notice */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/70 to-transparent flex items-center justify-between z-20">
          <div className="flex items-center space-x-2 max-w-[60%]">
            <div className="w-2 h-2 rounded-full bg-[#E50914] animate-ping" />
            <p className="text-xs text-white/80 truncate">
              Up Next: <span className="font-bold text-white">{movieTitle}</span>
            </p>
          </div>

          {/* Skip Button */}
          {canSkip ? (
            <button
              onClick={handleSkipClick}
              className="px-5 py-2.5 rounded-xl bg-white text-black font-black text-xs hover:bg-white/90 active:scale-95 shadow-xl transition-all flex items-center space-x-1.5"
            >
              <span>Skip Ad</span>
              <span className="text-black/60 font-mono">✕</span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-black/80 border border-white/20 text-white/80 font-bold text-xs flex items-center space-x-1.5 backdrop-blur-md">
              <span>Skip in</span>
              <span className="text-yellow-400 font-mono font-black">{secondsLeft}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};