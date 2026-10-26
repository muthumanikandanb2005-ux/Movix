import { Movie, StreamSource } from '../types';

export const TMDB_API_KEY = '4c81439cadcaabd5396f929f7a627830';
export const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0YzgxNDM5Y2FkY2FhYmQ1Mzk2ZjkyOWY3YTYyNzgzMCIsIm5iZiI6MTc4OTMxNzc2OS4zODUsInN1YiI6IjZhYTZkMjg5NjY5YjAzMmM0NzYwYTE2ZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.YCWur56g4tUkC7yeTVjOyopV3L_OZzpicBlGYmRtwa0';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_ORIGINAL = 'https://image.tmdb.org/t/p/original';
const IMAGE_W500 = 'https://image.tmdb.org/t/p/w500';

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
  27: 'Horror',
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

const RELIABLE_CDN_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
];

export const getStreamingSources = (tmdbId: number, trailerKey?: string): StreamSource[] => {
  const directUrl = RELIABLE_CDN_VIDEOS[Math.abs(tmdbId) % RELIABLE_CDN_VIDEOS.length];

  const sources: StreamSource[] = [
    {
      name: 'Server 1 (XPlayer Fast 4K Direct)',
      url: directUrl,
      type: 'video'
    },
    {
      name: 'Server 2 (VidSrc Cloud 4K)',
      url: `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`,
      type: 'embed'
    },
    {
      name: 'Server 3 (MultiEmbed Ultra)',
      url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
      type: 'embed'
    },
    {
      name: 'Server 4 (AutoEmbed Fast)',
      url: `https://autoembed.to/movie/tmdb/${tmdbId}`,
      type: 'embed'
    },
    {
      name: 'Server 5 (2Embed VIP)',
      url: `https://www.2embed.cc/embed/${tmdbId}`,
      type: 'embed'
    }
  ];

  if (trailerKey) {
    sources.push({
      name: 'Server 6 (Official 4K Trailer)',
      url: `https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`,
      type: 'trailer'
    });
  }

  return sources;
};

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

  const OTT_OPTIONS: import('../types').OttPlatform[] = ['Netflix', 'Prime Video', 'JioHotstar', 'Lionsgate', 'SonyLIV', 'Zee5'];
  const ottProvider = OTT_OPTIONS[item.id % OTT_OPTIONS.length];

  return {
    id: `tmdb-${item.id}`,
    tmdbId: item.id,
    title: item.title || item.name || 'Untitled Movie',
    year,
    genre,
    duration: '2h 15m',
    rating,
    ottProvider,
    isOttRelease: true,
    badge: rating >= 8.0 ? 'TOP RATED' : 'HOT ON OTT',
    description: item.overview || 'Experience the epic cinematic narrative in uncompressed 4K HDR with Dolby surround on Movix.',
    poster,
    backdrop,
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

// 1. Indian Blockbusters
export const fetchIndianMoviesFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_origin_country=IN&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 2. Hollywood Blockbusters
export const fetchHollywoodFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_original_language=en&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 3. Romance Movies
export const fetchRomanceFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_genres=10749&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 4. Thriller & Mystery Movies
export const fetchThrillerFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_genres=53&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 5. Action Movies
export const fetchActionFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_genres=28&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// 6. Horror Movies
export const fetchHorrorFromTMDB = async (): Promise<Movie[]> => {
  const data = await safeFetch(`${BASE_URL}/discover/movie?with_genres=27&sort_by=popularity.desc&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};

// Search across all TMDB movies
export const searchMoviesFromTMDB = async (query: string): Promise<Movie[]> => {
  if (!query.trim()) return [];
  const data = await safeFetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`);
  return data?.results ? data.results.map(mapTmdbToMovie) : [];
};
