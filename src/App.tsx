import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MovieCarousel } from './components/MovieCarousel';
import { OttProviderBar, CategoryFilter } from './components/OttProviderBar';
import { BottomNav } from './components/BottomNav';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { QualitySelectionModal } from './components/QualitySelectionModal';
import { ContinueWatchingRow } from './components/ContinueWatchingRow';
import { AdMobBanner } from './components/AdMobBanner';
import { AdMobInterstitial } from './components/AdMobInterstitial';
import { LoadingScreen } from './components/LoadingScreen';
import { SearchView } from './components/SearchView';
import { DownloadsView } from './components/DownloadsView';
import { MyListView } from './components/MyListView';
import { SettingsModal } from './components/SettingsModal';
import {
  featuredIndianMovie,
  ottNewReleases,
  indianBlockbusters,
  hollywoodBlockbusters,
  romanceMovies,
  thrillerMovies,
  sciFiPicks,
  netflixTop10,
  netflixTrendingNow,
  netflixOriginals
} from './data/movies';
import {
  fetchTrendingFromTMDB,
  fetchIndianMoviesFromTMDB,
  fetchSouthIndianFromTMDB,
  fetchNowPlayingFromTMDB,
  fetchHollywoodFromTMDB,
  fetchRomanceFromTMDB,
  fetchThrillerFromTMDB,
  fetchActionFromTMDB,
  getQualityVideoUrl
} from './services/tmdb';
import { getContinueWatchingList } from './services/continueWatching';
import { Movie, TabType, VideoQuality, AudioLanguage, ContinueWatchingItem } from './types';

