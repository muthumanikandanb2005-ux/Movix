import React from 'react';
import { Download, Play, Trash2, HardDrive } from 'lucide-react';
import { Movie } from '../types';

interface DownloadsViewProps {
  downloads: Movie[];
  onPlay: (movie: Movie) => void;
  onRemoveDownload: (id: string) => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  downloads,
  onPlay,
  onRemoveDownload
}) => {
  return (
    <div className="pt-20 px-5 pb-24 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-white tracking-tight font-display">
          Downloads
        </h1>
        <span className="text-xs text-white/50">{downloads.length} Videos</span>
      </div>

      {/* Storage Bar */}
      <div className="p-3.5 rounded-xl bg-[#131620] border border-white/[0.06] mb-5">
        <div className="flex items-center justify-between text-xs text-white/70 mb-2">
          <div className="flex items-center space-x-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[#E50914]" />
            <span>Device Storage</span>
          </div>
          <span>1.8 GB / 64 GB</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#E50914] w-[18%] rounded-full" />
        </div>
      </div>

      {/* Downloads List */}
      {downloads.length > 0 ? (
        <div className="space-y-3">
          {downloads.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#12151E] border border-white/[0.06] group"
            >
              <div 
                onClick={() => onPlay(m)}
                className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
              >
                <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={m.poster} alt={m.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-4 h-4 fill-white text-white opacity-80 group-hover:opacity-100" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{m.title}</h4>
                  <p className="text-[11px] text-white/50">{m.duration} • 1080p Offline</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                    Downloaded
                  </span>
                </div>
              </div>

              <button
                onClick={() => onRemoveDownload(m.id)}
                className="p-2 text-white/40 hover:text-red-400 transition-colors"
                title="Delete Download"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center text-white/40 space-y-3">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Download className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-sm font-medium">No movies downloaded yet.</p>
          <p className="text-xs text-white/30 max-w-xs">Download movies to watch offline on flights or without internet access.</p>
        </div>
      )}
    </div>
  );
};
