// src/services/api.ts
import { Drama, Episode, ApiResponse } from '../types';

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5173/api';

// Helper function to normalize drama data
function normalizeDrama(data: any): Drama {
  // Handle both nested and direct response
  const book = data.book || data;
  
  return {
    bookId: book.bookId,
    bookName: book.bookName,
    cover: book.cover,
    introduction: book.introduction,
    viewCount: book.viewCount || 0,
    followCount: book.followCount || 0,
    chapterCount: book.chapterCount || 0,
    labels: book.labels || book.tags || [],
    tags: book.tags || book.labels || [],
    typeTwoNames: book.typeTwoNames || [],
    language: book.language,
    shelfTime: book.shelfTime,
    performerList: book.performerList || []
  };
}

// Get drama detail
export async function getDramaDetail(bookId: string): Promise<Drama> {
  try {
    const response = await fetch(`${API_BASE}/detail?bookId=${bookId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse<{ book: any }> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to fetch drama detail');
    }
    
    return normalizeDrama(result.data);
  } catch (error) {
    console.error('Error fetching drama detail:', error);
    throw error;
  }
}

// Get all episodes
export async function getAllEpisodes(bookId: string): Promise<Episode[]> {
  try {
    const response = await fetch(`${API_BASE}/allepisode?bookId=${bookId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // API returns array directly, not wrapped in object
    const episodes: Episode[] = await response.json();
    
    if (!Array.isArray(episodes)) {
      console.error('Invalid episodes format:', episodes);
      return [];
    }
    
    return episodes;
  } catch (error) {
    console.error('Error fetching episodes:', error);
    throw error;
  }
}

// Search dramas
export async function searchDramas(query: string): Promise<Drama[]> {
  try {
    const response = await fetch(`${API_BASE}/search/dramabox?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const dramas = result.data?.list || result.list || [];
    
    return dramas.map(normalizeDrama);
  } catch (error) {
    console.error('Error searching dramas:', error);
    return [];
  }
}

// Get trending dramas
export async function getTrendingDramas(): Promise<Drama[]> {
  try {
    const response = await fetch(`${API_BASE}/home/dramabox`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const dramas = result.data?.list || result.list || [];
    
    return dramas.map(normalizeDrama);
  } catch (error) {
    console.error('Error fetching trending dramas:', error);
    return [];
  }
}
