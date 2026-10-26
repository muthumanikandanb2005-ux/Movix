import React from 'react';
import { Home, Search, Download, Plus } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  myListCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  onTabChange,
  myListCount 
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080A0F]/95 border-t border-white/[0.06] backdrop-blur-lg px-6 py-2 pb-safe select-none">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Home Tab */}
        <button
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center justify-center flex-1 py-1 group transition-colors"
        >
          <div className="relative">
            <Home className={`w-5 h-5 transition-colors ${
              activeTab === 'home' ? 'text-[#E50914] fill-[#E50914]' : 'text-white/50 group-hover:text-white/80'
            }`} />
          </div>
          <span className={`text-[10px] mt-1 font-medium tracking-tight ${
            activeTab === 'home' ? 'text-[#E50914] font-bold' : 'text-white/50 group-hover:text-white/80'
          }`}>
            Home
          </span>
          {activeTab === 'home' && (
            <div className="w-4 h-0.5 bg-[#E50914] rounded-full mt-0.5 shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
          )}
        </button>

        {/* Search Tab */}
        <button
          onClick={() => onTabChange('search')}
          className="flex flex-col items-center justify-center flex-1 py-1 group transition-colors"
        >
          <Search className={`w-5 h-5 transition-colors ${
            activeTab === 'search' ? 'text-[#E50914]' : 'text-white/50 group-hover:text-white/80'
          }`} />
          <span className={`text-[10px] mt-1 font-medium tracking-tight ${
            activeTab === 'search' ? 'text-[#E50914] font-bold' : 'text-white/50 group-hover:text-white/80'
          }`}>
            Search
          </span>
          {activeTab === 'search' && (
            <div className="w-4 h-0.5 bg-[#E50914] rounded-full mt-0.5 shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
          )}
        </button>

        {/* Downloads Tab */}
        <button
          onClick={() => onTabChange('downloads')}
          className="flex flex-col items-center justify-center flex-1 py-1 group transition-colors"
        >
          <Download className={`w-5 h-5 transition-colors ${
            activeTab === 'downloads' ? 'text-[#E50914]' : 'text-white/50 group-hover:text-white/80'
          }`} />
          <span className={`text-[10px] mt-1 font-medium tracking-tight ${
            activeTab === 'downloads' ? 'text-[#E50914] font-bold' : 'text-white/50 group-hover:text-white/80'
          }`}>
            Downloads
          </span>
          {activeTab === 'downloads' && (
            <div className="w-4 h-0.5 bg-[#E50914] rounded-full mt-0.5 shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
          )}
        </button>

        {/* My List Tab */}
        <button
          onClick={() => onTabChange('mylist')}
          className="flex flex-col items-center justify-center flex-1 py-1 group transition-colors"
        >
          <div className="relative">
            <Plus className={`w-5 h-5 transition-colors ${
              activeTab === 'mylist' ? 'text-[#E50914]' : 'text-white/50 group-hover:text-white/80'
            }`} />
            {myListCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-3.5 h-3.5 bg-[#E50914] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {myListCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 font-medium tracking-tight ${
            activeTab === 'mylist' ? 'text-[#E50914] font-bold' : 'text-white/50 group-hover:text-white/80'
          }`}>
            My List
          </span>
          {activeTab === 'mylist' && (
            <div className="w-4 h-0.5 bg-[#E50914] rounded-full mt-0.5 shadow-[0_0_8px_rgba(229,9,20,0.8)]" />
          )}
        </button>
      </div>
    </nav>
  );
};
