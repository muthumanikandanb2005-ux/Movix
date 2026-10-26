import React, { useState, useEffect } from 'react';
import { Search, X, Star, Film } from 'lucide-react';
import { Movie } from '../types';
import { searchMoviesFromTMDB } from '../services/tmdb';

interface SearchViewProps {
  allMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ allMovies, onSelectMovie }) => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [tmdbResults, setTmdbResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const genres = ['All', 'Sci-Fi', 'Action', 'Mystery', 'Cyberpunk', 'Horror', 'Drama'];

  // Debounced search on TMDB
  useEffect(() => {
    if (!query.trim()) {
      setTmdbResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchMoviesFromTMDB(query);
        setTmdbResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // If query is active, prioritize TMDB results, combined with local catalogue
  const displayMovies = query.trim()
    ? (tmdbResults.length > 0 ? tmdbResults : allMovies.filter((m) => 
        m.title.toLowerCase().includes(query.toLowerCase()) || 
        m.description.toLowerCase().includes(query.toLowerCase())
      ))
    : allMovies.filter((m) => selectedGenre === 'All' || m.genre.toLowerCase().includes(selectedGenre.toLowerCase()));

  return (
    <div className="pt-20 px-5 pb-24 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-white tracking-tight font-display">
          Search & Discover
        </h1>
        <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          ● TMDB Live Connected
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 10,000+ movies on TMDB & Movix..."
          className="w-full py-3.5 pl-11 pr-10 rounded-xl bg-[#141824] border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#E50914] transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/50 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Genre Pills */}
      {!query && (
        <div className="flex space-x-2 overflow-x-auto pb-3 mb-4 scrollbar-none no-scrollbar">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedGenre === g
                  ? 'bg-gradient-to-r from-[#E50914] to-[#FF4154] text-white shadow-md shadow-red-900/40'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Search status */}
      {isSearching && (
        <div className="flex items-center justify-center space-x-2 py-8 text-white/50 text-xs">
          <div className="w-4 h-4 rounded-full border-2 border-[#E50914] border-t-transparent animate-spin" />
          <span>Searching TMDB catalogue...</span>
        </div>
      )}

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {displayMovies.map((movie) => (
          <div
            key={movie.id}
            onClick={() => onSelectMovie(movie)}
            className="rounded-xl overflow-hidden bg-[#12151F] border border-white/[0.06] group cursor-pointer active:scale-95 transition-all shadow-md"
          >
            <div className="relative aspect-[2/3] bg-[#1a1f2c]">
              <img 
                src={movie.poster} 
                alt={movie.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-amber-400 font-bold text-[10px] flex items-center border border-white/10">
                <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" />
                {movie.rating}
              </div>
            </div>
            <div className="p-2.5">
              <h3 className="text-xs font-bold text-white truncate">{movie.title}</h3>
              <p className="text-[10px] text-white/50">{movie.year} • {movie.genre.split('/')[0]}</p>
            </div>
          </div>
        ))}
      </div>

      {!isSearching && displayMovies.length === 0 && (
        <div className="text-center py-16 text-white/40 text-sm">
          No titles found matching "{query}"
        </div>
      )}
    </div>
  );
};
