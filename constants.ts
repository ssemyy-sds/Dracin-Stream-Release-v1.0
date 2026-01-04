import { Drama } from './types';

export const APP_NAME = "Dracin";
export const ACCENT_COLOR = "#FF6600";

// Mock Data to simulate API response
export const MOCK_DRAMAS: Drama[] = [
  {
    id: "d1",
    title: "Hidden Love",
    thumbnail: "https://picsum.photos/seed/hiddenlove/300/450",
    poster: "https://picsum.photos/seed/hiddenlove-bg/1920/1080",
    rating: 9.1,
    genres: ["Romance", "Youth"],
    description: "Sang Zhi falls in love with Duan Jia Xu, the boy who often comes to her house to play games with her older brother.",
    status: "Completed",
    year: 2023,
    latestEpisode: 25,
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    id: "d2",
    title: "The Untamed",
    thumbnail: "https://picsum.photos/seed/untamed/300/450",
    poster: "https://picsum.photos/seed/untamed-bg/1920/1080",
    rating: 9.8,
    genres: ["Wuxia", "Fantasy"],
    description: "Wei Wu Xian and Lan Wang Ji, two talented disciples of respected clans, meet during a cultivation training and accidentally discover a secret.",
    status: "Completed",
    year: 2019,
    latestEpisode: 50,
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    id: "d3",
    title: "Till The End of The Moon",
    thumbnail: "https://picsum.photos/seed/moon/300/450",
    poster: "https://picsum.photos/seed/moon-bg/1920/1080",
    rating: 8.9,
    genres: ["Xianxia", "Romance"],
    description: "In an era when the demons are in power, they are the masters of the despicable cultivators and mortals.",
    status: "Completed",
    year: 2023,
    latestEpisode: 40,
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    id: "d4",
    title: "Love Like The Galaxy",
    thumbnail: "https://picsum.photos/seed/galaxy/300/450",
    rating: 9.0,
    genres: ["Historical", "Romance"],
    description: "The young Cheng Shao Shang was left behind because her parents had gone off to fight in the war.",
    status: "Completed",
    year: 2022,
    latestEpisode: 56,
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    id: "d5",
    title: "Falling Into Your Smile",
    thumbnail: "https://picsum.photos/seed/smile/300/450",
    rating: 8.7,
    genres: ["E-Sports", "Rom-Com"],
    description: "Student Tong Yao makes a vow: she will never be in a relationship with someone in the same field.",
    status: "Completed",
    year: 2021,
    latestEpisode: 31,
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  },
  {
    id: "d6",
    title: "Fireworks of My Heart",
    thumbnail: "https://picsum.photos/seed/fireworks/300/450",
    rating: 7.5,
    genres: ["Action", "Medical"],
    description: "Growing up, Song Yan and Xu Qin were the best of friends. But as they grew older, their families began to see their friendship in an unfavorable light.",
    status: "Completed",
    year: 2023,
    latestEpisode: 40,
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  }
];

export const GENRES = ["All", "Romance", "Wuxia", "Fantasy", "Historical", "Modern", "Action"];