
export interface Drama {
  bookId: string;
  bookName: string; // Was title
  cover: string;    // Was thumbnail/poster
  introduction: string; // Was description

  // Additional/Derived fields
  rating: number;
  genres: string[];
  status: 'Ongoing' | 'Completed';
  year: number;
  latestEpisode: number;

  // Optional raw fields from API for reference
  chapterCount?: number;
  viewCount?: number;
}

export interface QualityOption {
  quality: number;      // e.g., 720, 1080
  videoUrl: string;     // Direct video URL for this quality
  isDefault?: boolean;
}

export interface Episode {
  chapterId: string;
  chapterIndex: number;
  chapterName: string; // Was title
  cover?: string;      // Episode specific cover

  // Default/Primary video URL (usually 720p)
  videoUrl: string;

  // All available quality options
  qualityOptions: QualityOption[];
}

export interface ApiResponse<T> {
  data: T;
  code?: number;
  msg?: string;
}
