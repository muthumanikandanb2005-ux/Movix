export interface Movie {
  id: string;
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
  cast?: string[];
  director?: string;
}

export type TabType = 'home' | 'search' | 'downloads' | 'mylist';
