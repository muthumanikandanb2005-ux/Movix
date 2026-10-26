import React from 'react';
import { Play, Plus, Check, Server } from 'lucide-react';
import { Movie } from '../types';

interface HeroProps {
  movie: Movie;
  isInList: boolean;
  onPlay: (movie: Movie) => void;
  onToggleList: (movie: Movie) => void;
}

export const Hero: React.FC<HeroProps> = ({ movie, isInList, onPlay, onToggleList }) => {
  return (
    <div className="relative w-full min-h-[580px] sm:min-h-[640px] flex flex-col justify-end pb-8 overflow-hidden">
      {/* Background Hero Artwork */}
      <div className="absolute inset-0 z-0">
        <img 
          src={movie.backdrop} 
          alt={movie.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/assets/hero_clean.png';
          }}
          className="w-full h-full object-cover object-top"
        />
        {/* Cinematic dark gradients to blend seamlessly */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0F] via-[#080A0F]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080A0F]/50 via-transparent to-[#080A0F]" />
      </div>

      {/* Hero Content Overlays */}
      <div className="relative z-10 px-5 max-w-lg mt-auto">
        {/* Badges */}
        <div className="flex items-center space-x-2 mb-2 flex-wrap gap-y-1">
          {movie.badge && (
            <div className="inline-flex items-center px-2.5 py-1 rounded-[6px] bg-[#E50914] text-white text-[11px] font-bold tracking-wider uppercase shadow-lg shadow-red-900/40">
              {movie.badge}
            </div>
          )}
          <div className="inline-flex items-center px-2.5 py-1 rounded-[6px] bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold tracking-wider uppercase shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            4K ULTRA HD
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-display leading-[1.05] drop-shadow-md mb-2">
          {movie.title}
        </h1>

        {/* Metadata Line */}
        <div className="flex items-center space-x-2 text-white/90 text-[13px] font-medium tracking-wide mb-3">
          <span>{movie.year}</span>
          <span className="text-white/40">•</span>
          <span>{movie.genre}</span>
          <span className="text-white/40">•</span>
          <span>{movie.duration}</span>
          <span className="text-white/40">•</span>
          <span className="flex items-center text-amber-400 font-semibold">
            ★ <span className="text-white ml-1">{movie.rating.toFixed(1)}</span>
          </span>
        </div>

        {/* Synopsis */}
        <p className="text-[13px] sm:text-sm text-white/80 line-clamp-3 leading-relaxed mb-6 font-normal">
          {movie.description}
        </p>

        {/* Action Buttons: ONLY PLAY, STREAM, & MY LIST */}
        <div className="flex items-center space-x-2.5">
          {/* Primary Play Button */}
          <button 
            onClick={() => onPlay(movie)}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-[#FF4154] hover:bg-[#E50914] text-white font-bold text-sm tracking-wide shadow-lg shadow-red-600/30 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>Play</span>
          </button>

          {/* Stream Option Button */}
          <button 
            onClick={() => onPlay(movie)}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm tracking-wide transition-all active:scale-95"
          >
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Stream</span>
          </button>

          {/* Secondary My List Button */}
          <button 
            onClick={() => onToggleList(movie)}
            className={`p-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-95 border backdrop-blur-md flex items-center justify-center ${
              isInList 
                ? 'bg-white/20 border-white/30 text-emerald-400' 
                : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
            }`}
            title="My List"
          >
            {isInList ? (
              <Check className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Plus className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
