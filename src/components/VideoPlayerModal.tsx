import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw } from 'lucide-react';
import { Movie } from '../types';

interface VideoPlayerModalProps {
  movie: Movie;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ movie, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');

  useEffect(() => {
    // Show loading logo for at least 800ms when movie starts
    const timer = setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState >= 3) {
        setIsBuffering(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setProgress((curr / dur) * 100);
    setCurrentTime(formatTime(curr));
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(formatTime(videoRef.current.duration));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * (videoRef.current.duration || 1);
    videoRef.current.currentTime = seekTime;
    setProgress(parseFloat(e.target.value));
  };

  const skipSeconds = (sec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + sec);
  };

  const toggleFullScreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 z-30 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center space-x-3">
          <img 
            src="/assets/movix_3d_logo.png" 
            alt="Movix" 
            className="w-7 h-7 object-contain drop-shadow-[0_2px_8px_rgba(168,85,247,0.5)]" 
          />
          <div>
            <span className="text-[#E50914] text-[10px] font-bold uppercase tracking-wider">Now Playing on Movix</span>
            <h2 className="text-white font-bold text-base sm:text-lg leading-tight">{movie.title}</h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video Canvas & Movie Loading Overlay */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={movie.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
          autoPlay
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsBuffering(true)}
          onPlaying={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* WHILE LOADING MOVIES: Dedicated 3D Logo Loader Overlay */}
        {isBuffering && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 pointer-events-none animate-in fade-in duration-200">
            <div className="relative flex items-center justify-center mb-4">
              {/* Spinning gradient ring */}
              <div className="absolute -inset-4 rounded-full border-2 border-transparent border-t-purple-500 border-r-pink-500 border-b-[#E50914] animate-spin" />
              {/* Radial neon glow */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-purple-600/30 via-pink-600/30 to-amber-500/30 blur-xl rounded-full" />
              {/* 3D Movix Logo */}
              <div className="relative w-20 h-20 animate-pulse">
                <img 
                  src="/assets/movix_3d_logo.png" 
                  alt="Loading Movie"
                  className="w-full h-full object-contain drop-shadow-[0_4px_16px_rgba(236,72,153,0.7)]"
                />
              </div>
            </div>

            <h4 className="text-white font-bold text-sm tracking-wide mb-1">
              {movie.title}
            </h4>
            <div className="flex items-center space-x-2 text-[11px] text-white/60 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Buffering 4K HDR Stream...</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="px-6 py-5 z-30 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col space-y-3">
        {/* Progress Slider */}
        <div className="flex items-center space-x-3 text-xs text-white/70 font-mono">
          <span>{currentTime}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#E50914]"
          />
          <span>{duration}</span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={togglePlay}
              className="p-2.5 rounded-full bg-[#E50914] text-white hover:brightness-110 active:scale-95 shadow-lg shadow-red-900/40"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </button>

            <button 
              onClick={() => skipSeconds(-10)} 
              className="p-2 text-white/70 hover:text-white"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button 
              onClick={() => skipSeconds(10)} 
              className="p-2 text-white/70 hover:text-white"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            <button 
              onClick={toggleMute} 
              className="p-2 text-white/70 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/80 border border-white/20">
              1080p Full HD
            </span>
            <button 
              onClick={toggleFullScreen}
              className="p-2 text-white/70 hover:text-white"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
