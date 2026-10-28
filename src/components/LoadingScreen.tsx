import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onLoaded: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onLoaded, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
    return () => clearInterval(timer);
  }, [onLoaded]);

  return (
    <div className="fixed inset-0 z-50 bg-[#080A0F] flex flex-col items-center justify-center p-6 select-none">
      <div className="flex flex-col items-center max-w-xs w-full">
        {/* Glowing 3D Movix Logo */}
        <div className="relative mb-6">
          {/* Subtle red glow — no neon purple/pink */}
          <div className="absolute -inset-8 bg-[#E50914]/10 blur-3xl rounded-full animate-pulse" />
          
          <div className="relative w-28 h-28 flex items-center justify-center animate-bounce duration-1000">
            <img 
              src="/assets/movix_3d_logo.png" 
              alt="MOVIX"
              className="w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(229,9,20,0.4)]"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black tracking-wider text-white font-display mb-1 drop-shadow-md">
          MOVIX
        </h1>

        {/* Cinematic Progress Bar */}
        <div className="w-52 h-1 bg-white/10 rounded-full overflow-hidden my-3">
          <div 
            className="h-full bg-[#E50914] rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Tagline */}
        <span className="text-[10px] font-semibold tracking-widest uppercase text-white/50 font-mono">
          Loading Cinematic Universe...
        </span>
      </div>
    </div>
  );
};
