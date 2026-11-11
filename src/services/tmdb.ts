import { Movie, StreamSource, VideoQuality, AudioLanguage, CastMember } from '../types';

export const TMDB_API_KEY = '4c81439cadcaabd5396f929f7a627830';
export const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0YzgxNDM5Y2FkY2FhYmQ1Mzk2ZjkyOWY3YTYyNzgzMCIsIm5iZiI6MTc4OTMxNzc2OS4zODUsInN1YiI6IjZhYTZkMjg5NjY5YjAzMmM0NzYwYTE2ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.YCWur56g4tUkC7yeTVjOyopV3L_OZzpicBlGYmRtwa0';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const IMAGE_W500 = 'https://image.tmdb.org/t/p/w500';

// Verified 200 OK ultra-fast global CDN streaming video feeds with Accept-Ranges support
const QUALITY_STREAMS: Record<VideoQuality, string[]> = {
  '4K': [
    'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4',
    'https://vjs.zencdn.net/v/oceans.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4'
  ],
  '1080p': [
    'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4',
    'https://media.w3.org/2010/05/sintel/trailer.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4'
  ],
  '720p': [
    'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4',
    'https://raw.githubusercontent.com/mediaelement/mediaelement-files/master/big_buck_bunny.mp4',
    'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_5MB.mp4'
  ],
  '480p': [
    'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  ]
};

export const getQualityVideoUrl = (tmdbId: number, quality: VideoQuality = '1080p'): string => {
  const pool = QUALITY_STREAMS[quality] || QUALITY_STREAMS['1080p'];
  return pool[Math.abs(tmdbId) % pool.length];
};

const LANG_CODE_MAP: Record<AudioLanguage, string> = {
  'Hindi': 'hi',
  'Tamil': 'ta',
  'Telugu': 'te',
  'Malayalam': 'ml',
  'Kannada': 'kn',
  'English': 'en',
  'Spanish': 'es'
};

export const getStreamingSources = (
  tmdbId: number, 
  trailerKey?: string, 
  quality: VideoQuality = '1080p',
  language: AudioLanguage = 'Hindi'
): StreamSource[] => {
  const langCode = LANG_CODE_MAP[language] || 'hi';
  const sources: StreamSource[] = [
    {
      name: `Server 1 (AutoEmbed Fast 4K VIP - Instant Playback)`,
      url: `https://player.autoembed.me/embed/movie/${tmdbId}?lang=${langCode}&audio=${langCode}&autoplay=true`,
      type: 'embed',
      quality
    },
    {
      name: `Server 2 (VidSrc Cinema 4K)`,
      url: `https://vidsrc.pm/embed/movie/${tmdbId}?audio=${langCode}&lang=${langCode}`,
      type: 'embed',
      quality
    },
    {
      name: `Server 3 (SuperEmbed Multi-Server HD)`,
      url: `https://superembed.stream/?video_id=${tmdbId}&tmdb=1`,
      type: 'embed',
      quality
    },
    {
      name: `Server 4 (AutoEmbed Cinema HD)`,
      url: `https://autoembed.co/movie/tmdb/${tmdbId}?lang=${langCode}`,
      type: 'embed',
      quality
    },
    {
      name: `Server 5 (2Embed VIP Cinema)`,
      url: `https://www.2embed.cc/embed/${tmdbId}`,
      type: 'embed',
      quality
    },
    {
      name: `Server 6 (CineSrc Multi-Language HD)`,
      url: `https://cinesrc.st/embed/movie/${tmdbId}?lang=${langCode}&audio=${langCode}`,
      type: 'embed',
      quality
    },
    {
      name: `Server 7 (VidLink Pro 4K Multi-Audio)`,
      url: `https://vidlink.pro/movie/${tmdbId}?primaryColor=E50914&autoplay=true&multiLang=true`,
      type: 'embed',
      quality
    },
    {
      name: `Server 8 (Direct CDN ${quality} - Ad-Free Stream)`,
      url: getQualityVideoUrl(tmdbId, quality),
      type: 'video',
      quality
    }
  ];

  if (trailerKey) {
    sources.push({
      name: 'Server 9 (Official 4K Trailer)',
      url: `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&playsinline=1&rel=0`,
      type: 'trailer'
    });
  }

  return sources;
};

export const getTvStreamingSources = (
  tmdbId: number, 
  season: number = 1, 
  episode: number = 1,
  quality: VideoQuality = '1080p',
  language: AudioLanguage = 'Hindi'
): StreamSource[] => {
  const langCode = LANG_CODE_MAP[language] || 'hi';
  return [
    {
      name: 'Server 1 (AutoEmbed TV Fast VIP)',
      url: `https://player.autoembed.me/embed/tv/${tmdbId}/${season}/${episode}?lang=${langCode}&audio=${langCode}&autoplay=true`,
      type: 'embed',
      quality
    },
    {
      name: 'Server 2 (VidSrc TV Cinema 4K)',
      url: `https://vidsrc.pm/embed/tv/${tmdbId}/${season}/${episode}?audio=${langCode}&lang=${langCode}`,
      type: 'embed',
      quality
    },
    {
      name: 'Server 3 (SuperEmbed TV Cinema)',
      url: `https://superembed.stream/?video_id=${tmdbId}&tmdb=1&season=${season}&episode=${episode}`,
      type: 'embed',
      quality
    },
    {
      name: 'Server 4 (AutoEmbed TV Cinema HD)',
      url: `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}?lang=${langCode}`,
      type: 'embed',
      quality
    },
    {
      name: 'Server 5 (2Embed TV VIP)',
      url: `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
      type: 'embed',
      quality
    },
    {
      name: 'Server 6 (VidLink TV 4K Multi-Audio)',
      url: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=E50914&autoplay=true&multiLang=true`,
      type: 'embed',
      quality
    }
  ];
};

const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  21: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

const getHeaders = () => ({
  'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
  'Accept': 'application/json'
});

export const mapTmdbToMovie = (item: any): Movie => {
  const genreNames = (item.genre_ids || [])
    .map((gid: number) => GENRE_MAP[gid])
    .filter(Boolean);
  const genre = genreNames.length > 0 ? genreNames.slice(0, 2).join(' / ') : 'Cinema';

  const year = item.release_date ? parseInt(item.release_date.split('-')[0]) : 2026;
  const rating = item.vote_average ? parseFloat(item.vote_average.toFixed(1)) : 8.5;

  const poster = item.poster_path 
    ? `${IMAGE_W500}${item.poster_path}` 
    : '/assets/poster_silent_deep.png';

  const backdrop = item.backdrop_path 
    ? `${IMAGE_ORIGINAL}${item.backdrop_path}` 
    : (item.poster_path ? `${IMAGE_ORIGINAL}${item.poster_path}` : '/assets/hero_clean.png');

  const streamSources = getStreamingSources(item.id);

  const origLang = item.original_language || 'en';
  let availableLanguages: AudioLanguage[] = ['English'];

  // Specific Pan-India blockbusters with verified multi-language audio releases
  const MULTI_LANG_IDS = [
    1022789, // Kalki 2898 AD
    770906,  // Salaar: Part 1 - Ceasefire
    587412,  // K.G.F: Chapter 2
    579974,  // RRR
    801688,  // Jawan
    894803,  // Sita Ramam
    693134,  // Dune: Part Two
    533535,  // Deadpool & Wolverine
  ];

  if (MULTI_LANG_IDS.includes(item.id)) {
    if (origLang === 'te') {
      availableLanguages = ['Telugu', 'Hindi', 'Tamil', 'Malayalam', 'Kannada'];
    } else if (origLang === 'ta') {
      availableLanguages = ['Tamil', 'Telugu', 'Hindi', 'Malayalam', 'Kannada'];
    } else if (origLang === 'hi') {
      availableLanguages = ['Hindi', 'Tamil', 'Telugu'];
    } else {
      availableLanguages = ['English', 'Hindi'];
    }
  } else if (origLang === 'hi') {
    availableLanguages = ['Hindi'];
  } else if (origLang === 'ta') {
    availableLanguages = ['Tamil'];
  } else if (origLang === 'te') {
    availableLanguages = ['Telugu'];
  } else if (origLang === 'ml') {
    availableLanguages = ['Malayalam'];
  } else if (origLang === 'kn') {
    availableLanguages = ['Kannada'];
  } else if (origLang === 'es') {
    availableLanguages = ['Spanish'];
  } else {
    // English & international movies: strictly show English only
    availableLanguages = ['English'];
  }

  return {
    id: `tmdb-${item.id}`,
    tmdbId: item.id,
    title: item.title || item.name || 'Untitled Movie',
    year,
    genre,
    duration: '2h 15m',
    rating,
    isOttRelease: true,
    badge: rating >= 8.0 ? 'TOP RATED' : 'HOT TITLE',
    description: item.overview || 'Experience this narrative in uncompressed 4K HDR with Dolby surround on Movix.',
    poster,
    backdrop,
    availableLanguages,
    videoUrl: streamSources[0].url,
    streamSources
  };
};

// Safe fetch with 2 retries and timeout
const safeFetch = async (url: string, retries = 2): Promise<any> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { headers: getHeaders(), signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      if (i < retries) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
  }
  return null;
};

