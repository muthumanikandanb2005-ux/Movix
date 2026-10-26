export type VideoQuality = '4K' | '1080p' | '720p' | '480p';
export type AudioLanguage = 'Hindi' | 'Tamil' | 'Telugu' | 'Malayalam' | 'Kannada' | 'English' | 'Spanish';

export interface StreamSource {
  name: string;
  url: string;
  type: 'embed' | 'video' | 'trailer';
  quality?: VideoQuality;
}

export type OttPlatform = 'Netflix' | 'Prime Video' | 'JioHotstar' | 'Lionsgate' | 'SonyLIV' | 'Zee5' | 'Apple TV+';

export interface CastMember {
  name: string;
  character: string;
  photo?: string;
}

export interface Movie {
  id: string;
  tmdbId?: number;
  title: string;
  year: number;
  genre: string;
  duration: string;
  rating: number;
  badge?: string;
  ottProvider?: OttPlatform;
  ottUrl?: string;
  isOttRelease?: boolean;
  description: string;
  poster: string;
  backdrop: string;
  videoUrl?: string;
  streamSources?: StreamSource[];
  cast?: string[];
  castMembers?: CastMember[];
  director?: string;
  availableLanguages?: AudioLanguage[];
  budget?: number;
  revenue?: number;
  status?: string;
  releaseDate?: string;
  productionCompanies?: string[];
  trailerKey?: string;
}

export interface ContinueWatchingItem {
  id: string;
  tmdbId: number;
  title: string;
  poster: string;
  backdrop?: string;
  currentTime: number;
  duration: number;
  timestamp: number;
  progress: number;
  season?: number;
  episode?: number;
  movie?: Movie;
}

export type TabType = 'home' | 'trending' | 'sports' | 'search' | 'downloads' | 'mylist';
