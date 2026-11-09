import React, { useState } from 'react';
import { Download, Sparkles, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { AppUpdateInfo, triggerApkInstall } from '../services/otaUpdates';

interface OtaUpdateModalProps {
  update: AppUpdateInfo;
  onClose: () => void;
}

export const OtaUpdateModal: React.FC<OtaUpdateModalProps> = ({ update, onClose }) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);

  const handleInstall = () => {
    setIsInstalling(true);
    setInstallProgress(15);

    const interval = setInterval(() => {
      setInstallProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setInstallProgress(100);
      triggerApkInstall(update.downloadUrl);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-3xl bg-[#0E1118] border border-white/15 p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#E50914]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all active:scale-90"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Logo & Radar Badge */}
        <div className="flex flex-col items-center text-center mt-1 mb-4">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1E2332] to-[#121622] border border-white/15 flex items-center justify-center shadow-xl">
              <img 
                src="/assets/movix_3d_logo.png" 
                alt="Movix" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#E50914]" />
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3 h-3" />
            <span>Direct In-App OTA Update</span>
          </div>

          <h3 className="text-xl font-black text-white tracking-tight font-display">
            Movix v{update.versionName} is Ready!
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            Current: v{update.currentVersion} • Latest: v{update.versionName}
          </p>
        </div>

        {/* What's New Box */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 mb-5 space-y-2">
          <span className="text-[11px] font-bold text-white/80 block uppercase tracking-wider">
            What's New in this Build:
          </span>
          <ul className="text-xs text-white/70 space-y-1.5">
            {(update.changelog || [
              'Ultra-Fast 500ms Movie Playback',
              'Direct Tap-to-Play Controls (Embed touch fixed)',
              'VIP 4K Rewarded Ad Booster Pass',
              'Auto-Refresh Sponsored Banners'
            ]).slice(0, 4).map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Progress bar if installing */}
        {isInstalling && (
          <div className="mb-4 space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] text-white/70 font-semibold">
              <span>{installProgress >= 100 ? 'Launching Installer...' : 'Downloading OTA Package...'}</span>
              <span className="text-emerald-400 font-mono">{installProgress}%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#E50914] to-emerald-400 h-full transition-all duration-200"
                style={{ width: `${installProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling && installProgress < 100}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#E50914] to-[#FF4154] hover:from-[#f0101b] hover:to-[#ff5565] text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-red-900/50 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isInstalling ? 'Opening Installer...' : 'Install Update Now (Direct)'}</span>
            {!isInstalling && <ArrowRight className="w-4 h-4 ml-1" />}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-white/50 hover:text-white text-xs font-semibold transition-colors"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
};
