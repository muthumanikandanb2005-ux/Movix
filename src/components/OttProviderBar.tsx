import React from 'react';
import { OttPlatform } from '../types';

interface OttProviderBarProps {
  selectedOtt: OttPlatform | 'All';
  onSelectOtt: (platform: OttPlatform | 'All') => void;
}

interface ProviderMeta {
  name: OttPlatform | 'All';
  label: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  logo: string;
}

const PROVIDERS: ProviderMeta[] = [
  {
    name: 'All',
    label: 'All OTT',
    badgeBg: 'bg-white/10',
    badgeBorder: 'border-white/20',
    textColor: 'text-white',
    logo: '🎬'
  },
  {
    name: 'Netflix',
    label: 'Netflix',
    badgeBg: 'bg-[#E50914]/15',
    badgeBorder: 'border-[#E50914]/40',
    textColor: 'text-[#E50914]',
    logo: '🔴'
  },
  {
    name: 'Prime Video',
    label: 'Prime Video',
    badgeBg: 'bg-[#00A8E1]/15',
    badgeBorder: 'border-[#00A8E1]/40',
    textColor: 'text-[#00A8E1]',
    logo: '🔵'
  },
  {
    name: 'JioHotstar',
    label: 'JioHotstar',
    badgeBg: 'bg-[#0F1014]',
    badgeBorder: 'border-[#1C4382]',
    textColor: 'text-[#3E7FFF]',
    logo: '⭐'
  },
  {
    name: 'Lionsgate',
    label: 'Lionsgate Play',
    badgeBg: 'bg-[#18150D]',
    badgeBorder: 'border-[#C69214]/40',
    textColor: 'text-[#F5B82E]',
    logo: '🦁'
  },
  {
    name: 'SonyLIV',
    label: 'Sony LIV',
    badgeBg: 'bg-[#0D1C28]',
    badgeBorder: 'border-[#0084FF]/40',
    textColor: 'text-[#00C0FF]',
    logo: '📺'
  },
  {
    name: 'Zee5',
    label: 'ZEE5',
    badgeBg: 'bg-[#1A0E2A]',
    badgeBorder: 'border-[#8224E3]/40',
    textColor: 'text-[#A855F7]',
    logo: '🟣'
  }
];

export const OttProviderBar: React.FC<OttProviderBarProps> = ({ selectedOtt, onSelectOtt }) => {
  return (
    <div className="w-full px-5 mb-5 select-none">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">
          Popular OTT Hubs
        </h3>
        {selectedOtt !== 'All' && (
          <button
            onClick={() => onSelectOtt('All')}
            className="text-[11px] text-[#E50914] hover:underline font-semibold"
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>

      <div className="flex space-x-2.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-5 px-5">
        {PROVIDERS.map((p) => {
          const isSelected = selectedOtt === p.name;
          return (
            <button
              key={p.name}
              onClick={() => onSelectOtt(p.name)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border active:scale-95 flex-shrink-0 shadow-sm ${
                isSelected
                  ? 'bg-gradient-to-r from-[#E50914] to-[#FF4154] text-white border-transparent shadow-lg shadow-red-900/40 ring-2 ring-red-500/50'
                  : `${p.badgeBg} ${p.badgeBorder} ${p.textColor} hover:brightness-125`
              }`}
            >
              <span className="text-sm">{p.logo}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
