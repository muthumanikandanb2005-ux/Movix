import React, { useState } from 'react';
import { X, Play, Check } from 'lucide-react';
import { Movie, VideoQuality, AudioLanguage } from '../types';

interface QualitySelectionModalProps {
  movie: Movie;
  onClose: () => void;
  onConfirm: (movie: Movie, quality: VideoQuality, language: AudioLanguage) => void;
}

interface QualityOption {
  id: VideoQuality;
  title: string;
  badge: string;
  specs: string;
  bitrate: string;
  recommended?: boolean;
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    id: '4K',
    title: '4K Ultra HD',
    badge: '2160p',
    specs: 'HDR10+ • Dolby Atmos • Cinema Master',
    bitrate: 'Highest Quality'
  },
  {
    id: '1080p',
    title: '1080p Full HD',
    badge: '1080p',
    specs: 'Crystal Clear • 60 FPS • Blu-Ray Audio',
    bitrate: 'Recommended',
    recommended: true
  },
  {
    id: '720p',
    title: '720p High Def',
    badge: '720p',
    specs: 'Fast Buffer • Data Saver • Smooth Play',
    bitrate: 'Fast Stream'
  },
  {
    id: '480p',
    title: '480p Standard',
    badge: '480p',
    specs: 'Ultra Fast • Instant Start • Low Bandwidth',
    bitrate: 'Mobile Saver'
  }
];

const LANGUAGES: { id: AudioLanguage; label: string; icon: string }[] = [];


export const QualitySelectionModal: React.FC<QualitySelectionModalProps> = ({
  movie,
  onClose,
  onConfirm
}) => {
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('1080p');
  const defaultLang: AudioLanguage = (movie.availableLanguages && movie.availableLanguages[0]) || 'Hindi';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="w-full sm:max-w-md bg-[#111420] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 relative flex flex-col max-h-[92vh] overflow-y-auto pb-safe">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Preview */}
        <div className="flex items-center space-x-3.5 mb-4 pr-10">
          <div className="w-14 h-20 rounded-xl overflow-hidden bg-[#181d2a] flex-shrink-0 shadow-md">
            <img 
              src={movie.poster} 
              alt={movie.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <span className="text-[#E50914] text-[10px] font-bold uppercase tracking-wider block">
              Choose Resolution
            </span>
            <h3 className="text-white font-black text-base truncate leading-tight">
              {movie.title}
            </h3>
            <p className="text-white/50 text-xs mt-0.5">
              {movie.year} • {movie.genre.split('/')[0]} • {movie.duration}
            </p>
          </div>
        </div>

        {/* Quality Cards */}
        <div className="mb-4">
          <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-2 px-1">
            Streaming Resolution:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {QUALITY_OPTIONS.map((q) => {
              const isSelected = selectedQuality === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuality(q.id)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between active:scale-[0.98] ${
                    isSelected
                      ? 'bg-red-600/20 border-[#E50914] shadow-lg shadow-red-950/30 ring-1 ring-[#E50914]'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-white/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                      isSelected ? 'bg-[#E50914] text-white' : 'bg-white/10 text-white/70'
                    }`}>
                      {q.badge}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-bold text-sm">{q.title}</span>
                        {q.recommended && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                            Best
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-white/50 block">{q.specs}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-semibold text-white/40">{q.bitrate}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#E50914] bg-[#E50914]' : 'border-white/30'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Language Selection — REMOVED: language is selectable inside the player */}

        {/* Action Button: Start Playback */}
        <button
          onClick={() => onConfirm(movie, selectedQuality, defaultLang)}
          className="w-full py-3.5 rounded-2xl bg-[#E50914] hover:brightness-110 text-white font-black text-sm shadow-xl shadow-red-950/50 flex items-center justify-center space-x-2 transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Stream in {selectedQuality}</span>
        </button>
      </div>
    </div>
  );
};
