import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AdMobInterstitialProps {
  onDismiss?: () => void;
  onAdDismissed?: () => void;
  onAdFailed?: () => void;
  movieTitle?: string;
}

// Ultra-fast CDN advertisement commercials with local bundled fallback
const AD_VIDEOS = [
  '/assets/movix_ad.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4'
];

export const AdMobInterstitial: React.FC<AdMobInterstitialProps> = ({
  onDismiss,
  onAdDismissed,
  onAdFailed,
  movieTitle = 'Movie'
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [adProgress, setAdProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dismissedRef = useRef(false);

  // Pick ad video (local bundled first for instant 0ms start)
  const [videoIndex, setVideoIndex] = useState(0);
  const adVideoUrl = AD_VIDEOS[videoIndex];

  const triggerDismiss = (failed = false) => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    if (videoRef.current) {
      videoRef.current.pause();
    }

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
    }, 50);
  };

  useEffect(() => {
    // Hide native banner while video ad plays
    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob && typeof androidAdMob.hideBannerAd === 'function') {
      androidAdMob.hideBannerAd();
    }

    // Try native Android AdMob Interstitial if available
    if (androidAdMob && typeof androidAdMob.showInterstitialAd === 'function') {
      const handleNativeAdDismissed = () => {
        triggerDismiss();
      };
      window.addEventListener('admob:dismissed', handleNativeAdDismissed, { once: true });
      androidAdMob.showInterstitialAd();
    }

    // Attempt autoplay immediately
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Autoplay unmuted was blocked by policy, mute and play
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play().catch(() => {
                setIsPlaying(false);
              });
            }
          });
      }
    }

    // Maximum safety timer: allow skip after 6 seconds regardless of network
    const safetyTimer = setTimeout(() => {
      setCanSkip(true);
      setSecondsLeft(0);
    }, 6000);

    return () => {
      clearTimeout(safetyTimer);
    };
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 5;
    
    setAdProgress((curr / dur) * 100);

    const remaining = Math.max(0, 5 - Math.floor(curr));
    setSecondsLeft(remaining);

    if (curr >= 5 || remaining <= 0) {
      setCanSkip(true);
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleSound = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSkipClick = () => {
    if (!canSkip) return;
    triggerDismiss();
  };

  const handleVideoEnded = () => {
    triggerDismiss();
  };

  const handleVideoError = () => {
    if (videoIndex < AD_VIDEOS.length - 1) {
      setVideoIndex((prev) => prev + 1);
    } else {
      setCanSkip(true);
      setSecondsLeft(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-0 select-none animate-in fade-in duration-200">
      {/* Video Ad Canvas */}
      <div 
        onClick={handleTogglePlay}
        className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden cursor-pointer"
      >
        <video
          ref={videoRef}
          src={adVideoUrl}
          autoPlay
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-cover sm:object-contain pointer-events-none"
        />

        {/* Center Pause Indicator (if user paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none">
            <div className="p-4 rounded-full bg-white/20 backdrop-blur-md text-white animate-pulse">
              <Play className="w-10 h-10 fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Top Ad Branding Bar */}
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="absolute top-0 left-0 right-0 p-4 sm:p-5 flex items-center justify-between bg-gradient-to-b from-black/95 via-black/60 to-transparent z-20"
        >
          <div className="flex items-center space-x-2.5">
            <span className="px-2 py-0.5 rounded bg-yellow-500 text-black font-black text-[10px] uppercase tracking-wider">
              Ad
            </span>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xs tracking-wide">
                Google AdMob Sponsored
              </span>
              <span className="text-white/60 text-[10px]">
                Ad 1 of 1 • Movie starts automatically
              </span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="px-3 py-1.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 transition-all active:scale-95 flex items-center space-x-1.5 backdrop-blur-md"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-white/80" />
                <span className="text-[10px] font-bold text-white/80">Unmute</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-white" />
                <span className="text-[10px] font-bold text-white">Mute</span>
              </>
            )}
          </button>
        </div>

        {/* Bottom Bar: Skip Button & Movie Notice */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col space-y-3 z-20"
        >
          {/* Ad Progress Bar */}
          <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-yellow-400 h-full transition-all duration-150"
              style={{ width: `${adProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 max-w-[60%]">
              <div className="w-2 h-2 rounded-full bg-[#E50914] animate-ping flex-shrink-0" />
              <p className="text-xs text-white/80 truncate">
                Up Next: <span className="font-bold text-white">{movieTitle}</span>
              </p>
            </div>

            {/* Skip Button */}
            {canSkip ? (
              <button
                onClick={handleSkipClick}
                className="px-5 py-2.5 rounded-xl bg-white text-black font-black text-xs hover:bg-white/90 active:scale-95 shadow-xl transition-all flex items-center space-x-1.5 animate-in zoom-in-95 duration-150"
              >
                <span>Skip Ad</span>
                <span className="text-black/60 font-mono font-bold">✕</span>
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
    </div>
  );
};
