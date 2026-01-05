// services/api.ts atau services/api.js
import react from 'react';

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5173/api';

// Helper function untuk normalize drama data dari API
function normalizeDrama(data) {
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

// Get drama detail by bookId
export async function getDramaDetail(bookId) {
  try {
    const response = await fetch(`${API_BASE}/detail?bookId=${bookId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('[API] Drama detail response:', result);
    
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to fetch drama detail');
    }
    
    return normalizeDrama(result.data);
  } catch (error) {
    console.error('[API] Error fetching drama detail:', error);
    throw error;
  }
}

// Get all episodes by bookId
export async function getAllEpisodes(bookId) {
  try {
    const response = await fetch(`${API_BASE}/allepisode?bookId=${bookId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // PENTING: API mengembalikan array langsung, bukan object
    const episodes = await response.json();
    
    console.log('[API] Episodes response:', episodes);
    
    if (!Array.isArray(episodes)) {
      console.error('[API] Invalid episodes format:', episodes);
      return [];
    }
    
    return episodes;
  } catch (error) {
    console.error('[API] Error fetching episodes:', error);
    throw error;
  }
}

// Search dramas
export async function searchDramas(query) {
  try {
    const response = await fetch(`${API_BASE}/search/dramabox?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const dramas = result.data?.list || result.list || [];
    
    return dramas.map(normalizeDrama);
  } catch (error) {
    console.error('[API] Error searching dramas:', error);
    return [];
  }
}

// Get trending dramas
export async function getTrendingDramas() {
  try {
    const response = await fetch(`${API_BASE}/home/dramabox`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const dramas = result.data?.list || result.list || [];
    
    return dramas.map(normalizeDrama);
  } catch (error) {
    console.error('[API] Error fetching trending dramas:', error);
    return [];
  }
}
