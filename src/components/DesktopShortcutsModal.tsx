import React from 'react';
import { X, Keyboard, Monitor, Apple, Sparkles } from 'lucide-react';

interface DesktopShortcutsModalProps {
  onClose: () => void;
}

export const DesktopShortcutsModal: React.FC<DesktopShortcutsModalProps> = ({ onClose }) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent || navigator.platform);

  const shortcuts = [
    { key: 'Space / K', desc: 'Toggle Play / Pause Video' },
    { key: 'F', desc: 'Toggle Fullscreen Mode' },
    { key: 'T', desc: 'Toggle Theater Cinema Mode' },
    { key: 'M', desc: 'Mute / Unmute Audio' },
    { key: '← / J', desc: 'Rewind 10 Seconds' },
    { key: '→ / L', desc: 'Fast-Forward 10 Seconds' },
    { key: '↑ / ↓', desc: 'Volume Up / Down (10%)' },
    { key: 'A', desc: 'Open Audio Language Menu' },
    { key: 'S', desc: 'Open Stream Mirror Switcher' },
    { key: '0 - 9', desc: 'Seek to 0% - 90% of Movie' },
    { key: '?', desc: 'Toggle this Shortcuts Guide' },
    { key: 'Esc', desc: 'Exit Fullscreen / Theater / Close' }
  ];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-[#0E121D]/98 border border-white/20 p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-white"
      >
        {/* Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 bg-[#E50914]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all active:scale-90"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-[#E50914] flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-black tracking-tight font-display">
                Web Player Shortcuts
              </h3>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-white/80">
                {isMac ? <Apple className="w-3 h-3" /> : <Monitor className="w-3 h-3 text-cyan-400" />}
                <span>{isMac ? 'macOS' : 'Windows'}</span>
              </span>
            </div>
            <p className="text-xs text-white/60">
              Desktop Cinema hotkeys for seamless keyboard control
            </p>
          </div>
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto no-scrollbar pr-1 my-2">
          {shortcuts.map((sc, i) => (
            <div 
              key={i} 
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition-colors"
            >
              <span className="text-xs text-white/75">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded-lg bg-black/60 border border-white/20 text-xs font-mono font-bold text-amber-300 shadow-inner flex-shrink-0 ml-2">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Works across Chrome, Edge, Safari, Firefox</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all active:scale-95 text-xs"
          >
            Got It (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