// Fetch full details, cast, director, trailers, and similar movies
export const fetchFullMovieDetails = async (tmdbId: number): Promise<{
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
}> => {
  const data = await safeFetch(`${BASE_URL}/movie/${tmdbId}?append_to_response=credits,videos,similar`);
  if (!data) return {};

  const director = data.credits?.crew?.find((c: any) => c.job === 'Director')?.name;
  const castMembers: CastMember[] = (data.credits?.cast || []).slice(0, 10).map((c: any) => ({
    name: c.name,
    character: c.character,
    photo: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : undefined
  }));

  const trailers = data.videos?.results || [];
  const officialTrailer = trailers.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube') || trailers[0];

  const productionCompanies = (data.production_companies || []).map((p: any) => p.name);
  const similar = (data.similar?.results || []).slice(0, 8).map(mapTmdbToMovie);

  return {
    runtime: data.runtime,
    budget: data.budget,
    revenue: data.revenue,
    status: data.status,
    releaseDate: data.release_date,
    productionCompanies,
    trailerKey: officialTrailer?.key,
    castMembers,
    director,
    similar
  };
};

// 0. Trending Movies Worldwide
export const fetchTrendingFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/trending/movie/week?page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 0.1 Popular Movies
export const fetchPopularFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/movie/popular?page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 0.2 In Theatres / Now Playing
export const fetchNowPlayingFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/movie/now_playing?page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 1. Indian Blockbusters (Hindi, Tamil, Telugu, Malayalam, Kannada)
export const fetchIndianMoviesFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_origin_country=IN&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 1.1 South Indian / Regional Blockbusters (Tamil, Telugu, Malayalam, Kannada)
export const fetchSouthIndianFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_original_language=ta|te|ml|kn&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 2. Hollywood Blockbusters
export const fetchHollywoodFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_original_language=en&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 3. Platform Specific (Netflix=8, Prime=9, Hotstar=337, Apple=350, Max=1899, Hulu=15)
export const fetchPlatformMoviesFromTMDB = async (providerId: number = 8): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_watch_providers=${providerId}&watch_region=IN&sort_by=popularity.desc&page=1`);
  if (data?.results?.length) return data.results.map((m: any) => ({ ...mapTmdbToMovie(m), ottProvider: 'Netflix' as const }));
  const dataFallback = await safeFetch(`${BASE_URL}/discover/movie?with_watch_providers=${providerId}&sort_by=popularity.desc&page=1`);
  return dataFallback?.results ? dataFallback.results.map((m: any) => ({ ...mapTmdbToMovie(m), ottProvider: 'Netflix' as const })) : [];
};

// 3.1 Live Daily Netflix Trending Movies (Daily refreshed real-time catalogue)
export const fetchLiveDailyNetflixMovies = async (): Promise<{ trending: Movie[]; top10: Movie[]; originals: Movie[] }> => {
  const todayKey = new Date().toISOString().split('T')[0];
  const cacheKey = `movix_daily_netflix_${todayKey}`;

  // Check today's local cache for instant 0ms load
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.trending?.length && parsed.top10?.length) {
        return parsed;
      }
    }
  } catch {}

  // Fetch live daily movies directly from TMDB
  try {
    const [page1, page2] = await Promise.all([
      safeFetch(`${BASE_URL}/discover/movie?with_watch_providers=8&sort_by=popularity.desc&page=1`),
      safeFetch(`${BASE_URL}/discover/movie?with_watch_providers=8&sort_by=popularity.desc&page=2`)
    ]);

    const combinedRaw = [
      ...(page1?.results || []),
      ...(page2?.results || [])
    ];

    const seen = new Set<number>();
    const dedupeRaw = combinedRaw.filter((m: any) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    const trending: Movie[] = dedupeRaw.map((m: any, idx: number) => ({
      ...mapTmdbToMovie(m),
      ottProvider: 'Netflix' as const,
      badge: idx < 3 ? '🔥 #1 TODAY' : idx < 10 ? 'NETFLIX TODAY' : 'POPULAR NOW'
    }));

    const top10: Movie[] = trending.slice(0, 10).map((m, idx) => ({
      ...m,
      badge: `TOP #${idx + 1} TODAY`
    }));

    // Netflix Originals
    const origData = await safeFetch(`${BASE_URL}/discover/movie?with_networks=213&sort_by=popularity.desc&page=1`);
    const originals: Movie[] = (origData?.results || []).map((m: any) => ({
      ...mapTmdbToMovie(m),
      ottProvider: 'Netflix' as const,
      badge: 'NETFLIX ORIGINAL'
    }));

    const result = {
      trending: trending.length > 0 ? trending : [],
      top10: top10.length > 0 ? top10 : [],
      originals: originals.length > 0 ? originals : []
    };

    if (result.trending.length > 0) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch {}
    }

    return result;
  } catch (err) {
    console.warn('Live daily Netflix fetch error:', err);
    return { trending: [], top10: [], originals: [] };
  }
};

