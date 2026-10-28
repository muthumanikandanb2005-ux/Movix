import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Movie } from '../types';

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onSeeAll?: () => void;
  showRank?: boolean;
}

export const MovieCarousel: React.FC<MovieCarouselProps> = ({ 
  title, 
  movies, 
  onSelectMovie,
  onSeeAll,
  showRank = false
}) => {
  if (!movies || movies.length === 0) return null;

  return (
    <div className="w-full mb-7 px-5">
      {/* Carousel Header */}
      <div 
        onClick={onSeeAll}
        className="flex items-center justify-between mb-3.5 cursor-pointer group select-none"
      >
        <div className="flex items-center space-x-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-[#E50914] transition-colors">
            {title}
          </h2>
          <span className="text-[11px] font-semibold text-white/40 px-2 py-0.5 rounded-full bg-white/[0.06]">
            {movies.length}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
      </div>

      {/* Horizontal Scrolling Card Row */}
      <div className="flex space-x-3.5 overflow-x-auto pb-3 pt-1 scrollbar-none no-scrollbar -mx-5 px-5 snap-x snap-mandatory">
        {movies.map((movie, index) => (
          <div
            key={movie.id}
            onClick={() => onSelectMovie(movie)}
            className={`flex-shrink-0 aspect-[2/3] rounded-xl overflow-hidden relative cursor-pointer group bg-[#151922] transition-transform duration-200 active:scale-95 snap-start shadow-md hover:shadow-xl hover:shadow-red-950/20 border border-white/[0.04] ${showRank ? 'w-[100px] sm:w-[120px]' : 'w-[128px] sm:w-[150px]'}`}
          >
            {/* Poster Image */}
            <img 
              src={movie.poster} 
              alt={movie.title}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assets/poster_silent_deep.png';
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Netflix-style rank number */}
            {showRank && (
              <span
                className="absolute bottom-8 left-0 text-[72px] font-black leading-none select-none pointer-events-none"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '2px rgba(255,255,255,0.85)',
                  textShadow: '2px 4px 12px rgba(0,0,0,0.9)',
                  fontFamily: '"Arial Black", Impact, sans-serif'
                }}
              >
                {index + 1}
              </span>
            )}

            {/* Dark gradient overlay for card title legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-85 group-hover:opacity-100 transition-opacity" />
            
            {/* Quality badge on Top-Left */}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider bg-black/70 text-white shadow-md border border-white/20 backdrop-blur-md">
              4K UHD
            </div>

            {/* Rating badge on Top-Right */}
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold text-amber-400 border border-white/10">
              ★ {movie.rating.toFixed(1)}
            </div>

            {/* Bottom Details Overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex flex-col">
              {movie.badge && (
                <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider truncate mb-0.5">
                  {movie.badge}
                </span>
              )}
              <h4 className="text-white text-xs font-bold leading-tight line-clamp-1 group-hover:text-red-400 transition-colors">
                {movie.title}
              </h4>
              <span className="text-[10px] text-white/50 truncate">
                {movie.year} • {movie.genre.split('/')[0].trim()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
