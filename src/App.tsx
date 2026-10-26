import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MovieCarousel } from './components/MovieCarousel';
import { BottomNav } from './components/BottomNav';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { AdMobBanner } from './components/AdMobBanner';
import { AdMobInterstitial } from './components/AdMobInterstitial';
import { LoadingScreen } from './components/LoadingScreen';
import { SearchView } from './components/SearchView';
import { DownloadsView } from './components/DownloadsView';
import { MyListView } from './components/MyListView';
import { featuredMovie, trendingMovies, sciFiPicks } from './data/movies';
import { fetchTrendingFromTMDB, fetchPopularFromTMDB } from './services/tmdb';
import { Movie, TabType } from './types';

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [interstitialTarget, setInterstitialTarget] = useState<Movie | null>(null);
  const [myList, setMyList] = useState<Movie[]>([featuredMovie, trendingMovies[0]]);
  const [downloads, setDownloads] = useState<Movie[]>([trendingMovies[0]]);
  const [tmdbTrending, setTmdbTrending] = useState<Movie[]>([]);
  const [tmdbPopular, setTmdbPopular] = useState<Movie[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    const loadLiveMovies = async () => {
      try {
        const [trending, popular] = await Promise.all([
          fetchTrendingFromTMDB(),
          fetchPopularFromTMDB()
        ]);
        if (trending.length > 0) setTmdbTrending(trending);
        if (popular.length > 0) setTmdbPopular(popular);
      } catch (e) {
        console.error('Error loading TMDB content:', e);
      }
    };
    loadLiveMovies();
  }, []);

  const allMovies = [featuredMovie, ...trendingMovies, ...tmdbTrending, ...tmdbPopular, ...sciFiPicks];

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
    // Trigger AdMob Interstitial first
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
        onProfileClick={() => showToast('Movix Profile: Shoeb (Premium Plan)')}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-300">
            {/* Hero Section from Image */}
            <Hero
              movie={featuredMovie}
              isInList={myList.some((m) => m.id === featuredMovie.id)}
              onPlay={handleStartPlay}
              onToggleList={handleToggleList}
            />

            {/* Trending Now Row from Reference Screenshot */}
            <MovieCarousel
              title="Trending now"
              movies={trendingMovies}
              onSelectMovie={setSelectedMovie}
              onSeeAll={() => setActiveTab('search')}
            />

            {/* Google AdMob Sponsored Banner */}
            <AdMobBanner />

            {/* Live TMDB Trending Movies */}
            {tmdbTrending.length > 0 && (
              <MovieCarousel
                title="Trending on TMDB"
                movies={tmdbTrending}
                onSelectMovie={setSelectedMovie}
                onSeeAll={() => setActiveTab('search')}
              />
            )}

            {/* Popular Worldwide (TMDB) */}
            {tmdbPopular.length > 0 && (
              <MovieCarousel
                title="Popular Worldwide"
                movies={tmdbPopular}
                onSelectMovie={setSelectedMovie}
                onSeeAll={() => setActiveTab('search')}
              />
            )}

            {/* Top Sci-Fi Row */}
            <MovieCarousel
              title="Top Sci-Fi Picks"
              movies={sciFiPicks}
              onSelectMovie={setSelectedMovie}
              onSeeAll={() => setActiveTab('search')}
            />

            <div className="h-14" />
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

      {/* Movie Details Modal Drawer */}
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

      {/* AdMob Interstitial Ad (before video stream) */}
      {interstitialTarget && (
        <AdMobInterstitial
          movieTitle={interstitialTarget.title}
          onDismiss={handleDismissAd}
        />
      )}

      {/* Video Streaming Player with Server Switcher & 3D Logo Buffer */}
      {playingMovie && (
        <VideoPlayerModal
          movie={playingMovie}
          onClose={() => setPlayingMovie(null)}
        />
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default App;
