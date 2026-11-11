import React, { useRef } from 'react';
import { Search, Sparkles, Settings, Keyboard } from 'lucide-react';

interface HeaderProps {
  onSearchClick: () => void;
  onProfileClick: () => void;
  onSettingsClick?: () => void;
  onVipClick?: () => void;
  onOtaCheck?: () => void;
  onShortcutsClick?: () => void;
  hasUpdate?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSearchClick, 
  onProfileClick, 
  onSettingsClick,
  onVipClick,
  onOtaCheck,
  onShortcutsClick,
  hasUpdate
}) => {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoTap = () => {
    tapCountRef.current++;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (onOtaCheck) {
        onOtaCheck();
      } else if (onSettingsClick) {
        onSettingsClick();
      }
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 1500);
    }
  };
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between safe-header pb-3 bg-gradient-to-b from-[#080A0F]/98 via-[#080A0F]/85 to-transparent backdrop-blur-[3px]">
      {/* Brand Logo with 3D M Icon */}
      <div 
        onClick={handleLogoTap}
        className="flex items-center space-x-2.5 cursor-pointer select-none group"
        title="Movix Cinema (Tap 5x for Hidden Updates)"
      >
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

      {/* Action Icons & VIP Monetization Pill */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        <button
          onClick={onVipClick}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/40 text-amber-300 hover:border-amber-400 active:scale-95 transition-all text-[11px] font-bold shadow-sm"
          title="Watch Ad & Unlock VIP 4K"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>VIP 4K</span>
        </button>

        {/* Desktop Web Player Hotkeys Button (Windows & Mac) */}
        {onShortcutsClick && (
          <button
            onClick={onShortcutsClick}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95 transition-all text-[11px] font-bold shadow-sm"
            title="Desktop Web Player Hotkeys (?)"
          >
            <Keyboard className="w-3.5 h-3.5 text-amber-300" />
            <span>Hotkeys</span>
          </button>
        )}

        <button 
          onClick={onSearchClick}
          aria-label="Search"
          className="p-1.5 text-white/90 hover:text-white transition-transform active:scale-95"
          title="Search Movies"
        >
          <Search className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Settings Option with OTA Update indicator */}
        <button 
          onClick={onSettingsClick || onProfileClick}
          aria-label="Settings"
          className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95 transition-all shadow-sm"
          title="Settings (Audio Language, Resolution, Updates)"
        >
          <Settings className="w-4 h-4 text-white stroke-[2.2]" />
          <span className="text-[11px] font-bold">Settings</span>
          {hasUpdate && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E50914] text-[8px] font-black items-center justify-center text-white">!</span>
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
