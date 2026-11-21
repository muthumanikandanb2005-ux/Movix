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
    <nav style={{ transform: 'translateZ(0)' }} className="fixed bottom-0 left-0 right-0 z-40 bg-[#080A0F]/95 border-t border-white/[0.08] backdrop-blur-2xl px-6 pt-2 pb-2 safe-bottom select-none shadow-[0_-4px_24px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Home Tab */}
        <button
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center justify-center flex-1 py-1 group transition-all min-h-[44px] active:scale-95"
        >
          <div className="relative">
            <Home className={`w-5 h-5 transition-transform duration-150 ${
              activeTab === 'home' ? 'text-[#E50914] fill-[#E50914] scale-110' : 'text-white/50 group-hover:text-white/80'
            }`} />
          </div>
          <span className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
            activeTab === 'home' ? 'text-[#E50914]' : 'text-white/50 group-hover:text-white/80'
          }`}>
            Home
          </span>
          {activeTab === 'home' && (
            <div className="w-5 h-0.5 bg-[#E50914] rounded-full mt-0.5 shadow-[0_0_10px_rgba(229,9,20,0.9)]" />
          )}
        </button>

        {/* Search Tab */}
        <button
          onClick={() => onTabChange('search')}
          className="flex flex-col items-center justify-center flex-1 py-1 group transition-all min-h-[44px] active:scale-95"
        >
          <Search className={`w-5 h-5 transition-transform duration-150 ${
            activeTab === 'search' ? 'text-[#E50914] stroke-[2.5] scale-110' : 'text-white/50 group-hover:text-white/80'
          }`} />
          <span className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
            activeTab === 'search' ? 'text-[#E50914]' : 'text-white/50 group-hover:text-white/80'
          }`}>
            Search
          </span>
          {activeTab === 'search' && (
            <div className="w-5 h-0.5 bg-[#E50914] rounded-full mt-0.5 shadow-[0_0_10px_rgba(229,9,20,0.9)]" />
          )}
        </button>

        {/* Downloads Tab */}
        <button
          onClick={() => onTabChange('downloads')}
          className="flex flex-col items-center justify-center flex-1 py-1 group transition-all min-h-[44px] active:scale-95"
        >
          <Download className={`w-5 h-5 transition-transform duration-150 ${
            activeTab === 'downloads' ? 'text-[#E50914] stroke-[2.5] scale-110' : 'text-white/50 group-hover:text-white/80'
          }`} />
          <span className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
            activeTab === 'downloads' ? 'text-[#E50914]' : 'text-white/50 group-hover:text-white/80'
          }`}>
            Downloads
          </span>
          {activeTab === 'downloads' && (
            <div className="w-5 h-0.5 bg-[#E50914] rounded-full mt-0.5 shadow-[0_0_10px_rgba(229,9,20,0.9)]" />
          )}
        </button>

        {/* My List Tab */}
        <button
          onClick={() => onTabChange('mylist')}
          className="flex flex-col items-center justify-center flex-1 py-1 group transition-all min-h-[44px] active:scale-95"
        >
          <div className="relative">
            <Plus className={`w-5 h-5 transition-transform duration-150 ${
              activeTab === 'mylist' ? 'text-[#E50914] stroke-[3] scale-110' : 'text-white/50 group-hover:text-white/80'
            }`} />
            {myListCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-[#E50914] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md">
                {myListCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 font-bold tracking-tight transition-colors ${
            activeTab === 'mylist' ? 'text-[#E50914]' : 'text-white/50 group-hover:text-white/80'
          }`}>
            My List
          </span>
          {activeTab === 'mylist' && (
            <div className="w-5 h-0.5 bg-[#E50914] rounded-full mt-0.5 shadow-[0_0_10px_rgba(229,9,20,0.9)]" />
          )}
        </button>
      </div>
    </nav>
  );
};
