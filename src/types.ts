export interface StreamSource {
  name: string;
  url: string;
  type: 'embed' | 'video' | 'trailer';
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
  description: string;
  poster: string;
  backdrop: string;
  videoUrl?: string;
  streamSources?: StreamSource[];
  cast?: string[];
  director?: string;
}

export type TabType = 'home' | 'search' | 'downloads' | 'mylist';
