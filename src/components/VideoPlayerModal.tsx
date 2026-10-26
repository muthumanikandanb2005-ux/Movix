import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, 
  Server, Lock, Unlock, Sun, Gauge, Scan, Check, Languages, Globe, AlertCircle 
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
  
  // Drawers
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Gesture OSD overlays
  const [gestureOsd, setGestureOsd] = useState<{
    type: 'volume' | 'brightness' | 'seek' | 'info';
    value: string | number;
    icon: string;
  } | null>(null);

  // Double tap ripple
  const [ripple, setRipple] = useState<{ side: 'left' | 'right'; id: number } | null>(null);
  const [brightness, setBrightness] = useState(100);

  // Generate dynamic quality streaming sources
  const mid = movie.tmdbId || 801688;
  const sources: StreamSource[] = getStreamingSources(mid, undefined, currentQuality);

  const [activeSourceIndex, setActiveSourceIndex] = useState(0);
  const currentSource = sources[activeSourceIndex] || sources[0];

  // Auto-hide controls after 5 seconds to provide clean unobstructed cinema view
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!isLocked) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowServerMenu(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
        setShowLanguageMenu(false);
      }, 5000);
    }
  }, [isLocked]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

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
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [movie, onClose]);

  const lastSavedTimeRef = useRef<number>(0);

  // Attempt initial playback immediately on mount and source switch
  useEffect(() => {
    setIsBuffering(true);
    setHasError(false);

    // Check if there is saved resume progress
    let startSecond = 0;
    if (movie.tmdbId) {
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

    // Watchdog: Clear buffering quickly so user is never stuck on black loader
    const watchdog = setTimeout(() => {
      setIsBuffering(false);
    }, 800);

    const tryAutoPlay = async () => {
      if (videoRef.current && currentSource.type === 'video') {
        try {
          if (startSecond > 0 && videoRef.current.readyState >= 1) {
            videoRef.current.currentTime = startSecond;
            setGestureOsd({ type: 'seek', value: `Resumed from ${formatTime(startSecond)}`, icon: '⏱️' });
            setTimeout(() => setGestureOsd(null), 2000);
          }
          await videoRef.current.play();
          setIsPlaying(true);
          setHasStartedPlaying(true);
          setIsBuffering(false);
        } catch {
          // Autoplay blocked by WebView gesture policy - reveal center play button
          setIsPlaying(false);
          setIsBuffering(false);
          setShowControls(true);
        }
      }
    };

    tryAutoPlay();

    return () => clearTimeout(watchdog);
  }, [activeSourceIndex, currentQuality, movie.tmdbId]);

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
    if (curr > 0.1 && !hasStartedPlaying) {
      setHasStartedPlaying(true);
      setIsBuffering(false);
    }

    // Save resume progress every 5s
    if (movie.tmdbId && Math.abs(curr - lastSavedTimeRef.current) > 5) {
      lastSavedTimeRef.current = curr;
      saveResumeProgress(movie.tmdbId, curr, dur, movie);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(formatTime(videoRef.current.duration));
    setIsBuffering(false);
    videoRef.current.play().then(() => {
      setIsPlaying(true);
      setHasStartedPlaying(true);
    }).catch(() => {});
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

  // Change streaming quality on the fly
  const handleQualityChange = (q: VideoQuality) => {
    const savedTime = videoRef.current?.currentTime || 0;
    setCurrentQuality(q);
    setShowQualityMenu(false);
    setGestureOsd({ type: 'info', value: `Quality: ${q}`, icon: '⚡' });
    setTimeout(() => setGestureOsd(null), 1500);

    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = savedTime;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }, 200);
    resetControlsTimeout();
  };

  // Change audio language on the fly
  const handleLanguageChange = (lang: AudioLanguage) => {
    setCurrentLanguage(lang);
    setShowLanguageMenu(false);
    setGestureOsd({ type: 'info', value: `Audio Track: ${lang}`, icon: '🌐' });
    setTimeout(() => setGestureOsd(null), 1500);
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

  // Double tap gesture
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const touch = e.touches[0];
    const now = Date.now();
    const timeDiff = now - lastTapRef.current.time;
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;

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
  };

  // Aspect ratio toggler
  const cycleAspectRatio = () => {
    if (aspectMode === 'contain') {
      setAspectMode('cover');
      setGestureOsd({ type: 'seek', value: 'Crop / Zoom', icon: '🔍' });
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
      el.requestFullscreen();
    }
  };

  const getObjectFitClass = () => {
    switch (aspectMode) {
      case 'cover': return 'object-cover';
      case 'fill': return 'object-fill';
      default: return 'object-contain';
    }
  };

  return (
    <div 
      ref={containerRef}
      id="movix-xplayer-container" 
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none overflow-hidden"
      style={{ filter: `brightness(${brightness}%)` }}
      onTouchStart={handleTouchStart}
    >
      {/* Permanent Mini Floating Action Bar (visible when main header is collapsed) */}
      {!showControls && !isLocked && (
        <div className="absolute top-4 right-4 z-50 flex items-center space-x-2 animate-in fade-in duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowControls(true);
              setShowServerMenu(true);
            }}
            className="px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white/90 hover:text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-2xl flex items-center space-x-1.5 active:scale-95 transition-all"
            title="Switch Streaming Server"
          >
            <Server className="w-3.5 h-3.5 text-[#E50914]" />
            <span>{sources[activeSourceIndex]?.name.split(' ')[1] || 'Server'}</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-full bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-2xl active:scale-90 transition-all"
            title="Exit Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP CONTROL BAR */}
      <div className={`z-40 px-5 py-4 bg-gradient-to-b from-black/95 via-black/80 to-transparent flex items-center justify-between transition-opacity duration-300 ${
        showControls && !isLocked ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center space-x-3 min-w-0">
          <img 
            src="/assets/movix_3d_logo.png" 
            alt="Movix" 
            className="w-8 h-8 object-contain drop-shadow-[0_2px_10px_rgba(236,72,153,0.5)] flex-shrink-0" 
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[#E50914] text-[10px] font-bold uppercase tracking-wider">
                Movix Cinema
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold uppercase">
                {currentQuality}
              </span>
              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 text-[9px] font-semibold">
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
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 active:scale-95"
            title="Audio Language"
          >
            <Languages className="w-4 h-4 text-emerald-400" />
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
            <span className="text-[10px] text-emerald-400">Fast Buffer</span>
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
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audio Language:</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Dolby Audio</span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-none no-scrollbar">
            {AVAILABLE_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id)}
                className={`w-full py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  currentLanguage === lang.id
                    ? 'bg-[#E50914] text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white/80'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{lang.icon}</span>
                  <span>{lang.label}</span>
                </div>
                {currentLanguage === lang.id && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
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
            <span className="text-[10px] text-emerald-400">All Online</span>
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
          className="absolute bottom-24 right-16 z-50 w-44 bg-[#121622]/95 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
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

      {/* 7. GESTURE OSD DISPLAY OVERLAY */}
      {gestureOsd && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 px-5 py-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 text-white flex items-center space-x-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          <span className="text-2xl">{gestureOsd.icon}</span>
          <span className="text-sm font-bold tracking-wide">{gestureOsd.value}</span>
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

      {/* 9. VIDEO CANVAS */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
        {/* Backdrop poster preview (prevents empty pitch-black screen) */}
        {!hasStartedPlaying && (
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
          <iframe
            key={`${currentSource.url}-${activeSourceIndex}`}
            src={currentSource.url}
            title={movie.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setIsBuffering(false)}
            className="w-full h-full border-0 absolute inset-0"
          />
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

        {/* 3D Movix Buffering Screen with New User Logo */}
        {isBuffering && !hasStartedPlaying && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center z-30 pointer-events-none animate-in fade-in duration-200">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute -inset-4 rounded-full border-2 border-transparent border-t-purple-500 border-r-pink-500 border-b-[#E50914] animate-spin" />
              <div className="absolute -inset-2 bg-gradient-to-tr from-purple-600/30 via-pink-600/30 to-amber-500/30 blur-xl rounded-full" />
              <div className="relative w-20 h-20 animate-pulse">
                <img 
                  src="/assets/movix_3d_logo.png" 
                  alt="Loading Movie"
                  className="w-full h-full object-contain drop-shadow-[0_4px_20px_rgba(236,72,153,0.8)]"
                />
              </div>
            </div>

            <h4 className="text-white font-bold text-sm tracking-wide mb-1 text-center px-4">
              {movie.title}
            </h4>
            <div className="flex items-center space-x-2 text-[11px] text-white/60 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Fast Loading • {currentQuality} • {currentLanguage}</span>
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

      {/* 10. BOTTOM CONTROL BAR (XPLAYER SIGNATURE CONTROLS FOR DIRECT VIDEO) */}
      {currentSource.type === 'video' && (
        <div className={`z-40 px-5 py-4 bg-gradient-to-t from-black/95 via-black/85 to-transparent flex flex-col space-y-2.5 transition-opacity duration-300 ${
          showControls && !isLocked ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
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
          <div className="flex items-center justify-between pt-1">
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

            {/* Right: Aspect Ratio, Languages, Quality, Speed, Fullscreen */}
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
};
