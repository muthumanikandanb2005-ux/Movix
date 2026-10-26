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

export const getStreamingSources = (tmdbId: number, trailerKey?: string): StreamSource[] => {
  const sources: StreamSource[] = [
    {
      name: 'Server 1 (VidSrc Ultra HD)',
      url: `https://vidsrc.to/embed/movie/${tmdbId}`,
      type: 'embed'
    },
    {
      name: 'Server 2 (MultiStream 4K)',
      url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
      type: 'embed'
    },
    {
      name: 'Server 3 (AutoEmbed Fast)',
      url: `https://autoembed.to/movie/tmdb/${tmdbId}`,
      type: 'embed'
    }
  ];

  if (trailerKey) {
    sources.push({
      name: 'Official Trailer (YouTube 4K)',
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

  return {
    id: `tmdb-${item.id}`,
    tmdbId: item.id,
    title: item.title || item.name || 'Untitled Movie',
    year,
    genre,
    duration: '2h 05m',
    rating,
    description: item.overview || 'No synopsis available for this title.',
    poster,
    backdrop,
    videoUrl: streamSources[0].url,
    streamSources
  };
};

export const fetchTrendingFromTMDB = async (): Promise<Movie[]> => {
  try {
    const res = await fetch(`${BASE_URL}/trending/movie/week?language=en-US`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(mapTmdbToMovie);
  } catch (err) {
    console.error('Failed to fetch trending from TMDB:', err);
    return [];
  }
};

export const fetchPopularFromTMDB = async (): Promise<Movie[]> => {
  try {
    const res = await fetch(`${BASE_URL}/movie/popular?language=en-US&page=1`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(mapTmdbToMovie);
  } catch (err) {
    console.error('Failed to fetch popular from TMDB:', err);
    return [];
  }
};

export const fetchTopRatedFromTMDB = async (): Promise<Movie[]> => {
  try {
    const res = await fetch(`${BASE_URL}/movie/top_rated?language=en-US&page=1`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(mapTmdbToMovie);
  } catch (err) {
    console.error('Failed to fetch top rated from TMDB:', err);
    return [];
  }
};

export const searchMoviesFromTMDB = async (query: string): Promise<Movie[]> => {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
    const data = await res.json();
    return (data.results || []).map(mapTmdbToMovie);
  } catch (err) {
    console.error('Failed to search TMDB:', err);
    return [];
  }
};

export const fetchMovieVideos = async (tmdbId: number): Promise<string | null> => {
  try {
    const res = await fetch(`${BASE_URL}/movie/${tmdbId}/videos?language=en-US`, {
      headers: getHeaders()
    });
    if (!res.ok) return null;
    const data = await res.json();
    const trailer = (data.results || []).find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
    return trailer ? trailer.key : (data.results?.[0]?.key || null);
  } catch {
    return null;
  }
};
