import React, { useState, useEffect } from 'react';
import { 
  X, Globe, Sliders, Check, Zap, Server, Trash2, 
  Sparkles, CheckCircle2, RefreshCw, Download, ArrowUpCircle, ShieldCheck 
} from 'lucide-react';
import { VideoQuality, AudioLanguage } from '../types';
import { checkForAppUpdates, triggerApkInstall, getCurrentAppVersion, AppUpdateInfo, DEFAULT_UPDATE_INFO } from '../services/otaUpdates';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: AudioLanguage;
  onLanguageChange: (lang: AudioLanguage) => void;
  currentQuality: VideoQuality;
  onQualityChange: (qual: VideoQuality) => void;
  onClearCache?: () => void;
}

const LANGUAGES: { id: AudioLanguage; label: string; native: string; flag: string }[] = [
  { id: 'Hindi', label: 'Hindi', native: 'हिंदी (5.1 Dolby)', flag: '🇮🇳' },
  { id: 'Tamil', label: 'Tamil', native: 'தமிழ் (Dub / Original)', flag: '🇮🇳' },
  { id: 'Telugu', label: 'Telugu', native: 'తెలుగు (Dub / Original)', flag: '🇮🇳' },
  { id: 'Malayalam', label: 'Malayalam', native: 'മലയാളം (Original)', flag: '🇮🇳' },
  { id: 'Kannada', label: 'Kannada', native: 'ಕನ್ನಡ (Dub)', flag: '🇮🇳' },
  { id: 'English', label: 'English', native: 'English (Original 5.1)', flag: '🇬🇧' },
  { id: 'Spanish', label: 'Spanish', native: 'Español (Castilian)', flag: '🇪🇸' }
];

