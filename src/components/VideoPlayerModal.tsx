import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Play, Pause, Volume2, VolumeX, Volume1, Maximize, RotateCcw, RotateCw, 
  Server, Lock, Unlock, Sun, SunMedium, Gauge, Scan, Check, Languages, Globe, AlertCircle, Smartphone,
  SlidersHorizontal, Clock, Sparkles
} from 'lucide-react';
import { Movie, StreamSource, VideoQuality, AudioLanguage } from '../types';
import { getStreamingSources, getTvStreamingSources } from '../services/tmdb';
import { saveResumeProgress } from '../services/continueWatching';

interface VideoPlayerModalProps {
  movie: Movie;
  initialQuality?: VideoQuality;
  initialLanguage?: AudioLanguage;
  onClose: () => void;
}

type AspectMode = 'contain' | 'cover' | 'fill';

const AVAILABLE_LANGUAGES: { id: AudioLanguage; label: string; native: string; icon: string }[] = [
  { id: 'Hindi', label: 'Hindi', native: 'हिंदी 5.1', icon: '🇮🇳' },
  { id: 'Tamil', label: 'Tamil', native: 'தமிழ் Dub', icon: '🇮🇳' },
  { id: 'Telugu', label: 'Telugu', native: 'తెలుగు Dub', icon: '🇮🇳' },
  { id: 'Malayalam', label: 'Malayalam', native: 'മലയാളം', icon: '🇮🇳' },
  { id: 'Kannada', label: 'Kannada', native: 'ಕನ್ನಡ', icon: '🇮🇳' },
  { id: 'English', label: 'English', native: 'Original 5.1', icon: '🇬🇧' },
  { id: 'Spanish', label: 'Spanish', native: 'Español', icon: '🇪🇸' }
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

  // Strictly determine languages that are genuinely available for this movie
  const validLanguages: AudioLanguage[] = useMemo(() => {
    if (movie.availableLanguages && movie.availableLanguages.length > 0) {
      return movie.availableLanguages;
    }
    const genre = (movie.genre || '').toLowerCase();
    if (genre.includes('tamil') || genre.includes('kollywood')) return ['Tamil'];
    if (genre.includes('telugu') || genre.includes('tollywood')) return ['Telugu'];
    if (genre.includes('hindi') || genre.includes('bollywood')) return ['Hindi'];
    if (genre.includes('malayalam') || genre.includes('mollywood')) return ['Malayalam'];
    if (genre.includes('kannada')) return ['Kannada'];
    return ['English'];
  }, [movie]);

  // Resolution & Language state (hydrated strictly with valid movie languages)
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>(() => {
    return (localStorage.getItem('movix_pref_quality') as VideoQuality) || initialQuality;
  });
  const [currentLanguage, setCurrentLanguage] = useState<AudioLanguage>(() => {
    const pref = (localStorage.getItem('movix_pref_language') as AudioLanguage);
    if (pref && validLanguages.includes(pref)) {
      return pref;
    }
    if (validLanguages.includes(initialLanguage)) {
      return initialLanguage;
    }
    return validLanguages[0] || 'English';
  });

  // Keep currentLanguage strictly locked to a valid language for this movie
  useEffect(() => {
    if (!validLanguages.includes(currentLanguage)) {
      const pref = (localStorage.getItem('movix_pref_language') as AudioLanguage);
      if (pref && validLanguages.includes(pref)) {
        setCurrentLanguage(pref);
      } else {
        setCurrentLanguage(validLanguages[0] || 'English');
      }
    }
  }, [movie, validLanguages, currentLanguage]);

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
  const [showPlayerOptionsMenu, setShowPlayerOptionsMenu] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Generate dynamic quality streaming sources with accurate ID & TV detection
  const mid = movie.tmdbId || (typeof movie.id === 'string' && movie.id.startsWith('tmdb-') ? parseInt(movie.id.replace('tmdb-', '')) : parseInt(movie.id as any)) || 801688;
  const isTv = movie.mediaType === 'tv' || movie.isTvSeries || (movie.duration && movie.duration.toLowerCase().includes('season'));
  const sources: StreamSource[] = isTv
    ? getTvStreamingSources(mid, movie.season || 1, movie.episode || 1, currentQuality, currentLanguage)
    : getStreamingSources(mid, undefined, currentQuality, currentLanguage);

  // Default to Server 3 (AutoEmbed / VidSrc Ultra HD) for fast instant loading
  const defaultServerIndex = sources.findIndex(s => s.name.includes('Server 3')) !== -1 
    ? sources.findIndex(s => s.name.includes('Server 3')) 
    : 2;

  const [activeSourceIndex, setActiveSourceIndex] = useState(defaultServerIndex);
  const currentSource = sources[activeSourceIndex] || sources[defaultServerIndex] || sources[0];

  // Auto-hide controls after 3 seconds to provide clean unobstructed cinema view
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!isLocked && !showLanguageMenu && !showServerMenu && !showQualityMenu && !showSpeedMenu && !showPlayerOptionsMenu) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowServerMenu(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
        setShowLanguageMenu(false);
        setShowPlayerOptionsMenu(false);
      }, 3000);
    }
  }, [isLocked, showLanguageMenu, showServerMenu, showQualityMenu, showSpeedMenu, showPlayerOptionsMenu]);

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
      if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
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

  // Screen Lock & controls auto-hide logic
  const watchSecondsRef = useRef<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      watchSecondsRef.current += 1;
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClose = useCallback(() => {
    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob && typeof androidAdMob.setPlayerActive === 'function') {
      androidAdMob.setPlayerActive(false);
    }
    // High-eCPM post-roll interstitial monetization:
    // When closing the player after watching for at least 10 seconds or starting playback, show interstitial
    if (watchSecondsRef.current >= 10 || hasStartedPlaying) {
      if (androidAdMob && typeof androidAdMob.showInterstitialAd === 'function') {
        androidAdMob.showInterstitialAd();
      }
    }
    onClose();
  }, [hasStartedPlaying, onClose]);

  // Listen for PvrPlay player postMessage events (pvr:close, pvr:resume)
  useEffect(() => {
    const handlePlayerMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data) return;

      if (data.type === 'pvr:close') {
        handleClose();
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
  }, [movie, handleClose]);

  const lastSavedTimeRef = useRef<number>(0);
  const savedPlaybackTimeRef = useRef<number>(0);

  // Attempt initial playback immediately on mount and source switch
  useEffect(() => {
    // For embedded cloud cinema streams, ensure instant unblocked playback without buffering lock
    if (currentSource.type === 'embed' || currentSource.type === 'trailer') {
      setIsBuffering(false);
      setHasStartedPlaying(true);
      setHasError(false);
      return;
    }

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
    videoRef.current.volume = 1.0;
    videoRef.current.muted = false;
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

  // Change streaming quality on the fly (Preserves exact second & persists preference)
  const handleQualityChange = (q: VideoQuality) => {
    if (videoRef.current) {
      savedPlaybackTimeRef.current = videoRef.current.currentTime;
    }
    setCurrentQuality(q);
    setShowQualityMenu(false);
    localStorage.setItem('movix_pref_quality', q);

    setIsBuffering(false);
    setHasStartedPlaying(true);

    setGestureOsd({ type: 'info', value: `Quality: ${q} • Smooth Playback`, icon: '⚡' });
    setTimeout(() => {
      setGestureOsd(null);
    }, 1400);
    resetControlsTimeout();
  };

  // Change audio language on the fly (Persists preference)
  const handleLanguageChange = (lang: AudioLanguage) => {
    setCurrentLanguage(lang);
    setShowLanguageMenu(false);
    localStorage.setItem('movix_pref_language', lang);
    setIsBuffering(false);
    setHasStartedPlaying(true);
    setGestureOsd({ type: 'info', value: `Audio: ${lang} (Dolby 5.1)`, icon: '🌐' });
    setTimeout(() => {
      setGestureOsd(null);
    }, 1400);
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

  // Dedicated Sound / Volume Controller (0% to 150% Boost)
  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1.5, Math.round(newVol * 100) / 100));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (videoRef.current) {
      videoRef.current.volume = Math.min(1, clamped);
      videoRef.current.muted = clamped === 0;
    }
    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob && typeof androidAdMob.setDeviceVolume === 'function') {
      androidAdMob.setDeviceVolume(Math.min(1, clamped));
    }
    setGestureOsd({
      type: 'volume',
      value: clamped > 1.0 ? `${Math.round(clamped * 100)}% Boost 🚀` : `${Math.round(clamped * 100)}%`,
      icon: clamped === 0 ? '🔇' : clamped > 1.0 ? '🔊' : '🔉',
      percent: Math.min(100, Math.round((clamped / 1.5) * 100))
    });
    setTimeout(() => setGestureOsd(null), 1200);
    resetControlsTimeout();
  };

  const toggleMute = () => {
    if (isMuted || volume === 0) {
      handleVolumeChange(1.0);
    } else {
      handleVolumeChange(0);
    }
  };

  // Dedicated Screen Brightness Controller (20% to 150%)
  const handleBrightnessChange = (newBright: number) => {
    const clamped = Math.max(20, Math.min(150, Math.round(newBright)));
    setBrightness(clamped);
    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob && typeof androidAdMob.setDeviceBrightness === 'function') {
      androidAdMob.setDeviceBrightness(clamped / 150);
    }
    setGestureOsd({
      type: 'brightness',
      value: `${Math.round((clamped / 150) * 100)}%`,
      icon: clamped < 40 ? '🌙' : '☀️',
      percent: Math.round((clamped / 150) * 100)
    });
    setTimeout(() => setGestureOsd(null), 1200);
    resetControlsTimeout();
  };

  // Sleep Timer Controller
  const setTimerMinutes = (minutes: number | null) => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    setSleepTimer(minutes);
    if (minutes !== null && minutes > 0) {
      sleepTimerRef.current = setTimeout(() => {
        handleClose();
      }, minutes * 60 * 1000);
      setGestureOsd({ type: 'info', value: `Sleep Timer: ${minutes}m`, icon: '⏱️' });
    } else {
      setGestureOsd({ type: 'info', value: 'Sleep Timer: Off', icon: '⏱️' });
    }
    setTimeout(() => setGestureOsd(null), 1500);
    resetControlsTimeout();
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

  const getIframeTransform = () => {
    if (aspectMode === 'cover') {
      return isLandscape ? 'scale(1.34)' : 'scale(1.18)';
    }
    if (aspectMode === 'fill') {
      return isLandscape ? 'scaleX(1.34) scaleY(1.06)' : 'scaleX(1.18) scaleY(1.06)';
    }
    return 'none';
  };

  const playerContent = (
    <div 
      ref={containerRef}
      id="movix-xplayer-container" 
      className="fixed inset-0 z-50 bg-black select-none overflow-hidden w-screen h-screen w-full h-full min-h-[100dvh] max-h-[100dvh]"
      style={{ filter: `brightness(${brightness}%)` }}
      onTouchStart={currentSource.type === 'video' ? handleTouchStart : undefined}
      onTouchMove={currentSource.type === 'video' ? handleTouchMove : undefined}
      onTouchEnd={currentSource.type === 'video' ? handleTouchEnd : undefined}
    >
      {/* 100% Zero-Overlay Tap Area: All controls completely hidden while playing; tap screen to summon */}
      {!showControls && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setShowControls(true);
            resetControlsTimeout();
          }}
          className="absolute inset-0 z-30 cursor-pointer"
          aria-label="Tap to summon controls"
        />
      )}

      {/* 1. TOP CONTROL BAR (ABSOLUTE OVERLAY - NEVER DISTORTS VIDEO SIZING) */}
      <div 
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 24px)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)'
        }}
        className={`absolute top-0 left-0 right-0 z-40 pb-8 bg-gradient-to-b from-black/95 via-black/80 to-transparent flex items-center justify-between transition-opacity duration-300 pointer-events-auto ${
          showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
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
          {/* 1. Language / Audio Switcher Button (PROMINENT & HIGHLIGHTED) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLanguageMenu(!showLanguageMenu);
              setShowQualityMenu(false);
              setShowServerMenu(false);
              setShowSpeedMenu(false);
              setShowPlayerOptionsMenu(false);
              resetControlsTimeout();
            }}
            className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center space-x-1.5 border border-blue-400/40 active:scale-95 shadow-lg flex-shrink-0"
            title="Audio Language"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0 animate-pulse" />
            <span className="font-extrabold">Audio: {currentLanguage}</span>
          </button>

          {/* 2. Quality Switcher Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowQualityMenu(!showQualityMenu);
              setShowServerMenu(false);
              setShowSpeedMenu(false);
              setShowLanguageMenu(false);
              setShowPlayerOptionsMenu(false);
              resetControlsTimeout();
            }}
            className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center space-x-1 border border-white/10 active:scale-95 flex-shrink-0"
            title="Select Quality"
          >
            <span>{currentQuality}</span>
          </button>

          {/* 3. 1-Tap Screen Rotate (Desktop/Tablet) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleOrientation();
            }}
            className="hidden sm:flex p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 active:scale-95 flex-shrink-0"
            title={isLandscape ? "Switch to Portrait" : "Rotate to Landscape"}
          >
            <RotateCw className="w-4 h-4 text-white" />
          </button>

          {/* 4. XPlayer Options Center Drawer Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPlayerOptionsMenu(!showPlayerOptionsMenu);
              setShowQualityMenu(false);
              setShowServerMenu(false);
              setShowSpeedMenu(false);
              setShowLanguageMenu(false);
              resetControlsTimeout();
            }}
            className="px-2.5 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-[#E50914] hover:from-red-500 hover:to-red-600 text-white text-xs font-bold flex items-center space-x-1.5 border border-white/20 active:scale-95 shadow-lg flex-shrink-0"
            title="XPlayer Options"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
            <span className="hidden xs:inline">Options</span>
          </button>

          {/* 5. Close Player */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 flex-shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Click-shield backdrop to close open dropdowns without touching the iframe */}
      {(showQualityMenu || showLanguageMenu || showServerMenu || showSpeedMenu || showPlayerOptionsMenu) && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setShowQualityMenu(false);
            setShowLanguageMenu(false);
            setShowServerMenu(false);
            setShowSpeedMenu(false);
            setShowPlayerOptionsMenu(false);
            resetControlsTimeout();
          }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
        />
      )}

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
          <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-white/50 text-center">
            💡 Tap ⚙️ inside player to fine-tune live bitrate
          </div>
        </div>
      )}

      {/* 3. MULTI-LANGUAGE AUDIO MODAL (CENTERED & RESPONSIVE) */}
      {showLanguageMenu && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[94vw] max-w-sm max-h-[85vh] overflow-y-auto bg-[#0E121D]/98 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 shadow-2xl text-white animate-in zoom-in-95 duration-200 scrollbar-none no-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Globe className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                  Audio Track & Language
                </h3>
                <p className="text-[10px] text-white/60">
                  {movie.title} • {validLanguages.length > 1 ? `${validLanguages.length} Languages Available` : `${validLanguages[0]} Original Audio`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLanguageMenu(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of STRICTLY AVAILABLE languages only */}
          <div className="space-y-2">
            {AVAILABLE_LANGUAGES
              .filter((lang) => validLanguages.includes(lang.id))
              .map((lang) => {
                const isSelected = currentLanguage === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border border-blue-400/40 ring-2 ring-blue-500/30'
                        : 'bg-white/10 text-white hover:bg-white/15 border border-white/15'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{lang.icon}</span>
                      <div className="text-left">
                        <div className="text-xs font-bold leading-tight">
                          {lang.label} ({lang.native})
                        </div>
                        <div className="text-[10px] text-white/50">
                          {isSelected ? 'Active Track • Dolby 5.1' : 'Available Audio Track • Ready'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-white text-blue-600 flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold uppercase">
                          Ready
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 text-[10px] text-white/60 text-center">
            {validLanguages.length === 1 ? (
              <span>🎬 This movie is exclusively available in <strong>{validLanguages[0]}</strong>.</span>
            ) : (
              <span>💡 Tap to switch between <strong>{validLanguages.length} available languages</strong>.</span>
            )}
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

      {/* 5.1 XPLAYER ALL-IN-ONE OPTIONS CENTER MODAL */}
      {showPlayerOptionsMenu && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[94vw] max-w-lg max-h-[85vh] overflow-y-auto bg-[#0d111a]/98 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 sm:p-6 shadow-2xl text-white animate-in zoom-in-95 duration-200 scrollbar-none no-scrollbar"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E50914] flex items-center justify-center text-white shadow-md">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                  XPlayer Cinema Controls
                </h3>
                <p className="text-[10px] sm:text-[11px] text-white/60">
                  {movie.title} • {currentQuality}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPlayerOptionsMenu(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* 1. SOUND & VOLUME (0% - 150% BOOST) */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/90 flex items-center space-x-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>Sound Volume: {Math.round(volume * 100)}%{volume > 1.0 ? ' (Boost 🚀)' : ''}</span>
                </span>
                <button
                  onClick={toggleMute}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                    isMuted || volume === 0
                      ? 'bg-red-500/30 text-red-400 border-red-500/40'
                      : 'bg-white/10 text-white/80 border-white/20'
                  }`}
                >
                  {isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
              />
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                {[
                  { label: 'Mute', val: 0 },
                  { label: '50%', val: 0.5 },
                  { label: '100%', val: 1.0 },
                  { label: '150% 🚀', val: 1.5 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleVolumeChange(preset.val)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      (isMuted && preset.val === 0) || (!isMuted && Math.abs(volume - preset.val) < 0.08)
                        ? 'bg-[#E50914] text-white shadow'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. SCREEN BRIGHTNESS (20% - 150%) */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/90 flex items-center space-x-1.5">
                  <SunMedium className="w-4 h-4 text-amber-400" />
                  <span>Brightness: {Math.round((brightness / 150) * 100)}%</span>
                </span>
                <span className="text-[10px] text-white/50 font-mono">Hardware Sync</span>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={brightness}
                onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                {[
                  { label: 'Night 25%', val: 38 },
                  { label: 'Normal 50%', val: 75 },
                  { label: 'Cinema 80%', val: 120 },
                  { label: 'Max 100%', val: 150 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleBrightnessChange(preset.val)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      Math.abs(brightness - preset.val) < 15
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. AUDIO TRACK & LANGUAGE CHANGE OPTION (STRICTLY AVAILABLE ONLY) */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/90 flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Available Audio Language:</span>
                </span>
                <span className="text-[10px] font-bold text-cyan-300 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-500/40">
                  {currentLanguage}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto no-scrollbar">
                {AVAILABLE_LANGUAGES.filter((lang) => validLanguages.includes(lang.id)).map((lang) => {
                  const isSelected = currentLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md border border-blue-400/40'
                          : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <span>{lang.icon}</span>
                        <span className="truncate">{lang.label} ({lang.native})</span>
                      </div>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 flex-shrink-0 text-white" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Ready" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. PLAYBACK SPEED & SCREEN FIT */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Speed */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-bold text-white/80 block mb-1.5">
                  Speed: {playbackSpeed}x
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => changeSpeed(s)}
                      className={`py-1 rounded-lg text-[10px] font-bold ${
                        playbackSpeed === s ? 'bg-[#E50914] text-white' : 'bg-white/5 hover:bg-white/10 text-white/70'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Screen Fit */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-bold text-white/80 block mb-1.5">
                  Screen Fitting:
                </span>
                <div className="space-y-1">
                  {[
                    { id: 'contain', label: '16:9 Fit' },
                    { id: 'cover', label: '100% Crop' },
                    { id: 'fill', label: 'Stretch' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setAspectMode(mode.id as AspectMode);
                        resetControlsTimeout();
                      }}
                      className={`w-full py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-between ${
                        aspectMode === mode.id ? 'bg-[#E50914] text-white' : 'bg-white/5 hover:bg-white/10 text-white/70'
                      }`}
                    >
                      <span>{mode.label}</span>
                      {aspectMode === mode.id && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. SLEEP TIMER */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white/90 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Sleep Timer:</span>
                </span>
                <span className="text-[10px] text-white/60">
                  {sleepTimer ? `${sleepTimer}m remaining` : 'Disabled'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: 'Off', val: null },
                  { label: '15m', val: 15 },
                  { label: '30m', val: 30 },
                  { label: '45m', val: 45 },
                  { label: '60m', val: 60 }
                ].map((t) => (
                  <button
                    key={t.label}
                    onClick={() => setTimerMinutes(t.val)}
                    className={`py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                      sleepTimer === t.val
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. QUICK ACTIONS: ROTATE & SCREEN LOCK */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => {
                  toggleOrientation();
                  setShowPlayerOptionsMenu(false);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center space-x-1.5 border border-white/10 active:scale-95"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Rotate Screen</span>
              </button>

              <button
                onClick={() => {
                  setIsLocked(!isLocked);
                  setShowPlayerOptionsMenu(false);
                  setShowControls(true);
                  resetControlsTimeout();
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center space-x-1.5 border border-white/10 active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Screen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SCREEN LOCK BUTTON (XPlayer Signature - Completely hidden while movie plays) */}
      <div className={`absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-50 transition-opacity duration-300 ${
        showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
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
              : 'bg-black/60 text-white/70 border border-white/20 hover:text-white'
          }`}
          title={isLocked ? 'Unlock Screen' : 'Lock Screen'}
        >
          {isLocked ? <Lock className="w-5 h-5 text-white" /> : <Unlock className="w-5 h-5" />}
        </button>
      </div>

      {/* 6.1 ON-SCREEN VERTICAL BRIGHTNESS SLIDER CAPSULE (XPLAYER SIGNATURE - Hidden while movie plays) */}
      <div className={`absolute left-16 sm:left-20 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center bg-black/80 backdrop-blur-md px-2 py-3 rounded-full border border-white/20 shadow-2xl transition-opacity duration-300 pointer-events-auto ${
        showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <SunMedium className="w-4 h-4 text-amber-400 mb-2" />
        <input
          type="range"
          min="20"
          max="150"
          step="5"
          value={brightness}
          onChange={(e) => handleBrightnessChange(parseInt(e.target.value))}
          className="h-24 sm:h-28 w-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-500 [writing-mode:vertical-lr] [direction:rtl]"
          title="Brightness Control"
        />
        <span className="text-[9px] font-bold text-white/80 mt-2 font-mono">
          {Math.round((brightness / 150) * 100)}%
        </span>
      </div>

      {/* 6.2 ON-SCREEN VERTICAL SOUND / VOLUME SLIDER CAPSULE (XPLAYER SIGNATURE - Hidden while movie plays) */}
      <div className={`absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center bg-black/80 backdrop-blur-md px-2 py-3 rounded-full border border-white/20 shadow-2xl transition-opacity duration-300 pointer-events-auto ${
        showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="mb-2 text-white/80 hover:text-white"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4 text-red-500" />
          ) : volume > 1.0 ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Volume1 className="w-4 h-4 text-white" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1.5"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="h-24 sm:h-28 w-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E50914] [writing-mode:vertical-lr] [direction:rtl]"
          title="Sound Volume Control (0-150% Boost)"
        />
        <span className="text-[9px] font-bold text-white/80 mt-2 font-mono">
          {Math.round(volume * 100)}%
        </span>
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
          <iframe
            key={`${currentSource.url}-${currentQuality}-${currentLanguage}-${activeSourceIndex}`}
            src={currentSource.url}
            title={movie.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            referrerPolicy="origin"
            onLoad={() => {
              setIsBuffering(false);
              setHasStartedPlaying(true);
            }}
            style={{ 
              transform: getIframeTransform(), 
              transformOrigin: 'center center',
              transition: 'transform 0.25s ease-out',
              willChange: 'transform' 
            }}
            className="w-full h-full border-0 absolute inset-0 z-10"
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

      {/* 10. QUICK SERVER MIRROR SWITCHER BAR (Auto-hidden while movie plays; 1-tap failover on summon) */}
      {currentSource.type !== 'video' && (
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-300 pointer-events-auto max-w-[96vw] ${
          showControls && !isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex items-center space-x-2 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-2xl overflow-x-auto no-scrollbar scrollbar-none">
            {/* Quick Audio Language Switcher (FIRST & PROMINENT) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLanguageMenu(!showLanguageMenu);
                setShowServerMenu(false);
                setShowQualityMenu(false);
                setShowSpeedMenu(false);
                setShowPlayerOptionsMenu(false);
                resetControlsTimeout();
              }}
              className="px-3 py-1 rounded-full text-xs font-black tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg flex items-center space-x-1.5 active:scale-95 transition-all border border-blue-400/50 flex-shrink-0"
              title="Available Audio Languages"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0 animate-pulse" />
              <span>Language: {currentLanguage}</span>
              {validLanguages.length > 1 && (
                <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded-full font-mono ml-0.5">
                  +{validLanguages.length - 1}
                </span>
              )}
            </button>

            {/* XPlayer Options Drawer Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPlayerOptionsMenu(!showPlayerOptionsMenu);
                setShowLanguageMenu(false);
                setShowServerMenu(false);
                setShowQualityMenu(false);
                setShowSpeedMenu(false);
                resetControlsTimeout();
              }}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-gradient-to-r from-red-600 to-[#E50914] text-white shadow-md flex items-center space-x-1 active:scale-95 transition-all flex-shrink-0"
              title="Open XPlayer Options"
            >
              <SlidersHorizontal className="w-3 h-3 text-white" />
              <span>Options</span>
            </button>

            <span className="text-white/20 text-xs flex-shrink-0">|</span>
            <span className="text-[11px] font-bold text-white/70 mr-0.5 hidden sm:inline flex-shrink-0">Stream Mirror:</span>

            {/* Stream Mirrors */}
            {sources.map((src, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSourceIndex(idx);
                  setIsBuffering(false);
                  setHasStartedPlaying(true);
                  setGestureOsd({ type: 'info', value: `Connected: Server ${idx + 1}`, icon: '🔄' });
                  setTimeout(() => setGestureOsd(null), 1400);
                  resetControlsTimeout();
                }}
                className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all active:scale-95 flex-shrink-0 ${
                  activeSourceIndex === idx
                    ? 'bg-gradient-to-r from-[#E50914] to-[#FF4154] text-white shadow-md'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {src.type === 'video' ? 'Direct 4K' : `S${idx + 1}`}
              </button>
            ))}

            {/* Rewarded Ad VIP Server Booster Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const androidAdMob = (window as any).AndroidAdMob;
                if (androidAdMob && typeof androidAdMob.showRewardedAd === 'function') {
                  androidAdMob.showRewardedAd();
                } else if (androidAdMob && typeof androidAdMob.showInterstitialAd === 'function') {
                  androidAdMob.showInterstitialAd();
                }
                setGestureOsd({ type: 'info', value: '⭐ VIP 4K Server Unlocked!', icon: '👑' });
                setTimeout(() => setGestureOsd(null), 2000);
                setActiveSourceIndex(0); // Switch to ultra-fast Server 1 (VidLink Pro 4K)
                resetControlsTimeout();
              }}
              className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md flex items-center space-x-1 active:scale-95 transition-all flex-shrink-0"
              title="Watch Ad for 4K VIP Pass"
            >
              <span>⭐</span>
              <span className="hidden xs:inline">VIP 4K</span>
            </button>
          </div>
        </div>
      )}

      {/* 11. BOTTOM CONTROL BAR (XPLAYER SIGNATURE CONTROLS) */}
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
                  setShowPlayerOptionsMenu(false);
                }}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center space-x-1"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>{playbackSpeed}x</span>
              </button>

              {/* Audio Language Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLanguageMenu(!showLanguageMenu);
                  setShowSpeedMenu(false);
                  setShowPlayerOptionsMenu(false);
                  resetControlsTimeout();
                }}
                className="px-2.5 py-1 rounded-md bg-blue-600/90 hover:bg-blue-600 text-[11px] font-bold text-white flex items-center space-x-1 shadow active:scale-95"
                title="Change Audio Language"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-300" />
                <span>{currentLanguage}</span>
              </button>

              {/* XPlayer Options Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPlayerOptionsMenu(!showPlayerOptionsMenu);
                  setShowSpeedMenu(false);
                  setShowServerMenu(false);
                  setShowQualityMenu(false);
                  setShowLanguageMenu(false);
                  resetControlsTimeout();
                }}
                className="px-2 py-1 rounded-md bg-gradient-to-r from-red-600 to-[#E50914] text-[11px] font-bold text-white flex items-center space-x-1 shadow-md active:scale-95"
                title="XPlayer Options"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Options</span>
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
