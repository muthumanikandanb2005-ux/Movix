import React from 'react';
import { Play, Trash2, Bookmark } from 'lucide-react';
import { Movie } from '../types';

interface MyListViewProps {
  myList: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onRemove: (id: string) => void;
}

export const MyListView: React.FC<MyListViewProps> = ({ myList, onSelectMovie, onRemove }) => {
  return (
    <div className="pt-20 px-5 pb-24 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-white tracking-tight font-display">
          My List
        </h1>
        <span className="text-xs text-white/50">{myList.length} Titles</span>
      </div>

      {myList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {myList.map((m) => (
            <div
              key={m.id}
              className="rounded-xl overflow-hidden bg-[#12151F] border border-white/[0.06] group relative shadow-md"
            >
              <div 
                onClick={() => onSelectMovie(m)}
                className="relative aspect-[2/3] cursor-pointer"
              >
                <img src={m.poster} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(m.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/70 hover:text-red-400 backdrop-blur-md border border-white/10"
                  title="Remove from My List"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-2.5">
                <h3 className="text-xs font-bold text-white truncate">{m.title}</h3>
                <p className="text-[10px] text-white/50">{m.year} • {m.genre.split('/')[0]}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center text-white/40 space-y-3">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-sm font-medium">Your watchlist is empty.</p>
          <p className="text-xs text-white/30 max-w-xs">Tap "+ My List" on any movie or series to bookmark it here for later.</p>
        </div>
      )}
    </div>
  );
};
