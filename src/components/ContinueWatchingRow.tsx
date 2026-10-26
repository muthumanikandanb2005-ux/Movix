import React from 'react';
import { Play, X, Clock } from 'lucide-react';
import { ContinueWatchingItem, Movie } from '../types';
import { removeResumeProgress } from '../services/continueWatching';

interface ContinueWatchingRowProps {
  items: ContinueWatchingItem[];
  onResume: (item: ContinueWatchingItem) => void;
  onSelectMovie?: (movie: Movie) => void;
}

export const ContinueWatchingRow: React.FC<ContinueWatchingRowProps> = ({
  items,
  onResume
}) => {
  if (!items || items.length === 0) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}h ${remMins}m`;
    return `${mins}m`;
  };

  return (
    <div className="py-4 space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-2.5">
          <div className="w-1.5 h-5 bg-gradient-to-b from-[#FF4154] to-[#E50914] rounded-full shadow-sm shadow-red-500/50" />
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center space-x-2 font-display">
            <span>Continue Watching</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
              {items.length} In Progress
            </span>
          </h2>
        </div>
      </div>

      {/* Horizontal Scrolling Cards */}
      <div className="flex space-x-3.5 overflow-x-auto px-4 sm:px-6 pb-2 pt-1 no-scrollbar scroll-smooth">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-44 sm:w-56 group relative rounded-2xl overflow-hidden bg-[#141824] border border-white/10 hover:border-red-500/40 shadow-xl transition-all duration-300"
          >
            {/* Card Thumbnail Container */}
            <div 
              onClick={() => onResume(item)}
              className="relative aspect-video w-full overflow-hidden cursor-pointer"
            >
              <img
                src={item.backdrop || item.poster}
                alt={item.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = item.poster || '/assets/hero_clean.png';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* TV Episode badge if present */}
              {item.season && item.episode && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                  S{item.season} · E{item.episode}
                </div>
              )}

              {/* Dismiss / Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeResumeProgress(item.tmdbId);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white transition-all backdrop-blur-md"
                title="Remove from Continue Watching"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Center Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#E50914] to-[#FF4154] text-white flex items-center justify-center shadow-lg shadow-red-950/70 group-hover:scale-110 active:scale-95 transition-transform">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </div>
              </div>

              {/* Remaining Duration Label */}
              <div className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/90 flex items-center space-x-1 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                <Clock className="w-2.5 h-2.5 text-red-400" />
                <span>
                  {formatDuration(item.currentTime)} / {formatDuration(item.duration)}
                </span>
              </div>
            </div>

            {/* Progress Bar (Matching PvrPlay cw-progress) */}
            <div className="h-1.5 w-full bg-white/10 relative overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-r-full transition-all duration-300"
                style={{ width: `${item.progress}%` }}
              />
            </div>

            {/* Title & Resume Action */}
            <div className="p-2.5 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                  {item.title}
                </p>
                <p className="text-[10px] text-white/50 truncate">
                  Resume at {formatDuration(item.currentTime)}
                </p>
              </div>
              <button
                onClick={() => onResume(item)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-red-600/30 text-white text-[10px] font-bold border border-white/15 active:scale-95 transition-all flex-shrink-0"
              >
                Resume
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