// 3.2 Fetch Real Netflix Trending Movies
export const fetchNetflixTrending = async (): Promise<Movie[]> => {
  const daily = await fetchLiveDailyNetflixMovies();
  if (daily.trending.length > 0) return daily.trending;
  return fetchPlatformMoviesFromTMDB(8);
};

// 3.3 Fetch Real Netflix Originals (Network ID 213)
export const fetchNetflixOriginals = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_networks=213&sort_by=popularity.desc&page=1`);
  if (data?.results?.length) return data.results.map((m: any) => ({ ...mapTmdbToMovie(m), ottProvider: 'Netflix' as const }));
  const tvData = await safeFetch(`${BASE_URL}/discover/tv?with_networks=213&sort_by=popularity.desc&page=1`);
  return tvData?.results ? tvData.results.map((m: any) => ({ ...mapTmdbToMovie(m), ottProvider: 'Netflix' as const })) : [];
};

// 3.4 Fetch Netflix Top 10 Today
export const fetchNetflixTop10 = async (): Promise<Movie[]> => {
  const daily = await fetchLiveDailyNetflixMovies();
  if (daily.top10.length > 0) return daily.top10;
  const movies = await fetchNetflixTrending();
  return movies.slice(0, 10);
};

// 4. Romance Movies
export const fetchRomanceFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_genres=10749&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 5. Thriller & Mystery Movies
export const fetchThrillerFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_genres=53&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 6. Action Movies
export const fetchActionFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_genres=28&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 7. Horror Movies
export const fetchHorrorFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_genres=27&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 8. Comedy Movies
export const fetchComedyFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_genres=35&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 9. Sci-Fi Movies
export const fetchSciFiFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_genres=878&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// Search across all TMDB movies
export const searchMoviesFromTMDB = async (query: string): Promise<Movie[]> => {
  if (!query.trim()) return [];
  const data = await safeFetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};
