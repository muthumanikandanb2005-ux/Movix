import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, 
  Server, Lock, Unlock, Sun, Gauge, Scan, Check, Languages, Globe, AlertCircle, Smartphone 
} from 'lucide-react';
import { Movie, StreamSource, VideoQuality, AudioLanguage } from '../types';
import { getStreamingSources } from '../services/tmdb';
import { saveResumeProgress } from '../services/continueWatching';

interface VideoPlayerModalProps {
  movie: Movie;
  initialQuality?: VideoQuality;
  initialLanguage?: AudioLanguage;
  onClose: () => void;
}

type AspectMode = 'contain' | 'cover' | 'fill';

const AVAILABLE_LANGUAGES: { id: AudioLanguage; label: string; icon: string }[] = [
  { id: 'Hindi', label: 'Hindi (हिंदी 5.1)', icon: '🇮🇳' },
  { id: 'Tamil', label: 'Tamil (தமிழ் Dub)', icon: '🇮🇳' },
  { id: 'Telugu', label: 'Telugu (తెలుగు Dub)', icon: '🇮🇳' },
  { id: 'Malayalam', label: 'Malayalam (മലയാളം)', icon: '🇮🇳' },
  { id: 'Kannada', label: 'Kannada (ಕನ್ನಡ)', icon: '🇮🇳' },
  { id: 'English', label: 'English (Original 5.1)', icon: '🇬🇧' },
  { id: 'Spanish', label: 'Spanish (Español)', icon: '🇪🇸' }
];

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ 
  movie, 
  initialQuality = '1080p',
  initialLanguage = 'Hindi',
  onClose 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Resolution & Language state
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>(initialQuality);
  const [currentLanguage, setCurrentLanguage] = useState<AudioLanguage>(initialLanguage);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [aspectMode, setAspectMode] = useState<AspectMode>('contain');
  const [isLocked, setIsLocked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Landscape & Orientation state
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false
  );

  // Drawers
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Gesture OSD overlays (Signature XPlayer Feature)
  const [gestureOsd, setGestureOsd] = useState<{
    type: 'volume' | 'brightness' | 'seek' | 'info';
    value: string | number;
    icon: string;
    percent?: number;
  } | null>(null);

  // Double tap ripple
  const [ripple, setRipple] = useState<{ side: 'left' | 'right'; id: number } | null>(null);
  const [brightness, setBrightness] = useState(100);

  // Touch tracking for XPlayer vertical swipe gestures
  const touchStartRef = useRef<{ x: number; y: number; time: number; mode: 'none' | 'brightness' | 'volume' | 'seek' }>({
    x: 0,
    y: 0,
    time: 0,
    mode: 'none'
  });
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // Generate dynamic quality streaming sources
  const mid = movie.tmdbId || 801688;
  const sources: StreamSource[] = getStreamingSources(mid, undefined, currentQuality, currentLanguage);

  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const currentSource = sources[activeSourceIndex] || sources[0];

  // Auto-hide controls after 4 seconds to provide clean unobstructed cinema view
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!isLocked) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowServerMenu(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
        setShowLanguageMenu(false);
      }, 4000);
    }
  }, [isLocked]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  // Manage orientation changes and ensure banner is hidden during cinema player
  useEffect(() => {
    const checkOrientation = () => {
      const isLand = window.innerWidth > window.innerHeight || (window.screen?.orientation?.type?.includes('landscape') ?? false);
      setIsLandscape(isLand);
    };
    checkOrientation();

    const handleOrientation = () => {
      checkOrientation();
      setTimeout(checkOrientation, 150);
      setTimeout(checkOrientation, 350);
    };

    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);

    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob && typeof androidAdMob.setPlayerActive === 'function') {
      androidAdMob.setPlayerActive(true);
    } else if (androidAdMob && typeof androidAdMob.hideBannerAd === 'function') {
      androidAdMob.hideBannerAd();
    }

    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
      if (androidAdMob && typeof androidAdMob.setPlayerActive === 'function') {
        androidAdMob.setPlayerActive(false);
      } else if (androidAdMob && typeof androidAdMob.showBannerAd === 'function') {
        androidAdMob.showBannerAd();
      }
      if (androidAdMob && typeof androidAdMob.setAutoOrientation === 'function') {
        androidAdMob.setAutoOrientation();
      }
    };
  }, []);

  // Listen for PvrPlay player postMessage events (pvr:close, pvr:resume)
  useEffect(() => {
    const handlePlayerMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data) return;

      if (data.type === 'pvr:close') {
        onClose();
        return;
      }

      if (data.type === 'pvr:resume' && data.value) {
        const { t, d } = data.value;
        if (Number(t) >= 0 && Number(d) > 0 && movie.tmdbId) {
          saveResumeProgress(movie.tmdbId, Number(t), Number(d), movie);
        }
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    
    return () => {
      window.removeEventListener('message', handlePlayerMessage);
    };
  }, [movie, onClose]);

  const lastSavedTimeRef = useRef<number>(0);
  const savedPlaybackTimeRef = useRef<number>(0);

  // Attempt initial playback immediately on mount and source switch
  useEffect(() => {
    setIsBuffering(true);
    setHasError(false);

    let startSecond = savedPlaybackTimeRef.current;
    if (startSecond <= 0 && movie.tmdbId) {
      try {
        const raw = localStorage.getItem(`player:resume:${movie.tmdbId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.t > 10 && parsed.t < (parsed.d || 99999) - 15) {
            startSecond = parsed.t;
          }
        }
      } catch {}
    }

    // Fast watchdog: Clear buffering quickly (200ms) so user gets instant playback
    const watchdog = setTimeout(() => {
      setIsBuffering(false);
      setHasStartedPlaying(true);
    }, 200);

    const tryAutoPlay = async () => {
      if (videoRef.current && currentSource.type === 'video') {
        try {
          if (startSecond > 0) {
            videoRef.current.currentTime = startSecond;
            setGestureOsd({ type: 'seek', value: `Resumed from ${formatTime(startSecond)}`, icon: '⏱️' });
            setTimeout(() => setGestureOsd(null), 1800);
          }
          await videoRef.current.play();
          setIsPlaying(true);
          setHasStartedPlaying(true);
          setIsBuffering(false);
        } catch {
          // If browser requires tap to play with sound
          setIsPlaying(false);
          setIsBuffering(false);
          setHasStartedPlaying(true);
          setShowControls(true);
        }
      }
    };

    tryAutoPlay();

    return () => clearTimeout(watchdog);
  }, [activeSourceIndex, currentQuality, currentLanguage, movie.tmdbId]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const togglePlay = () => {
    if (isLocked) return;
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStartedPlaying(true);
        setIsBuffering(false);
        resetControlsTimeout();
      }).catch(() => {
        setIsPlaying(false);
        setShowControls(true);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setProgress((curr / dur) * 100);
    setCurrentTime(formatTime(curr));
    if (curr > 0.05 && !hasStartedPlaying) {
      setHasStartedPlaying(true);
      setIsBuffering(false);
    }

    if (movie.tmdbId && Math.abs(curr - lastSavedTimeRef.current) > 5) {
      lastSavedTimeRef.current = curr;
      saveResumeProgress(movie.tmdbId, curr, dur, movie);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || 1;
    setDuration(formatTime(dur));
    
    // Restore playback position on quality swap
    if (savedPlaybackTimeRef.current > 0 && savedPlaybackTimeRef.current < dur) {
      videoRef.current.currentTime = savedPlaybackTimeRef.current;
      savedPlaybackTimeRef.current = 0;
    }

    setIsBuffering(false);
    setHasStartedPlaying(true);

    videoRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked || !videoRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * (videoRef.current.duration || 1);
    videoRef.current.currentTime = seekTime;
    setProgress(parseFloat(e.target.value));
    resetControlsTimeout();
  };

  const skipSeconds = (sec: number) => {
    if (isLocked || !videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + sec);
    resetControlsTimeout();
  };

  // Change streaming quality on the fly (Preserves exact second)
  const handleQualityChange = (q: VideoQuality) => {
    if (videoRef.current) {
      savedPlaybackTimeRef.current = videoRef.current.currentTime;
    }
    setCurrentQuality(q);
    setShowQualityMenu(false);
    setIsBuffering(true);
    setGestureOsd({ type: 'info', value: `Quality: ${q}`, icon: '⚡' });
    setTimeout(() => {
      setGestureOsd(null);
    }, 1200);
    resetControlsTimeout();
  };

  // Change audio language on the fly
  const handleLanguageChange = (lang: AudioLanguage) => {
    setCurrentLanguage(lang);
    setShowLanguageMenu(false);
    setGestureOsd({ type: 'info', value: `Audio: ${lang} (Dolby 5.1)`, icon: '🌐' });
    setTimeout(() => {
      setGestureOsd(null);
    }, 1500);
    resetControlsTimeout();
  };

  // Next server mirror
  const handleNextServer = () => {
    const nextIdx = (activeSourceIndex + 1) % sources.length;
    setActiveSourceIndex(nextIdx);
    setHasError(false);
    setGestureOsd({ type: 'info', value: `Switched to ${sources[nextIdx].name.split(' ')[1]}`, icon: '🔄' });
    setTimeout(() => setGestureOsd(null), 1500);
  };

  // 1-Tap Landscape / Portrait Screen Rotation (Signature XPlayer Feature)
  const toggleOrientation = () => {
    const androidAdMob = (window as any).AndroidAdMob;
    if (isLandscape) {
      if (androidAdMob && typeof androidAdMob.setPortrait === 'function') {
        androidAdMob.setPortrait();
      } else if (screen.orientation && typeof screen.orientation.unlock === 'function') {
        try { screen.orientation.unlock(); } catch {}
      }
      if (document.fullscreenElement) {
        try { document.exitFullscreen(); } catch {}
      }
      setIsLandscape(false);
      setGestureOsd({ type: 'info', value: 'Portrait View', icon: '📱' });
    } else {
      if (androidAdMob && typeof androidAdMob.setLandscape === 'function') {
        androidAdMob.setLandscape();
      } else if (screen.orientation && typeof (screen.orientation as any).lock === 'function') {
        try { (screen.orientation as any).lock('landscape'); } catch {}
      }
      if (containerRef.current && !document.fullscreenElement) {
        try { containerRef.current.requestFullscreen(); } catch {}
      }
      setIsLandscape(true);
      setGestureOsd({ type: 'info', value: 'Cinema Landscape (16:9)', icon: '🔄' });
    }
    setTimeout(() => setGestureOsd(null), 1500);
    resetControlsTimeout();
  };

  // XPlayer Touch Gestures (Brightness on Left, Volume on Right, Double-tap to Seek)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      mode: 'none'
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touchStartRef.current.y - touch.clientY; // swipe up is positive
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const isLeftHalf = touchStartRef.current.x < containerWidth / 2;

    if (touchStartRef.current.mode === 'none') {
      if (Math.abs(dy) > 15 && Math.abs(dy) > Math.abs(dx)) {
        touchStartRef.current.mode = isLeftHalf ? 'brightness' : 'volume';
      }
    }

    if (touchStartRef.current.mode === 'brightness') {
      const delta = (dy / 250) * 40;
      const newBright = Math.min(150, Math.max(30, Math.round(brightness + delta)));
      setBrightness(newBright);
      setGestureOsd({
        type: 'brightness',
        value: `${Math.round((newBright / 150) * 100)}%`,
        icon: '☀️',
        percent: Math.round((newBright / 150) * 100)
      });
    } else if (touchStartRef.current.mode === 'volume') {
      const delta = dy / 250;
      const newVol = Math.min(1, Math.max(0, volume + delta));
      setVolume(newVol);
      if (videoRef.current) {
        videoRef.current.volume = newVol;
        videoRef.current.muted = newVol === 0;
      }
      setIsMuted(newVol === 0);
      setGestureOsd({
        type: 'volume',
        value: `${Math.round(newVol * 100)}%`,
        icon: newVol === 0 ? '🔇' : '🔊',
        percent: Math.round(newVol * 100)
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const now = Date.now();
    const duration = now - touchStartRef.current.time;
    const touch = e.changedTouches[0];
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;

    if (touchStartRef.current.mode === 'none' && duration < 300) {
      const timeDiff = now - lastTapRef.current.time;
      if (timeDiff < 300) {
        if (touch.clientX < containerWidth / 2) {
          skipSeconds(-10);
          setRipple({ side: 'left', id: now });
          setGestureOsd({ type: 'seek', value: '-10s', icon: '⏪' });
        } else {
          skipSeconds(10);
          setRipple({ side: 'right', id: now });
          setGestureOsd({ type: 'seek', value: '+10s', icon: '⏩' });
        }
        setTimeout(() => {
          setRipple(null);
          setGestureOsd(null);
        }, 700);
      } else {
        setShowControls((prev) => !prev);
        resetControlsTimeout();
      }
      lastTapRef.current = { time: now, x: touch.clientX };
    }

    if (touchStartRef.current.mode !== 'none') {
      setTimeout(() => setGestureOsd(null), 1000);
    }
    touchStartRef.current.mode = 'none';
  };

  // Aspect ratio toggler (Contain 16:9, Cover Crop, Fill Stretch)
  const cycleAspectRatio = () => {
    if (aspectMode === 'contain') {
      setAspectMode('cover');
      setGestureOsd({ type: 'seek', value: 'Crop / Zoom (100% Fill)', icon: '🔍' });
    } else if (aspectMode === 'cover') {
      setAspectMode('fill');
      setGestureOsd({ type: 'seek', value: 'Stretch', icon: '↔️' });
    } else {
      setAspectMode('contain');
      setGestureOsd({ type: 'seek', value: 'Fit Screen (16:9)', icon: '📱' });
    }
    setTimeout(() => setGestureOsd(null), 1200);
    resetControlsTimeout();
  };

  // Speed changer
  const changeSpeed = (speed: number) => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    resetControlsTimeout();
  };

  const toggleFullScreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch(() => {});
    }
  };

  const getObjectFitClass = () => {
    switch (aspectMode) {
      case 'cover': return 'object-cover';
      case 'fill': return 'object-fill';
      default: return 'object-contain';
    }
  };

  const playerContent = (
    <div 
      ref={containerRef}
      id="movix-xplayer-container" 
      className="fixed inset-0 z-50 bg-black select-none overflow-hidden w-full h-full min-h-[100dvh] max-h-[100dvh]"
      style={{ filter: `brightness(${brightness}%)` }}
      onTouchStart={currentSource.type === 'video' ? handleTouchStart : undefined}
      onTouchMove={currentSource.type === 'video' ? handleTouchMove : undefined}
      onTouchEnd={currentSource.type === 'video' ? handleTouchEnd : undefined}
    >
      {/* Permanent Mini Floating Action Bar (visible when main header is collapsed) */}
      {!showControls && !isLocked && (
        <div className={`absolute ${isLandscape ? 'top-3 right-5' : 'top-4 right-4'} z-50 flex items-center space-x-1.5 animate-in fade-in duration-200`}>
          {/* Quality Pill */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowControls(true);
              setShowQualityMenu(true);
            }}
            className="px-2.5 py-1.5 rounded-full bg-black/85 hover:bg-black text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-2xl flex items-center space-x-1 active:scale-95 transition-all"
            title="Select Quality"
          >
            <span>{currentQuality}</span>
          </button>

          {/* Language Pill */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowControls(true);
              setShowLanguageMenu(true);
            }}
            className="px-2.5 py-1.5 rounded-full bg-black/85 hover:bg-black text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-2xl flex items-center space-x-1 active:scale-95 transition-all"
            title="Audio Language"
          >
            <Globe className="w-3.5 h-3.5 text-white/80" />
            <span className="max-w-[65px] truncate">{currentLanguage}</span>
          </button>

          {/* 1-Tap Screen Rotate */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleOrientation();
            }}
            className="p-2 rounded-full bg-black/85 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-2xl active:scale-90 transition-all"
            title="Rotate Screen"
          >
            <RotateCw className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Server Pill */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowControls(true);
              setShowServerMenu(true);
            }}
            className="px-2.5 py-1.5 rounded-full bg-black/85 hover:bg-black text-white/90 hover:text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-2xl flex items-center space-x-1 active:scale-95 transition-all"
            title="Switch Streaming Server"
          >
            <Server className="w-3.5 h-3.5 text-[#E50914]" />
            <span className="hidden sm:inline">{sources[activeSourceIndex]?.name.split(' ')[1] || 'Server'}</span>
          </button>

          {/* Exit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-full bg-black/85 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-2xl active:scale-90 transition-all"
            title="Exit Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP CONTROL BAR (ABSOLUTE OVERLAY - NEVER DISTORTS VIDEO SIZING) */}
      <div className={`absolute top-0 left-0 right-0 z-40 ${isLandscape ? 'px-6 pt-3 pb-8' : 'px-5 pt-4 pb-10'} bg-gradient-to-b from-black/95 via-black/80 to-transparent flex items-center justify-between transition-opacity duration-300 pointer-events-auto ${
        showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center space-x-3 min-w-0">
          <img 
            src="/assets/movix_3d_logo.png" 
            alt="Movix" 
            className="w-8 h-8 object-contain flex-shrink-0" 
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[#E50914] text-[10px] font-black uppercase tracking-wider">
                MOVIX CINEMA
              </span>
              <span className="px-1.5 py-0.2 rounded bg-white/10 text-white text-[9px] font-bold uppercase">
                {currentQuality}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-white/10 text-white/90 text-[9px] font-medium">
                {currentLanguage}
              </span>
            </div>
            <h2 className="text-white font-bold text-sm sm:text-base leading-tight truncate">
              {movie.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quality Switcher Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowQualityMenu(!showQualityMenu);
              setShowServerMenu(false);
              setShowSpeedMenu(false);
              setShowLanguageMenu(false);
            }}
            className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1 border border-white/10 active:scale-95"
            title="Select Quality"
          >
            <span>{currentQuality}</span>
          </button>

          {/* Language / Audio Switcher Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLanguageMenu(!showLanguageMenu);
              setShowQualityMenu(false);
              setShowServerMenu(false);
              setShowSpeedMenu(false);
            }}
            className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1 border border-white/10 active:scale-95"
            title="Audio Language"
          >
            <Globe className="w-3.5 h-3.5 text-white/80" />
            <span className="hidden sm:inline">{currentLanguage}</span>
          </button>

          {/* 1-Tap Screen Rotate (XPlayer Signature) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleOrientation();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 active:scale-95"
            title={isLandscape ? "Switch to Portrait" : "Rotate to Landscape"}
          >
            <RotateCw className="w-4 h-4 text-white" />
          </button>

          {/* Playback Speed Switcher Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSpeedMenu(!showSpeedMenu);
              setShowQualityMenu(false);
              setShowServerMenu(false);
              setShowLanguageMenu(false);
            }}
            className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1 border border-white/10 active:scale-95"
            title="Playback Speed"
          >
            <Gauge className="w-3.5 h-3.5 text-white/80" />
            <span>{playbackSpeed}x</span>
          </button>

          {/* Server Switcher Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowServerMenu(!showServerMenu);
              setShowQualityMenu(false);
              setShowSpeedMenu(false);
              setShowLanguageMenu(false);
            }}
            className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center space-x-1 border border-white/10 active:scale-95"
          >
            <Server className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden sm:inline">Server</span>
          </button>

          {/* Close Player */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. QUALITY SELECTION DRAWER */}
      {showQualityMenu && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 right-5 z-50 w-60 bg-[#121622]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="text-xs font-bold text-white/70 mb-2 px-1 flex items-center justify-between">
            <span>Select Resolution:</span>
            <span className="text-[10px] text-white/60">Fast Buffer</span>
          </div>
          <div className="space-y-1.5">
            {(['4K', '1080p', '720p', '480p'] as VideoQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => handleQualityChange(q)}
                className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  currentQuality === q
                    ? 'bg-gradient-to-r from-[#E50914] to-[#FF4154] text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white/80'
                }`}
              >
                <span>{q === '4K' ? '4K Ultra HD (2160p)' : q === '1080p' ? '1080p Full HD' : q === '720p' ? '720p HD' : '480p Data Saver'}</span>
                {currentQuality === q && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. MULTI-LANGUAGE AUDIO DRAWER */}
      {showLanguageMenu && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 right-16 z-50 w-64 bg-[#121622]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="text-xs font-bold text-white/70 mb-2 px-1 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Globe className="w-3.5 h-3.5 text-white/70" />
              <span>Audio Language:</span>
            </span>
            <span className="text-[10px] text-white/60 font-mono">Dolby Audio</span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-none no-scrollbar">
            {[...AVAILABLE_LANGUAGES]
              .sort((a, b) => {
                const aOk = movie.availableLanguages?.includes(a.id) ? 1 : 0;
                const bOk = movie.availableLanguages?.includes(b.id) ? 1 : 0;
                return bOk - aOk;
              })
              .map((lang) => {
                const isSelected = currentLanguage === lang.id;
                const isSupported = movie.availableLanguages?.includes(lang.id);
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#E50914] text-white shadow-md'
                        : isSupported
                        ? 'bg-white/10 text-white hover:bg-white/15 border border-white/20'
                        : 'bg-white/5 hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{lang.icon}</span>
                      <span>{lang.label}</span>
                      {isSupported && !isSelected && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 text-white/80 font-extrabold uppercase">
                          Ready
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* 4. SERVER SWITCHER DRAWER */}
      {showServerMenu && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 right-5 z-50 w-72 bg-[#121622]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="text-xs font-bold text-white/70 mb-2 px-1 flex items-center justify-between">
            <span>Select Stream Mirror</span>
            <span className="text-[10px] text-white/60">All Online</span>
          </div>
          <div className="space-y-1.5">
            {sources.map((src, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveSourceIndex(idx);
                  setShowServerMenu(false);
                }}
                className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  activeSourceIndex === idx
                    ? 'bg-gradient-to-r from-[#E50914] to-[#FF4154] text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white/80'
                }`}
              >
                <span>{src.name}</span>
                {activeSourceIndex === idx && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. SPEED MENU DRAWER */}
      {showSpeedMenu && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-16 right-20 z-50 w-44 bg-[#121622]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="text-xs font-bold text-white/70 mb-2 px-1">Playback Speed</div>
          <div className="space-y-1">
            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  playbackSpeed === s ? 'bg-[#E50914] text-white' : 'hover:bg-white/10 text-white/70'
                }`}
              >
                <span>{s === 1.0 ? '1.0x (Normal)' : `${s}x`}</span>
                {playbackSpeed === s && <Check className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. SCREEN LOCK BUTTON (XPlayer Signature) */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 z-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLocked(!isLocked);
            setShowControls(true);
            resetControlsTimeout();
          }}
          className={`p-3 rounded-full transition-all shadow-xl active:scale-90 ${
            isLocked
              ? 'bg-red-600 text-white ring-4 ring-red-500/40'
              : showControls
              ? 'bg-black/60 text-white/70 border border-white/20 hover:text-white'
              : 'opacity-0 pointer-events-none'
          }`}
          title={isLocked ? 'Unlock Screen' : 'Lock Screen'}
        >
          {isLocked ? <Lock className="w-5 h-5 text-white" /> : <Unlock className="w-5 h-5" />}
        </button>
      </div>

      {/* 7. XPLAYER GESTURE OSD DISPLAY OVERLAY (Brightness / Volume / Seek Level) */}
      {gestureOsd && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-5 py-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 text-white flex flex-col items-center shadow-2xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none min-w-[130px]">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="text-2xl">{gestureOsd.icon}</span>
            <span className="text-sm font-bold tracking-wide">{gestureOsd.value}</span>
          </div>
          {typeof gestureOsd.percent === 'number' && (
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-[#E50914] h-full transition-all duration-75"
                style={{ width: `${gestureOsd.percent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* 8. DOUBLE-TAP SEEK RIPPLE ANIMATION */}
      {ripple && (
        <div className={`absolute top-0 bottom-0 ${
          ripple.side === 'left' ? 'left-0 w-1/3' : 'right-0 w-1/3'
        } flex items-center justify-center pointer-events-none z-30`}>
          <div className="flex flex-col items-center justify-center p-6 rounded-full bg-white/10 backdrop-blur-md text-white animate-ping">
            <span className="text-xl font-bold">{ripple.side === 'left' ? '⏪ 10s' : '⏩ 10s'}</span>
          </div>
        </div>
      )}

      {/* 9. VIDEO CANVAS (FULLSCREEN EDGE-TO-EDGE) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
        {/* Backdrop poster preview (only for direct video before playback begins) */}
        {!hasStartedPlaying && currentSource.type === 'video' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img 
              src={movie.backdrop || movie.poster} 
              alt="" 
              className="w-full h-full object-cover opacity-30 blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/70" />
          </div>
        )}

        {currentSource.type === 'embed' || currentSource.type === 'trailer' ? (
          <>
            <iframe
              key={`${currentSource.url}-${activeSourceIndex}`}
              src={currentSource.url}
              title={movie.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
              onLoad={() => {
                setIsBuffering(false);
                setHasStartedPlaying(true);
              }}
              style={{ transform: 'translateZ(0)', willChange: 'transform' }}
              className="w-full h-full border-0 absolute inset-0 z-10"
            />
            {showControls && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowServerMenu(true);
                  }}
                  className="px-4 py-2 rounded-full bg-black/85 hover:bg-black text-white text-xs font-bold border border-white/20 backdrop-blur-md shadow-2xl flex items-center space-x-2 active:scale-95 transition-all"
                >
                  <Server className="w-3.5 h-3.5 text-[#E50914]" />
                  <span>{currentSource.name}</span>
                  <span className="text-[#E50914] text-[11px] font-bold">Switch Server ▾</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <video
            ref={videoRef}
            src={currentSource.url}
            autoPlay
            playsInline
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => {
              setIsBuffering(false);
              setIsPlaying(true);
              setHasStartedPlaying(true);
            }}
            onCanPlay={() => setIsBuffering(false)}
            onError={() => {
              setHasError(true);
              setIsBuffering(false);
            }}
            onClick={togglePlay}
            className={`w-full h-full cursor-pointer ${getObjectFitClass()}`}
          />
        )}

        {/* Clean Netflix-Style Buffering Indicator (only for direct video) */}
        {isBuffering && !hasStartedPlaying && currentSource.type === 'video' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 pointer-events-none animate-in fade-in duration-200">
            <div className="relative flex items-center justify-center mb-5">
              <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-[#E50914] animate-spin" />
              <img 
                src="/assets/movix_3d_logo.png" 
                alt="Movix" 
                className="w-8 h-8 object-contain absolute"
              />
            </div>
            <h4 className="text-white font-bold text-sm tracking-wide mb-1 text-center px-4 font-display">
              {movie.title}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-white/50">
              <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
              <span>Netflix Cloud Stream • {currentQuality}</span>
            </div>
          </div>
        )}

        {/* ERROR RECOVERY BANNER */}
        {hasError && (
          <div className="absolute z-40 p-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-center max-w-xs animate-in zoom-in-95">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h4 className="text-white font-bold text-xs mb-1">Stream Interrupted</h4>
            <p className="text-[11px] text-white/70 mb-3">Connecting alternative high-speed mirror...</p>
            <button
              onClick={handleNextServer}
              className="px-4 py-2 rounded-xl bg-[#E50914] text-white text-xs font-bold shadow-lg"
            >
              Switch to Mirror Server
            </button>
          </div>
        )}

        {/* CENTER PROMINENT TAP-TO-PLAY BUTTON (For Direct Video) */}
        {!isPlaying && !hasError && currentSource.type === 'video' && (
          <div 
            onClick={togglePlay}
            className="absolute z-40 flex flex-col items-center justify-center cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#E50914] to-[#FF4154] text-white flex items-center justify-center shadow-2xl shadow-red-900/60 group-hover:scale-110 active:scale-95 transition-all mb-3 ring-4 ring-white/20 animate-pulse">
              <Play className="w-10 h-10 fill-white ml-1.5" />
            </div>
            <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold tracking-wider uppercase border border-white/20">
              Tap to Play Movie
            </span>
          </div>
        )}
      </div>

      {/* 10. BOTTOM CONTROL BAR (XPLAYER SIGNATURE CONTROLS) */}
      {currentSource.type === 'video' && (
        <div className={`absolute bottom-0 left-0 right-0 z-40 ${isLandscape ? 'px-6 pb-3 pt-8' : 'px-5 pb-5 pt-10'} bg-gradient-to-t from-black/95 via-black/85 to-transparent flex flex-col space-y-2 transition-opacity duration-300 pointer-events-auto ${
          showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Progress Timeline Scrubber */}
          <div className="flex items-center space-x-3 text-xs text-white/70 font-mono">
            <span className="w-10 text-right">{currentTime}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
            />
            <span className="w-10">{duration}</span>
          </div>

          {/* Action Controls Row */}
          <div className="flex items-center justify-between pt-0.5">
            {/* Left: Play/Pause, Rewind, Fast Forward, Mute */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="text-white hover:text-[#E50914] transition-colors p-1"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  skipSeconds(-10);
                }}
                className="text-white/80 hover:text-white transition-colors p-1"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  skipSeconds(10);
                }}
                className="text-white/80 hover:text-white transition-colors p-1"
                title="Fast Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Mute/Volume Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!videoRef.current) return;
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Right: Aspect Ratio, Languages, Quality, Speed, Rotate, Fullscreen */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Aspect Ratio Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cycleAspectRatio();
                }}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center space-x-1"
                title="Change Aspect Ratio"
              >
                <Scan className="w-3.5 h-3.5" />
                <span className="uppercase text-[9px]">{aspectMode}</span>
              </button>

              {/* Screen Rotate Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOrientation();
                }}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center space-x-1"
                title="Rotate Screen"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Playback Speed Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowServerMenu(false);
                  setShowQualityMenu(false);
                  setShowLanguageMenu(false);
                }}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center space-x-1"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{playbackSpeed}x</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullScreen();
                }}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(playerContent, document.body);
};
