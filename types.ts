export interface Drama {
  id: string;
  title: string;
  thumbnail: string;
  poster?: string;
  rating: number;
  genres: string[];
  description: string;
  status: 'Ongoing' | 'Completed';
  year: number;
  latestEpisode?: number;
  streamUrl?: string; // m3u8 url
}

export interface Episode {
  id: string;
  dramaId: string;
  episodeNumber: number;
  title: string;
  streamUrl: string;
  thumbnail?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

export type ViewMode = 'grid' | 'list';