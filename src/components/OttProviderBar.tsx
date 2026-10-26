import React from 'react';

export type CategoryFilter = 
  | 'All' 
  | 'Indian' 
  | 'Hollywood' 
  | 'OTT Premieres' 
  | 'Action' 
  | 'Thriller' 
  | 'Romance' 
  | 'Sci-Fi';

interface CategoryBarProps {
  selectedCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
}

interface CategoryMeta {
  id: CategoryFilter;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'All', label: 'All Movies', icon: '🎬' },
  { id: 'Indian', label: 'Indian Cinema', icon: '🇮🇳' },
  { id: 'OTT Premieres', label: 'New Releases', icon: '🔥' },
  { id: 'Hollywood', label: 'Hollywood 4K', icon: '⭐' },
  { id: 'Action', label: 'Action & Thrill', icon: '💥' },
  { id: 'Thriller', label: 'Mystery & Crime', icon: '⚡' },
  { id: 'Romance', label: 'Romance & Drama', icon: '💖' },
  { id: 'Sci-Fi', label: 'Sci-Fi Universe', icon: '🚀' }
];

export const OttProviderBar: React.FC<CategoryBarProps> = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="w-full px-5 mb-5 select-none">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">
          Cinema Hubs
        </h3>
        {selectedCategory !== 'All' && (
          <button
            onClick={() => onSelectCategory('All')}
            className="text-[11px] text-[#E50914] hover:underline font-semibold"
          >
            Show All
          </button>
        )}
      </div>

      <div className="flex space-x-2.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-5 px-5">
        {CATEGORIES.map((c) => {
          const isSelected = selectedCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelectCategory(c.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border active:scale-95 flex-shrink-0 shadow-sm ${
                isSelected
                  ? 'bg-gradient-to-r from-[#E50914] to-[#FF4154] text-white border-transparent shadow-lg shadow-red-900/40 ring-2 ring-red-500/50'
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              <span className="text-sm">{c.icon}</span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
