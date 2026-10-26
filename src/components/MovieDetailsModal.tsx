import React, { useState, useEffect } from 'react';
import { 
  X, Play, Plus, Check, Download, Star, Server, Sparkles, 
  Film, Info, Clapperboard, Share2, Calendar, DollarSign, Building2, User 
} from 'lucide-react';
import { Movie, CastMember } from '../types';
import { fetchFullMovieDetails } from '../services/tmdb';

interface MovieDetailsModalProps {
  movie: Movie;
  isInList: boolean;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  onToggleList: (movie: Movie) => void;
  onDownload: (movie: Movie) => void;
  onSelectSimilar?: (movie: Movie) => void;
}

type TabKey = 'overview' | 'details' | 'trailer';

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  isInList,
  onClose,
  onPlay,
  onToggleList,
  onDownload,
  onSelectSimilar
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [showServerPicker, setShowServerPicker] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Extended TMDB Details (Cast, Trailer, Production, Similar)
  const [extendedData, setExtendedData] = useState<{
    runtime?: number;
    budget?: number;
    revenue?: number;
    status?: string;
    releaseDate?: string;
    productionCompanies?: string[];
    trailerKey?: string;
    castMembers?: CastMember[];
    director?: string;
    similar?: Movie[];
  }>({});

  useEffect(() => {
    let isMounted = true;
    if (movie.tmdbId) {
      setLoadingDetails(true);
      fetchFullMovieDetails(movie.tmdbId).then((data) => {
        if (isMounted) {
          setExtendedData(data);
          setLoadingDetails(false);
        }
      }).catch(() => {
        if (isMounted) setLoadingDetails(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [movie.tmdbId]);

  const sources = movie.streamSources || [
    { name: 'Server 1 (PvrPlay VIP Core - Fast Stream)', url: `https://embed.reelsdownload.online/player/${movie.tmdbId}?key=k_bf0ab0853bce46e3d90b256b&close=1`, type: 'embed' },
    { name: 'Server 2 (MultiEmbed 4K Stream)', url: `https://multiembed.mov/?video_id=${movie.tmdbId}&tmdb=1`, type: 'embed' },
    { name: 'Server 3 (AutoEmbed VIP Stream)', url: `https://player.autoembed.cc/embed/movie/${movie.tmdbId}`, type: 'embed' },
    { name: 'Server 4 (VidSrc Pro Mirror)', url: `https://vidsrc.cc/v2/embed/movie/${movie.tmdbId}`, type: 'embed' },
    { name: 'Server 5 (Direct High-Speed CDN 4K)', url: movie.videoUrl || '', type: 'video' }
  ];

  const formatCurrency = (val?: number) => {
    if (!val || val <= 0) return 'Undisclosed';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const trailerKey = extendedData.trailerKey || movie.trailerKey;
  const castList = extendedData.castMembers || (movie.cast ? movie.cast.map(name => ({ name, character: 'Cast' })) : []);
  const directorName = extendedData.director || movie.director;
  const similarMovies = extendedData.similar || [];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: `Watch ${movie.title} in 4K HDR on Movix!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-[#0E1118] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl relative flex flex-col pb-safe no-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 hover:bg-black/95 text-white transition-all backdrop-blur-md border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-[#141824]">
          <img 
            src={movie.backdrop || movie.poster} 
            alt={movie.title}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/assets/hero_clean.png';
            }}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1118] via-[#0E1118]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E1118]/80 via-transparent to-transparent" />
          
          {/* Quick Play Floating Hero Button */}
          <button
            onClick={() => onPlay(movie)}
            className="absolute bottom-4 left-5 w-12 h-12 rounded-full bg-gradient-to-tr from-[#E50914] to-[#FF4154] text-white flex items-center justify-center shadow-lg shadow-red-950/70 active:scale-90 transition-transform"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>

          {/* Quality Badge */}
          <div className="absolute top-4 left-5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-lg bg-black/70 border border-white/20 text-white backdrop-blur-md flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>4K ULTRA HD • PVRPLAY CORE</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-5 pt-3 pb-8 space-y-5">
          {/* Title & Metadata Strip */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
              {movie.title}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-white/70 font-medium mt-1.5 flex-wrap gap-y-1">
              <span className="text-emerald-400 font-bold">98% Match</span>
              <span>•</span>
              <span>{movie.year}</span>
              <span>•</span>
              <span className="px-1.5 py-0.5 rounded border border-white/30 text-[10px] font-bold">4K UHD</span>
              <span>•</span>
              <span>{extendedData.runtime ? `${Math.floor(extendedData.runtime / 60)}h ${extendedData.runtime % 60}m` : movie.duration}</span>
              <span>•</span>
              <span className="flex items-center text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                {movie.rating.toFixed(1)}
              </span>
              <span>•</span>
              <span className="text-white/60">{movie.genre}</span>
            </div>
          </div>

          {/* Action Row: Watch Now & Stream Server Picker */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              {/* 1. WATCH NOW BUTTON (Primary) */}
              <button
                onClick={() => onPlay(movie)}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#FF4154] to-[#E50914] hover:from-[#ff5565] hover:to-[#f0101b] text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-red-900/40 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Now</span>
              </button>

              {/* 2. STREAM BUTTON (Server Switcher) */}
              <button
                onClick={() => setShowServerPicker(!showServerPicker)}
                className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-all"
              >
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Stream Servers</span>
              </button>

              {/* My List Toggle */}
              <button
                onClick={() => onToggleList(movie)}
                className={`p-3.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
                  isInList
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
                title="Add to My List"
              >
                {isInList ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5" />}
              </button>

              {/* Download */}
              <button
                onClick={() => onDownload(movie)}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95 flex items-center justify-center"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all active:scale-95 flex items-center justify-center"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Stream Server Picker Drawer */}
            {showServerPicker && (
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/15 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between text-xs text-white/60 px-1 font-semibold">
                  <span>Select High-Speed Streaming Mirror:</span>
                  <span className="text-emerald-400 font-bold">5 Servers Online</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {sources.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowServerPicker(false);
                        onPlay({ ...movie, videoUrl: src.url });
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-red-600/20 border border-white/10 text-left text-xs font-semibold text-white flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <Server className="w-3.5 h-3.5 text-red-500" />
                        <span>{src.name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
                        {i === 0 ? 'PVR VIP' : 'Fast Mirror'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3-TAB NAVIGATION BAR (MATCHING PVRPLAY) */}
          <div className="border-b border-white/10">
            <div className="flex space-x-6 text-sm font-bold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
                  activeTab === 'overview'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('details')}
                className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
                  activeTab === 'details'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Details</span>
              </button>

              <button
                onClick={() => setActiveTab('trailer')}
                className={`pb-3 flex items-center space-x-2 border-b-2 transition-all ${
                  activeTab === 'trailer'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Clapperboard className="w-4 h-4" />
                <span>Trailer</span>
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                {movie.description}
              </p>

              {directorName && (
                <div className="flex items-center space-x-2 text-xs text-white/70">
                  <span className="text-white/40 font-semibold">Director:</span>
                  <span className="text-white font-bold">{directorName}</span>
                </div>
              )}

              {/* Cast Carousel */}
              {castList.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">Top Cast</h4>
                  <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
                    {castList.map((actor, idx) => (
                      <div key={idx} className="flex-shrink-0 w-20 text-center space-y-1.5">
                        <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-white/10 border border-white/15 shadow-md flex items-center justify-center">
                          {actor.photo ? (
                            <img
                              src={actor.photo}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <User className="w-6 h-6 text-white/40" />
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-white truncate">{actor.name}</p>
                        <p className="text-[10px] text-white/50 truncate">{actor.character}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-3.5 text-xs text-white/80 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                <div className="space-y-1">
                  <span className="text-white/40 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-red-400" />
                    <span>Release Date</span>
                  </span>
                  <p className="font-bold text-white">{extendedData.releaseDate || movie.year}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-white/40 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Status</span>
                  </span>
                  <p className="font-bold text-emerald-400">{extendedData.status || 'Released'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-white/40 flex items-center space-x-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Budget</span>
                  </span>
                  <p className="font-bold text-white">{formatCurrency(extendedData.budget)}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-white/40 flex items-center space-x-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Box Office Revenue</span>
                  </span>
                  <p className="font-bold text-white">{formatCurrency(extendedData.revenue)}</p>
                </div>
              </div>

              {extendedData.productionCompanies && extendedData.productionCompanies.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="text-white/40 flex items-center space-x-1 text-xs">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Production Studios</span>
                  </span>
                  <p className="text-white font-medium text-xs leading-relaxed">
                    {extendedData.productionCompanies.join(' • ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRAILER (LIVE YOUTUBE EMBED) */}
          {activeTab === 'trailer' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {trailerKey ? (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&playsinline=1&rel=0`}
                    title={`${movie.title} Official Trailer`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="py-12 text-center text-white/50 text-xs">
                  <Clapperboard className="w-8 h-8 mx-auto mb-2 text-white/30" />
                  <p>Official 4K Trailer will be loaded upon stream startup.</p>
                </div>
              )}
            </div>
          )}

          {/* "MORE LIKE THIS" / RELATED MOVIES CAROUSEL */}
          {similarMovies.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60">More Like This</h4>
              <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
                {similarMovies.map((sim) => (
                  <div
                    key={sim.id}
                    onClick={() => {
                      if (onSelectSimilar) {
                        onSelectSimilar(sim);
                      } else {
                        onPlay(sim);
                      }
                    }}
                    className="flex-shrink-0 w-28 group cursor-pointer space-y-1.5"
                  >
                    <div className="aspect-[2/3] w-full rounded-xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-red-500/50 transition-all shadow-md">
                      <img
                        src={sim.poster}
                        alt={sim.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/assets/poster_silent_deep.png';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-[11px] font-bold text-white truncate group-hover:text-red-400 transition-colors">
                      {sim.title}
                    </p>
                    <p className="text-[10px] text-white/50">{sim.year} • ★ {sim.rating.toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
