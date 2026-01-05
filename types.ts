// types.ts atau types.js
export interface Drama {
  bookId: string;
  bookName: string;
  cover: string;
  introduction: string;
  viewCount: number;
  followCount: number;
  chapterCount: number;
  labels?: string[];
  tags?: string[];
  typeTwoNames?: string[];
  language?: string;
  shelfTime?: string;
  performerList?: Performer[];
}

export interface Performer {
  performerId: string;
  performerName: string;
  performerAvatar: string;
  videoCount: number;
}

export interface Episode {
  chapterId: string;
  chapterIndex: number;
  chapterName: string;
  isCharge: number;
  cdnList: CDN[];
}

export interface CDN {
  cdnDomain: string;
  isDefault: number;
  videoPathList: VideoPath[];
}

export interface VideoPath {
  quality: number;
  videoPath: string;
  isDefault: number;
  isEntry: number;
  isVipEquity: number;
}