const QUALITIES: { id: VideoQuality; label: string; desc: string; badge: string }[] = [
  { id: '4K', label: '4K Ultra HD', desc: 'Highest resolution, Dolby Atmos', badge: '2160p' },
  { id: '1080p', label: '1080p Full HD', desc: 'Recommended balance of speed & clarity', badge: '1080p' },
  { id: '720p', label: '720p HD', desc: 'Fast buffering on slower networks', badge: '720p' },
  { id: '480p', label: '480p Data Saver', desc: 'Instant playback, lowest data usage', badge: '480p' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onLanguageChange,
  currentQuality,
  onQualityChange,
  onClearCache
}) => {
  const [activeTab, setActiveTab] = useState<'language' | 'playback' | 'general'>('language');
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true);
  const [fastBuffer, setFastBuffer] = useState(true);
  const [cacheClearedToast, setCacheClearedToast] = useState(false);
  
  // In-app hidden OTA updates state
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(DEFAULT_UPDATE_INFO);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(`Movix v${DEFAULT_UPDATE_INFO.versionName} OTA update is ready`);
  const currentApp = getCurrentAppVersion();

  const handleCheckUpdates = async (force = false) => {
    setIsCheckingUpdate(true);
    setUpdateStatus('Checking GitHub repository for updates...');
    try {
      const res = await checkForAppUpdates(force);
      if (res) {
        setUpdateInfo(res);
        setUpdateStatus(`✨ Version v${res.versionName} is ready to install!`);
      } else {
        setUpdateInfo(DEFAULT_UPDATE_INFO);
        setUpdateStatus(`Latest version v${DEFAULT_UPDATE_INFO.versionName} ready to download.`);
      }
    } catch {
      setUpdateInfo(DEFAULT_UPDATE_INFO);
      setUpdateStatus(`Using Direct In-App OTA v${DEFAULT_UPDATE_INFO.versionName}.`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  useEffect(() => {
    // Silent background check on modal open
    handleCheckUpdates(false);
  }, []);

  useEffect(() => {
    const savedHw = localStorage.getItem('movix_setting_hw_accel');
    if (savedHw !== null) setHardwareAcceleration(savedHw === 'true');
    const savedFb = localStorage.getItem('movix_setting_fast_buffer');
    if (savedFb !== null) setFastBuffer(savedFb === 'true');
  }, []);

  if (!isOpen) return null;

  const handleToggleHw = () => {
    const newVal = !hardwareAcceleration;
    setHardwareAcceleration(newVal);
    localStorage.setItem('movix_setting_hw_accel', String(newVal));
  };

  const handleToggleFastBuffer = () => {
    const newVal = !fastBuffer;
    setFastBuffer(newVal);
    localStorage.setItem('movix_setting_fast_buffer', String(newVal));
  };

  const handleClearAppCache = () => {
    try {
      localStorage.removeItem('movix_resume_list');
      sessionStorage.clear();
      if (onClearCache) onClearCache();
      setCacheClearedToast(true);
      setTimeout(() => setCacheClearedToast(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-[#0F131D] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden pb-safe text-white"
      >
        {/* Header Bar */}
        <div className="px-5 pt-5 pb-3 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E50914]/20 border border-[#E50914]/30 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-[#E50914]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Movix Settings</h2>
              <p className="text-[11px] text-white/50">Language, Quality & Smooth Playback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.08] px-5 pt-2 bg-black/20">
          <button
            onClick={() => setActiveTab('language')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'language' ? 'text-[#E50914]' : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Language</span>
            </span>
            {activeTab === 'language' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('playback')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'playback' ? 'text-[#E50914]' : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Smooth Playback</span>
            </span>
            {activeTab === 'playback' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'general' ? 'text-[#E50914]' : 'text-white/60 hover:text-white'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5" />
              <span>General</span>
            </span>
            {activeTab === 'general' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. LANGUAGE SETTINGS */}
          {activeTab === 'language' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
                  Default Audio Language
                </h3>
                <p className="text-[11px] text-white/70 mb-3">
                  Movies will automatically play with your preferred audio stream whenever available.
                </p>

                <div className="space-y-2">
                  {LANGUAGES.map((lang) => {
                    const isSelected = currentLanguage === lang.id;
                    return (
                      <button
                        key={lang.id}
                        onClick={() => {
                          onLanguageChange(lang.id);
                          localStorage.setItem('movix_pref_language', lang.id);
                        }}
                        className={`w-full py-2.5 px-3.5 rounded-2xl flex items-center justify-between border transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#E50914]/20 to-[#FF4154]/10 border-[#E50914] text-white shadow-lg shadow-red-950/20'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] text-white/80'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{lang.flag}</span>
                          <div className="text-left">
                            <span className="text-xs font-bold block">{lang.label}</span>
                            <span className="text-[10px] text-white/50">{lang.native}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-[#E50914] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. SMOOTH PLAYBACK SETTINGS */}
          {activeTab === 'playback' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">
                  Default Video Quality
                </h3>
                <p className="text-[11px] text-white/70 mb-3">
                  Preferred streaming resolution. Auto-adjusts for zero buffering.
                </p>

                <div className="space-y-2">
                  {QUALITIES.map((q) => {
                    const isSelected = currentQuality === q.id;
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          onQualityChange(q.id);
                          localStorage.setItem('movix_pref_quality', q.id);
                        }}
                        className={`w-full py-2.5 px-3.5 rounded-2xl flex items-center justify-between border transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#E50914]/20 to-[#FF4154]/10 border-[#E50914] text-white shadow-lg shadow-red-950/20'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] text-white/80'
                        }`}
                      >
                        <div className="text-left">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold">{q.label}</span>
                            <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] font-mono text-white/80">
                              {q.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-white/50">{q.desc}</span>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-[#E50914] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggles for Smooth Playback */}
              <div className="pt-2 border-t border-white/[0.08] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">
                  Performance & Smoothness
                </h3>

                {/* Hardware Acceleration Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="pr-3">
                    <span className="text-xs font-bold block text-white">Hardware GPU Acceleration</span>
                    <span className="text-[10px] text-white/50">60 FPS smooth video decoding & rendering</span>
                  </div>
                  <button
                    onClick={handleToggleHw}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                      hardwareAcceleration ? 'bg-[#E50914]' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      hardwareAcceleration ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Fast Buffer Mode Toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="pr-3">
                    <span className="text-xs font-bold block text-white">Instant Fast Buffer</span>
                    <span className="text-[10px] text-white/50">Pre-connects top global streaming CDNs</span>
                  </div>
                  <button
                    onClick={handleToggleFastBuffer}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                      fastBuffer ? 'bg-[#E50914]' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      fastBuffer ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* App Info Box */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center space-x-3">
                <img 
                  src="/assets/movix_3d_logo.png" 
                  alt="Movix" 
                  className="w-10 h-10 object-contain flex-shrink-0" 
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-bold text-xs">MOVIX Cinema App</span>
                    <span className="px-1.5 py-0.2 rounded bg-red-600/30 text-red-400 text-[9px] font-bold">
                      v{currentApp.versionName}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50">Build {currentApp.versionCode} • GitHub OTA Ready</p>
                </div>
              </div>

              {/* In-App Hidden OTA Updates Section */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ArrowUpCircle className="w-4 h-4 text-[#E50914]" />
                    <span className="text-xs font-bold text-white">System OTA Updates</span>
                  </div>
                  <button
                    onClick={() => handleCheckUpdates(true)}
                    disabled={isCheckingUpdate}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] font-bold text-white/90 flex items-center space-x-1 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdate ? 'Checking...' : 'Check Now'}</span>
                  </button>
                </div>

                {updateStatus && (
                  <p className="text-[10px] text-white/60">
                    {updateStatus}
                  </p>
                )}

                {updateInfo && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-black to-red-950/40 border border-red-500/30 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{updateInfo.title}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono">
                        v{updateInfo.versionName}
                      </span>
                    </div>

                    <ul className="text-[10px] text-white/70 space-y-1 pl-1">
                      {updateInfo.changelog.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <span className="text-red-500">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => triggerApkInstall(updateInfo.rawApkUrl || updateInfo.downloadUrl)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#E50914] to-[#FF4154] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-red-900/40 active:scale-95 transition-all mt-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download & Install APK Directly In App</span>
                    </button>
                  </div>
                )}
              </div>

              {/* VIP Status */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-red-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-amber-300 block">VIP 4K Cinema Active</span>
                    <span className="text-[10px] text-white/60">Unlimited ad-free high-speed streams</span>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>

              {/* Clear Cache Button */}
              <div className="pt-2">
                <button
                  onClick={handleClearAppCache}
                  className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-red-950/40 border border-white/10 hover:border-red-500/40 text-xs font-semibold text-white/80 hover:text-red-300 flex items-center justify-center space-x-2 transition-all active:scale-98"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Watch History & Stream Cache</span>
                </button>
                {cacheClearedToast && (
                  <p className="text-emerald-400 text-[11px] text-center mt-2 flex items-center justify-center space-x-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>Cache cleared successfully!</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between">
          <span className="text-[11px] text-white/40">Preferences saved automatically</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E50914] to-[#FF4154] text-white text-xs font-bold shadow-lg shadow-red-950/40 active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
