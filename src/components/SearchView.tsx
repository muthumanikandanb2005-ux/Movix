import React, { useState } from 'react';
import { Search, X, Star } from 'lucide-react';
import { Movie } from '../types';

interface SearchViewProps {
  allMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ allMovies, onSelectMovie }) => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  const genres = ['All', 'Sci-Fi', 'Action', 'Mystery', 'Cyberpunk'];

  const filteredMovies = allMovies.filter((m) => {
    const matchesQuery = m.title.toLowerCase().includes(query.toLowerCase()) || 
                         m.description.toLowerCase().includes(query.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || m.genre.toLowerCase().includes(selectedGenre.toLowerCase());
    return matchesQuery && matchesGenre;
  });

  return (
    <div className="pt-20 px-5 pb-24 min-h-screen">
      <h1 className="text-2xl font-black text-white mb-4 tracking-tight font-display">
        Search & Discover
      </h1>

      {/* Search Input */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies, sci-fi, directors..."
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
      <div className="flex space-x-2 overflow-x-auto pb-3 mb-4 scrollbar-none no-scrollbar">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedGenre === g
                ? 'bg-[#E50914] text-white shadow-md shadow-red-900/40'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {filteredMovies.map((movie) => (
          <div
            key={movie.id}
            onClick={() => onSelectMovie(movie)}
            className="rounded-xl overflow-hidden bg-[#12151F] border border-white/[0.06] group cursor-pointer active:scale-95 transition-all shadow-md"
          >
            <div className="relative aspect-[2/3]">
              <img 
                src={movie.poster} 
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-amber-400 font-bold text-[10px] flex items-center">
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

      {filteredMovies.length === 0 && (
        <div className="text-center py-12 text-white/40 text-sm">
          No titles found matching "{query}"
        </div>
      )}
    </div>
  );
};
