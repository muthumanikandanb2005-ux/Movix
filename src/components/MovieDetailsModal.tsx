import React, { useState } from 'react';
import { X, Play, Plus, Check, Download, Star, Server, Sparkles } from 'lucide-react';
import { Movie } from '../types';

interface MovieDetailsModalProps {
  movie: Movie;
  isInList: boolean;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  onToggleList: (movie: Movie) => void;
  onDownload: (movie: Movie) => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  isInList,
  onClose,
  onPlay,
  onToggleList,
  onDownload
}) => {
  const [showServerPicker, setShowServerPicker] = useState(false);

  const sources = movie.streamSources || [
    { name: 'Server 1 (XPlayer Direct 4K)', url: movie.videoUrl || '', type: 'video' },
    { name: 'Server 2 (VidSrc Cloud 4K)', url: `https://vidsrc.xyz/embed/movie?tmdb=${movie.tmdbId}`, type: 'embed' },
    { name: 'Server 3 (MultiEmbed Ultra)', url: `https://multiembed.mov/?video_id=${movie.tmdbId}&tmdb=1`, type: 'embed' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-[#10131B] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl relative flex flex-col pb-safe">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all backdrop-blur-md"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Banner Header */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#181c28]">
          <img 
            src={movie.backdrop || movie.poster} 
            alt={movie.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/assets/hero_clean.png';
            }}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10131B] via-[#10131B]/40 to-transparent" />
          
          {/* Quick Play Floating Button */}
          <button
            onClick={() => onPlay(movie)}
            className="absolute bottom-4 left-5 w-12 h-12 rounded-full bg-gradient-to-tr from-[#E50914] to-[#FF4154] text-white flex items-center justify-center shadow-lg shadow-red-950/60 active:scale-90 transition-transform"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>

          {/* Quality Badge */}
          <div className="absolute top-4 left-5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-lg bg-black/60 border border-white/20 text-white backdrop-blur-md">
            4K ULTRA HD • DOLBY ATMOS
          </div>
        </div>

        {/* Content Body */}
        <div className="px-5 pt-2 pb-6 space-y-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight font-display">
              {movie.title}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-white/70 font-medium mt-1 flex-wrap">
              <span className="text-emerald-400 font-bold">98% Match</span>
              <span>•</span>
              <span>{movie.year}</span>
              <span>•</span>
              <span className="px-1.5 py-0.2 rounded border border-white/30 text-[10px]">4K UHD</span>
              <span>•</span>
              <span>{movie.duration}</span>
              <span>•</span>
              <span className="flex items-center text-amber-400 font-bold">
                <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                {movie.rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* ACTION BUTTONS: ONLY PLAY & STREAM */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center space-x-3">
              {/* 1. PLAY BUTTON */}
              <button
                onClick={() => onPlay(movie)}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#FF4154] to-[#E50914] text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-red-900/40 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play</span>
              </button>

              {/* 2. STREAM BUTTON */}
              <button
                onClick={() => {
                  setShowServerPicker(!showServerPicker);
                }}
                className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-all"
              >
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Stream</span>
              </button>

              {/* My List Toggle */}
              <button
                onClick={() => onToggleList(movie)}
                className={`p-3.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
                  isInList
                    ? 'bg-white/20 border-white/40 text-emerald-400'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
                title="Add to My List"
              >
                {isInList ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5" />}
              </button>

              {/* Download */}
              <button
                onClick={() => onDownload(movie)}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95 flex items-center justify-center"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>

            {/* Stream Server Picker Drawer when user clicks Stream */}
            {showServerPicker && (
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between text-xs text-white/60 px-1 font-semibold">
                  <span>Select High-Speed Streaming Mirror:</span>
                  <span className="text-emerald-400">All Servers Online</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {sources.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowServerPicker(false);
                        onPlay({ ...movie, videoUrl: src.url });
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-red-600/20 border border-white/10 text-left text-xs font-semibold text-white flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <Server className="w-3.5 h-3.5 text-red-500" />
                        <span>{src.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                        {src.type === 'video' ? 'Direct 4K' : 'Fast Mirror'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed pt-1">
            {movie.description}
          </p>

          {/* Metadata */}
          <div className="text-xs text-white/60 space-y-1.5 pt-2 border-t border-white/10">
            <div><span className="text-white/40">Genre:</span> {movie.genre}</div>
            <div className="flex items-center space-x-1.5 text-white/80 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>Full HD / 4K Ultra Quality • Instant Playback</span>
            </div>
            {movie.cast && <div><span className="text-white/40">Cast:</span> {movie.cast.join(', ')}</div>}
            {movie.director && <div><span className="text-white/40">Director:</span> {movie.director}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
