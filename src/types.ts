export type VideoQuality = '4K' | '1080p' | '720p' | '480p';
export type AudioLanguage = 'Hindi' | 'Tamil' | 'Telugu' | 'Malayalam' | 'Kannada' | 'English' | 'Spanish';

export interface StreamSource {
  name: string;
  url: string;
  type: 'embed' | 'video' | 'trailer';
  quality?: VideoQuality;
}

export type OttPlatform = 'Netflix' | 'Prime Video' | 'JioHotstar' | 'Lionsgate' | 'SonyLIV' | 'Zee5' | 'Apple TV+';

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
  director?: string;
}

export type TabType = 'home' | 'search' | 'downloads' | 'mylist';
