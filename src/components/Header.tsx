import React from 'react';
import { Search } from 'lucide-react';

interface HeaderProps {
  onSearchClick: () => void;
  onProfileClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchClick, onProfileClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 pt-3 pb-3 bg-gradient-to-b from-[#080A0F]/95 via-[#080A0F]/70 to-transparent backdrop-blur-[2px]">
      {/* Brand Logo with 3D M Icon */}
      <div className="flex items-center space-x-2.5 cursor-pointer select-none group">
        <div className="relative w-8 h-8 flex-shrink-0 drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]">
          <img 
            src="/assets/movix_3d_logo.png" 
            alt="Movix 3D Logo" 
            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
          />
        </div>
        <span className="text-[#E50914] text-2xl sm:text-3xl font-black tracking-tighter uppercase font-display drop-shadow-[0_2px_8px_rgba(229,9,20,0.5)]">
          MOVIX
        </span>
      </div>

      {/* Action Icons */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={onSearchClick}
          aria-label="Search"
          className="p-1.5 text-white/90 hover:text-white transition-transform active:scale-95"
        >
          <Search className="w-6 h-6 stroke-[2.2]" />
        </button>

        <button 
          onClick={onProfileClick}
          aria-label="User profile"
          className="relative rounded-full ring-2 ring-purple-500/40 hover:ring-[#E50914]/80 transition-all active:scale-95 overflow-hidden w-9 h-9 shadow-md shadow-purple-950/30"
        >
          <img 
            src="/assets/avatar.png" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </button>
      </div>
    </header>
  );
};
