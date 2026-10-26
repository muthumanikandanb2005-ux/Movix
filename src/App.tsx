import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MovieCarousel } from './components/MovieCarousel';
import { OttProviderBar, CategoryFilter } from './components/OttProviderBar';
import { BottomNav } from './components/BottomNav';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { AdMobBanner } from './components/AdMobBanner';
import { AdMobInterstitial } from './components/AdMobInterstitial';
import { LoadingScreen } from './components/LoadingScreen';
import { SearchView } from './components/SearchView';
import { DownloadsView } from './components/DownloadsView';
import { MyListView } from './components/MyListView';
import {
  featuredIndianMovie,
  ottNewReleases,
  indianBlockbusters,
  hollywoodBlockbusters,
  romanceMovies,
  thrillerMovies,
  sciFiPicks
} from './data/movies';
import {
  fetchTrendingFromTMDB,
  fetchIndianMoviesFromTMDB,
  fetchHollywoodFromTMDB,
  fetchRomanceFromTMDB,
  fetchThrillerFromTMDB,
  fetchActionFromTMDB
} from './services/tmdb';
import { Movie, TabType } from './types';

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
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [interstitialTarget, setInterstitialTarget] = useState<Movie | null>(null);
  const [myList, setMyList] = useState<Movie[]>([featuredIndianMovie, ottNewReleases[0]]);
  const [downloads, setDownloads] = useState<Movie[]>([ottNewReleases[0]]);
  
  // Live TMDB Content states
  const [liveTrending, setLiveTrending] = useState<Movie[]>([]);
  const [liveIndian, setLiveIndian] = useState<Movie[]>([]);
  const [liveHollywood, setLiveHollywood] = useState<Movie[]>([]);
  const [liveRomance, setLiveRomance] = useState<Movie[]>([]);
  const [liveThriller, setLiveThriller] = useState<Movie[]>([]);
  const [liveAction, setLiveAction] = useState<Movie[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    const loadAllTmdbFeeds = async () => {
      try {
        const [trending, indian, hollywood, romance, thriller, action] = await Promise.all([
          fetchTrendingFromTMDB(),
          fetchIndianMoviesFromTMDB(),
          fetchHollywoodFromTMDB(),
          fetchRomanceFromTMDB(),
          fetchThrillerFromTMDB(),
          fetchActionFromTMDB()
        ]);
        if (trending?.length) setLiveTrending(trending);
        if (indian?.length) setLiveIndian(indian);
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

  // Combined movie pools
  const combinedIndian = dedupeMovies([...indianBlockbusters, ...liveIndian]);
  const combinedHollywood = dedupeMovies([...hollywoodBlockbusters, ...liveHollywood]);
  const combinedRomance = dedupeMovies([...romanceMovies, ...liveRomance]);
  const combinedThriller = dedupeMovies([...thrillerMovies, ...liveThriller]);
  const combinedAction = dedupeMovies(liveAction);

  // Global search catalogue
  const allMovies = dedupeMovies([
    featuredIndianMovie,
    ...ottNewReleases,
    ...combinedIndian,
    ...combinedHollywood,
    ...combinedRomance,
    ...combinedThriller,
    ...combinedAction,
    ...sciFiPicks,
    ...liveTrending
  ]);

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

  const handleToggleList = (movie: Movie) => {
    if (myList.some((m) => m.id === movie.id)) {
      setMyList((prev) => prev.filter((m) => m.id !== movie.id));
      showToast(`Removed "${movie.title}" from My List`);
    } else {
      setMyList((prev) => [...prev, movie]);
      showToast(`Added "${movie.title}" to My List`);
    }
  };

  const handleDownload = (movie: Movie) => {
    if (!downloads.some((m) => m.id === movie.id)) {
      setDownloads((prev) => [...prev, movie]);
      showToast(`Downloading "${movie.title}" for offline playback...`);
    } else {
      showToast(`"${movie.title}" is already in Downloads`);
    }
  };

  const handleStartPlay = (movie: Movie) => {
    // Show AdMob Interstitial first (raw IDs hidden)
    setInterstitialTarget(movie);
  };

  const handleDismissAd = () => {
    if (interstitialTarget) {
      setPlayingMovie(interstitialTarget);
      setInterstitialTarget(null);
    }
  };

  if (loading) {
    return <LoadingScreen onLoaded={() => setLoading(false)} />;
  }

  return (
    <div className="relative min-h-screen bg-[#080A0F] text-white flex flex-col max-w-md sm:max-w-lg md:max-w-xl mx-auto shadow-2xl border-x border-white/[0.04]">
      {/* Top Header */}
      <Header
        onSearchClick={() => setActiveTab('search')}
        onProfileClick={() => showToast('Movix VIP Pass Active')}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-300">
            {/* 1. Indian Movie in First Home Page Hero */}
            <Hero
              movie={featuredIndianMovie}
              isInList={myList.some((m) => m.id === featuredIndianMovie.id)}
              onPlay={handleStartPlay}
              onToggleList={handleToggleList}
            />

            {/* 2. Cinema Hubs Bar */}
            <OttProviderBar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
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
                {/* 1. New Releases & Premieres */}
                <MovieCarousel
                  title="🔥 New Releases"
                  movies={ottNewReleases}
                  onSelectMovie={setSelectedMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* 2. Trending Indian Blockbusters */}
                <MovieCarousel
                  title="🇮🇳 Trending Indian Blockbusters"
                  movies={combinedIndian}
                  onSelectMovie={setSelectedMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* AdMob Sponsored Card (IDs strictly hidden) */}
                <AdMobBanner />

                {/* 3. Hollywood Blockbusters */}
                <MovieCarousel
                  title="🎬 Hollywood Blockbusters"
                  movies={combinedHollywood}
                  onSelectMovie={setSelectedMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* 4. Romance & Heartfelt Cinema */}
                <MovieCarousel
                  title="💖 Romance & Drama"
                  movies={combinedRomance}
                  onSelectMovie={setSelectedMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* 5. Thriller, Crime & Mystery */}
                <MovieCarousel
                  title="⚡ Thriller & Mystery"
                  movies={combinedThriller}
                  onSelectMovie={setSelectedMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* 6. Action Movies */}
                {combinedAction.length > 0 && (
                  <MovieCarousel
                    title="💥 High-Octane Action"
                    movies={combinedAction}
                    onSelectMovie={setSelectedMovie}
                    onSeeAll={() => setActiveTab('search')}
                  />
                )}

                {/* 7. Sci-Fi Universe */}
                <MovieCarousel
                  title="🚀 Sci-Fi Universe"
                  movies={sciFiPicks}
                  onSelectMovie={setSelectedMovie}
                  onSeeAll={() => setActiveTab('search')}
                />

                {/* 8. Trending Worldwide */}
                {liveTrending.length > 0 && (
                  <MovieCarousel
                    title="🏆 Trending Worldwide"
                    movies={liveTrending}
                    onSelectMovie={setSelectedMovie}
                    onSeeAll={() => setActiveTab('search')}
                  />
                )}
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
            onPlay={handleStartPlay}
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

      {/* Movie Details Modal Drawer (ONLY Play & Stream options) */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          isInList={myList.some((m) => m.id === selectedMovie.id)}
          onClose={() => setSelectedMovie(null)}
          onPlay={(m) => {
            setSelectedMovie(null);
            handleStartPlay(m);
          }}
          onToggleList={handleToggleList}
          onDownload={handleDownload}
        />
      )}

      {/* AdMob Interstitial Ad (Native SDK + Web fallback, triggers on movie play) */}
      {interstitialTarget && (
        <AdMobInterstitial
          movieTitle={interstitialTarget.title}
          onDismiss={handleDismissAd}
        />
      )}

      {/* XPLAYER (Video Player All Format style with Gestures, Lock, Aspect Mode, Buffering 3D Logo) */}
      {playingMovie && (
        <VideoPlayerModal
          movie={playingMovie}
          onClose={() => setPlayingMovie(null)}
        />
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
