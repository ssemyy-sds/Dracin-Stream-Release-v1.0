
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

export interface Episode {
  chapterId: string;
  chapterIndex: number;
  chapterName: string; // Was title
  cover?: string;      // Episode specific cover
  
  // Pre-processed video URL from cdnList
  videoUrl: string;
}

export interface ApiResponse<T> {
  data: T;
  code?: number;
  msg?: string;
}
