import React from 'react';
import { X, Play, Plus, Check, Download, Share2, Star } from 'lucide-react';
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
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <img 
            src={movie.backdrop || movie.poster} 
            alt={movie.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#10131B] via-[#10131B]/40 to-transparent" />
          
          {/* Quick Play Floating Button */}
          <button
            onClick={() => onPlay(movie)}
            className="absolute bottom-4 left-5 w-12 h-12 rounded-full bg-[#E50914] text-white flex items-center justify-center shadow-lg shadow-red-950/60 active:scale-90 transition-transform"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-5 pt-2 pb-6 space-y-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight font-display">
              {movie.title}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-white/70 font-medium mt-1">
              <span className="text-emerald-400 font-bold">98% Match</span>
              <span>•</span>
              <span>{movie.year}</span>
              <span>•</span>
              <span className="px-1.5 py-0.2 rounded border border-white/30 text-[10px]">4K HDR</span>
              <span>•</span>
              <span>{movie.duration}</span>
              <span>•</span>
              <span className="flex items-center text-amber-400">
                <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                {movie.rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center space-x-3 pt-1">
            <button
              onClick={() => onPlay(movie)}
              className="flex-1 py-3 rounded-xl bg-[#FF4154] hover:bg-[#E50914] text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-red-900/40 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Play Now</span>
            </button>

            <button
              onClick={() => onToggleList(movie)}
              className={`p-3 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
                isInList
                  ? 'bg-white/20 border-white/40 text-emerald-400'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
              }`}
              title="Add to My List"
            >
              {isInList ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5" />}
            </button>

            <button
              onClick={() => onDownload(movie)}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95 flex items-center justify-center"
              title="Download Offline"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed pt-1">
            {movie.description}
          </p>

          {/* Details & Cast */}
          <div className="text-xs text-white/60 space-y-1 pt-2 border-t border-white/10">
            <div><span className="text-white/40">Genre:</span> {movie.genre}</div>
            {movie.cast && <div><span className="text-white/40">Cast:</span> {movie.cast.join(', ')}</div>}
            {movie.director && <div><span className="text-white/40">Director:</span> {movie.director}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