// Helper to remove duplicates by id
const dedupeMovies = (movies: Movie[]): Movie[] => {
  const seen = new Set<string>();
  return movies.filter((m) => {
    if (!m || !m.id || seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
};

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  
  // Continue Watching state (PvrPlay Signature Feature)
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);

  // Resolution & Language selection states (persisted with user preferences)
  const [qualityTargetMovie, setQualityTargetMovie] = useState<Movie | null>(null);
  const [activeQuality, setActiveQuality] = useState<VideoQuality>(() => {
    return (localStorage.getItem('movix_pref_quality') as VideoQuality) || '1080p';
  });
  const [activeLanguage, setActiveLanguage] = useState<AudioLanguage>(() => {
    return (localStorage.getItem('movix_pref_language') as AudioLanguage) || 'Hindi';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [interstitialTarget, setInterstitialTarget] = useState<Movie | null>(null);
  const [myList, setMyList] = useState<Movie[]>([featuredIndianMovie, ottNewReleases[0]]);
  const [downloads, setDownloads] = useState<Movie[]>([ottNewReleases[0]]);
  
  // Live TMDB Content states
  const [liveTrending, setLiveTrending] = useState<Movie[]>([]);
  const [liveNowPlaying, setLiveNowPlaying] = useState<Movie[]>([]);
  const [liveIndian, setLiveIndian] = useState<Movie[]>([]);
  const [liveSouthIndian, setLiveSouthIndian] = useState<Movie[]>([]);
  const [liveHollywood, setLiveHollywood] = useState<Movie[]>([]);
  const [liveRomance, setLiveRomance] = useState<Movie[]>([]);
  const [liveThriller, setLiveThriller] = useState<Movie[]>([]);
  const [liveAction, setLiveAction] = useState<Movie[]>([]);
  const [liveNetflix, setLiveNetflix] = useState<Movie[]>([]);
  const [liveNetflixOriginals, setLiveNetflixOriginals] = useState<Movie[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Subscribe to Continue Watching updates from localStorage & player
  useEffect(() => {
    const updateResumeList = () => {
      setContinueWatching(getContinueWatchingList());
    };
    updateResumeList();
    window.addEventListener('movix:resume_updated', updateResumeList);

    const handleRewarded = () => {
      showToast('🎉 VIP 4K Pass Activated for 24h! Enjoy ultra streaming.');
    };
    window.addEventListener('admob:rewarded', handleRewarded);

    return () => {
      window.removeEventListener('movix:resume_updated', updateResumeList);
      window.removeEventListener('admob:rewarded', handleRewarded);
    };
  }, []);

  // Ensure native AdMob banner is automatically hidden when ANY modal or player is open
  const isAnyModalOpen = Boolean(selectedMovie || playingMovie || isSettingsOpen || qualityTargetMovie || interstitialTarget);
  useEffect(() => {
    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob) {
      if (typeof androidAdMob.setModalOpen === 'function') {
        androidAdMob.setModalOpen(isAnyModalOpen);
      } else if (isAnyModalOpen && typeof androidAdMob.hideBannerAd === 'function') {
        androidAdMob.hideBannerAd();
      } else if (!isAnyModalOpen && typeof androidAdMob.showBannerAd === 'function') {
        androidAdMob.showBannerAd();
      }
    }
  }, [isAnyModalOpen]);

  const handleWatchAdVip = () => {
    const androidAdMob = (window as any).AndroidAdMob;
    if (androidAdMob && typeof androidAdMob.showRewardedAd === 'function') {
      androidAdMob.showRewardedAd();
      showToast('Loading VIP Pass sponsored ad...');
    } else if (androidAdMob && typeof androidAdMob.showInterstitialAd === 'function') {
      androidAdMob.showInterstitialAd();
      showToast('Loading sponsored video...');
    } else {
      showToast('💎 VIP 4K Pass Active! Unlimited ultra streaming.');
    }
  };

  useEffect(() => {
    const loadAllTmdbFeeds = async () => {
      try {
        const [trending, nowPlaying, indian, southIndian, hollywood, romance, thriller, action] = await Promise.all([
          fetchTrendingFromTMDB(),
          fetchNowPlayingFromTMDB(),
          fetchIndianMoviesFromTMDB(),
          fetchSouthIndianFromTMDB(),
          fetchHollywoodFromTMDB(),
          fetchRomanceFromTMDB(),
          fetchThrillerFromTMDB(),
          fetchActionFromTMDB()
        ]);
        if (trending?.length) setLiveTrending(trending);
        if (nowPlaying?.length) setLiveNowPlaying(nowPlaying);
        if (indian?.length) setLiveIndian(indian);
        if (southIndian?.length) setLiveSouthIndian(southIndian);
        if (hollywood?.length) setLiveHollywood(hollywood);
        if (romance?.length) setLiveRomance(romance);
        if (thriller?.length) setLiveThriller(thriller);
        if (action?.length) setLiveAction(action);
      } catch (e) {
        console.error('Error fetching TMDB feeds:', e);
      }
    };
    loadAllTmdbFeeds();
  }, []);

  // Combined movie pools (memoized to eliminate frame drops & jank)
  const top10Movies = useMemo(() => dedupeMovies([...netflixTop10, ...liveTrending]), [liveTrending]);
  const trendingNowMovies = useMemo(() => dedupeMovies([...netflixTrendingNow, ...liveNowPlaying]), [liveNowPlaying]);
  const netflixOriginalsMovies = useMemo(() => dedupeMovies([...netflixOriginals]), []);
  const combinedIndian = useMemo(() => dedupeMovies([...indianBlockbusters, ...liveIndian]), [liveIndian]);
  const combinedSouthIndian = useMemo(() => dedupeMovies(liveSouthIndian), [liveSouthIndian]);
  const combinedHollywood = useMemo(() => dedupeMovies([...hollywoodBlockbusters, ...liveHollywood]), [liveHollywood]);
  const combinedRomance = useMemo(() => dedupeMovies([...romanceMovies, ...liveRomance]), [liveRomance]);
  const combinedThriller = useMemo(() => dedupeMovies([...thrillerMovies, ...liveThriller]), [liveThriller]);
  const combinedAction = useMemo(() => dedupeMovies(liveAction), [liveAction]);
  const combinedNowPlaying = useMemo(() => dedupeMovies(liveNowPlaying), [liveNowPlaying]);

  // Global search catalogue (memoized)
  const allMovies = useMemo(() => dedupeMovies([
    featuredIndianMovie,
    ...ottNewReleases,
    ...combinedNowPlaying,
    ...combinedIndian,
    ...combinedSouthIndian,
    ...combinedHollywood,
    ...combinedRomance,
    ...combinedThriller,
    ...combinedAction,
    ...sciFiPicks,
    ...liveTrending
  ]), [combinedNowPlaying, combinedIndian, combinedSouthIndian, combinedHollywood, combinedRomance, combinedThriller, combinedAction, liveTrending]);

  // Movies filtered by selected category
  const getFilteredCategoryMovies = (): Movie[] => {
    switch (selectedCategory) {
      case 'Indian': return combinedIndian;
      case 'Hollywood': return combinedHollywood;
      case 'OTT Premieres': return ottNewReleases;
      case 'Action': return combinedAction;
      case 'Thriller': return combinedThriller;
      case 'Romance': return combinedRomance;
      case 'Sci-Fi': return sciFiPicks;
      default: return [];
    }
  };

  const filteredMovies = getFilteredCategoryMovies();

  const handleToggleList = useCallback((movie: Movie) => {
    if (myList.some((m) => m.id === movie.id)) {
      setMyList((prev) => prev.filter((m) => m.id !== movie.id));
      showToast(`Removed "${movie.title}" from My List`);
    } else {
      setMyList((prev) => [...prev, movie]);
      showToast(`Added "${movie.title}" to My List`);
    }
  }, [myList]);

  const handleDownload = useCallback((movie: Movie) => {
    if (!downloads.some((m) => m.id === movie.id)) {
      setDownloads((prev) => [...prev, movie]);
      showToast(`Downloading "${movie.title}" for offline playback...`);
    } else {
      showToast(`"${movie.title}" is already in Downloads`);
    }
  }, [downloads]);

  // 1. User taps Play or Stream -> Plays Sponsored Advertisement, then launches Player
  const handleRequestPlay = useCallback((movie: Movie) => {
    setInterstitialTarget(movie);
  }, []);

  // 2. User confirms Quality & Language -> Plays Sponsored Advertisement with chosen preferences
  const handleQualityConfirmed = useCallback((movie: Movie, quality: VideoQuality, language: AudioLanguage) => {
    setQualityTargetMovie(null);
    setActiveQuality(quality);
    setActiveLanguage(language);
    setInterstitialTarget(movie);
  }, []);

  // 3. Ad finishes/dismissed -> Launch Player
  const handleDismissAd = useCallback(() => {
    if (interstitialTarget) {
      setPlayingMovie(interstitialTarget);
      setInterstitialTarget(null);
    }
  }, [interstitialTarget]);

  // Stable movie selector callback for 60fps carousels
  const handleSelectMovie = useCallback((movie: Movie) => {
    setSelectedMovie(movie);
  }, []);

  const isHeroInList = useMemo(() => myList.some((m) => m.id === featuredIndianMovie.id), [myList]);

  // Resume movie from Continue Watching card
  const handleResumePlayback = (item: ContinueWatchingItem) => {
    const movieTarget: Movie = item.movie || {
      id: `tmdb-${item.tmdbId}`,
      tmdbId: item.tmdbId,
      title: item.title,
      year: 2026,
      genre: 'Cinema',
      duration: '2h 15m',
      rating: 8.5,
      description: 'Resuming your high-speed stream on Movix.',
      poster: item.poster,
      backdrop: item.backdrop || item.poster,
      videoUrl: getQualityVideoUrl(item.tmdbId, activeQuality)
    };
    handleRequestPlay(movieTarget);
  };

  if (loading) {
    return <LoadingScreen onLoaded={() => setLoading(false)} />;
  }

  return (
    <div className="relative min-h-screen bg-[#080A0F] text-white flex flex-col max-w-md sm:max-w-lg md:max-w-xl mx-auto shadow-2xl border-x border-white/[0.04]">
      {/* Top Header */}
      <Header
        onSearchClick={() => setActiveTab('search')}
        onProfileClick={() => setIsSettingsOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
        onVipClick={handleWatchAdVip}
      />

      {/* Main Tab Content */}
      <main className="flex-1 pb-28">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-300">
            {/* 1. Indian Movie in First Home Page Hero */}
            <Hero
              movie={featuredIndianMovie}
              isInList={isHeroInList}
              onPlay={handleRequestPlay}
              onToggleList={handleToggleList}
            />

            {/* 2. Cinema Hubs Bar */}
            <OttProviderBar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* 3. Continue Watching Row (PvrPlay Feature) */}
            <ContinueWatchingRow
              items={continueWatching}
              onResume={handleResumePlayback}
            />

            {/* When a Category Hub is selected */}
            {selectedCategory !== 'All' ? (
              <div className="px-5 mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-4 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                  <div>
                    <h2 className="text-base font-black text-white">
                      {selectedCategory} Collection
                    </h2>
                    <p className="text-xs text-white/50">
                      Showing {filteredMovies.length} 4K streaming titles
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                  >
                    View All
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {filteredMovies.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => setSelectedMovie(movie)}
                      className="rounded-xl overflow-hidden bg-[#12151F] border border-white/[0.06] group cursor-pointer active:scale-95 transition-all shadow-md"
                    >
                      <div className="relative aspect-[2/3] bg-[#1a1f2c]">
                        <img 
                          src={movie.poster} 
                          alt={movie.title}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/assets/poster_silent_deep.png';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase bg-black/70 text-white border border-white/20">
                          4K UHD
                        </div>
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-amber-400 font-bold text-[10px]">
                          ★ {movie.rating.toFixed(1)}
                        </div>
                      </div>

                      <div className="p-2.5">
                        <h4 className="text-xs font-bold text-white truncate">{movie.title}</h4>
                        <p className="text-[10px] text-white/50">{movie.year} • {movie.genre.split('/')[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* All Content Sections when 'All' is selected */
              <>
                {/* 1. Netflix Top 10 in India Today */}
                <MovieCarousel
                  title="Top 10 in India Today"
                  movies={top10Movies}
                  onSelectMovie={handleSelectMovie}
                  onSeeAll={() => setActiveTab('search')}
                  showRank
                />

                {/* 2. Trending Now */}
                <MovieCarousel
                  title="Trending Now"
                  movies={trendingNowMovies}
                  onSelectMovie={handleSelectMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* 3. New Releases & Premieres */}
                <MovieCarousel
                  title="New Releases"
                  movies={ottNewReleases}
                  onSelectMovie={handleSelectMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* AdMob Sponsored Card */}
                <AdMobBanner />

                {/* 4. Netflix Originals & Exclusives */}
                <MovieCarousel
                  title="Only on Netflix"
                  movies={netflixOriginalsMovies}
                  onSelectMovie={handleSelectMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* 5. Trending Indian Blockbusters */}
                <MovieCarousel
                  title="Indian Blockbusters"
                  movies={combinedIndian}
                  onSelectMovie={handleSelectMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* 6. Tamil / Telugu / Regional Cinema */}
                {combinedSouthIndian.length > 0 && (
                  <MovieCarousel
                    title="Tamil, Telugu & Regional"
                    movies={combinedSouthIndian}
                    onSelectMovie={handleSelectMovie}
                    onSeeAll={() => setActiveTab('search')}
                  />
                )}

                {/* 7. Hollywood Blockbusters */}
                <MovieCarousel
                  title="Hollywood Blockbusters"
                  movies={combinedHollywood}
                  onSelectMovie={handleSelectMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* 8. Romance & Drama */}
                <MovieCarousel
                  title="Romance & Drama"
                  movies={combinedRomance}
                  onSelectMovie={handleSelectMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* 9. Thriller & Mystery */}
                <MovieCarousel
                  title="Thriller & Mystery"
                  movies={combinedThriller}
                  onSelectMovie={handleSelectMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* 10. Action Movies */}
                {combinedAction.length > 0 && (
                  <MovieCarousel
                    title="High-Octane Action"
                    movies={combinedAction}
                    onSelectMovie={handleSelectMovie}
                    onSeeAll={() => setActiveTab('search')}
                  />
                )}

                {/* 11. Sci-Fi Universe */}
                <MovieCarousel
                  title="Sci-Fi Universe"
                  movies={sciFiPicks}
                  onSelectMovie={handleSelectMovie}
                  onSeeAll={() => setActiveTab('search')}
                />
              </>
            )}

            <div className="h-16" />
          </div>
        )}

        {activeTab === 'search' && (
          <SearchView
            allMovies={allMovies}
            onSelectMovie={setSelectedMovie}
          />
        )}

        {activeTab === 'downloads' && (
          <DownloadsView
            downloads={downloads}
            onPlay={handleRequestPlay}
            onRemoveDownload={(id) => {
              setDownloads((prev) => prev.filter((m) => m.id !== id));
              showToast('Deleted download');
            }}
          />
        )}

        {activeTab === 'mylist' && (
          <MyListView
            myList={myList}
            onSelectMovie={setSelectedMovie}
            onRemove={(id) => {
              setMyList((prev) => prev.filter((m) => m.id !== id));
              showToast('Removed from My List');
            }}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        myListCount={myList.length}
      />

      {/* Movie Details Modal (PvrPlay 3-Tab System: Overview, Details, Trailer + Similar Movies) */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          isInList={myList.some((m) => m.id === selectedMovie.id)}
          onClose={() => setSelectedMovie(null)}
          onPlay={(m) => {
            setSelectedMovie(null);
            handleRequestPlay(m);
          }}
          onToggleList={handleToggleList}
          onDownload={handleDownload}
          onSelectSimilar={(sim) => {
            setSelectedMovie(sim);
          }}
        />
      )}

      {/* Quality & Multi-Language Selector Modal (4K, 1080p, 720p, 480p) */}
      {qualityTargetMovie && (
        <QualitySelectionModal
          movie={qualityTargetMovie}
          onClose={() => setQualityTargetMovie(null)}
          onConfirm={handleQualityConfirmed}
        />
      )}

      {/* AdMob Interstitial Ad (Native SDK + Web fallback, triggers on movie play) */}
      {interstitialTarget && (
        <AdMobInterstitial
          onDismiss={handleDismissAd}
          onAdDismissed={handleDismissAd}
          onAdFailed={handleDismissAd}
          movieTitle={interstitialTarget.title}
        />
      )}

      {/* Fullscreen Video Player (Connected to PvrPlay VIP Core Server 1 + Mirrors) */}
      {playingMovie && (
        <VideoPlayerModal
          movie={playingMovie}
          initialQuality={activeQuality}
          initialLanguage={activeLanguage}
          onClose={() => setPlayingMovie(null)}
        />
      )}

      {/* Settings Modal (Language, Quality, Smooth Playback Engine) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentLanguage={activeLanguage}
        onLanguageChange={(l) => {
          setActiveLanguage(l);
          showToast(`Default Audio set to ${l}`);
        }}
        currentQuality={activeQuality}
        onQualityChange={(q) => {
          setActiveQuality(q);
          showToast(`Default Quality set to ${q}`);
        }}
        onClearCache={() => {
          setContinueWatching([]);
          showToast('Cache & History cleared successfully');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
