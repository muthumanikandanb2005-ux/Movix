import { ContinueWatchingItem, Movie } from '../types';

const RESUME_PREFIX = 'player:resume:';

export const getContinueWatchingList = (): ContinueWatchingItem[] => {
  if (typeof window === 'undefined') return [];
  const items: ContinueWatchingItem[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(RESUME_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            const tmdbId = parseInt(key.replace(RESUME_PREFIX, ''));
            const currentTime = Number(data.t || 0);
            const duration = Number(data.d || 1);
            const timestamp = Number(data.ts || Date.now());

            if (duration > 0 && currentTime > 5 && currentTime < duration - 10) {
              const progress = Math.min(100, Math.max(2, (currentTime / duration) * 100));
              items.push({
                id: `resume-${tmdbId}`,
                tmdbId: isNaN(tmdbId) ? 0 : tmdbId,
                title: data.title || 'Untitled Stream',
                poster: data.poster || '/assets/poster_silent_deep.png',
                backdrop: data.backdrop,
                currentTime,
                duration,
                timestamp,
                progress,
                season: data.season,
                episode: data.episode,
                movie: data.movie
              });
            }
          } catch {
            // Ignore malformed entries
          }
        }
      }
    }
  } catch (err) {
    console.error('Error reading continue watching list:', err);
  }

  // Sort descending by most recently watched timestamp
  return items.sort((a, b) => b.timestamp - a.timestamp);
};

export const saveResumeProgress = (
  tmdbId: number,
  currentTime: number,
  duration: number,
  movie?: Movie,
  season?: number,
  episode?: number
) => {
  if (typeof window === 'undefined' || !tmdbId || duration <= 0) return;

  const key = `${RESUME_PREFIX}${tmdbId}`;
  
  // If user completed > 95% of movie, remove from continue watching
  if (currentTime / duration > 0.95) {
    try {
      localStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent('movix:resume_updated'));
    } catch {}
    return;
  }

  const payload = {
    t: Math.floor(currentTime),
    d: Math.floor(duration),
    ts: Date.now(),
    title: movie?.title,
    poster: movie?.poster,
    backdrop: movie?.backdrop,
    season,
    episode,
    movie
  };

  try {
    localStorage.setItem(key, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('movix:resume_updated'));
  } catch (err) {
    console.error('Error saving resume progress:', err);
  }
};

export const removeResumeProgress = (tmdbId: number) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${RESUME_PREFIX}${tmdbId}`);
    window.dispatchEvent(new CustomEvent('movix:resume_updated'));
  } catch {}
};
