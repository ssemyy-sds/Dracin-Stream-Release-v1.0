import { Drama, Episode } from '../types';
import { MOCK_DRAMAS } from '../constants';

// CHANGE: Point to relative path. 
// In Dev: Vite proxy handles this.
// In Prod: Vercel Serverless Function handles this.
const BASE_URL = '/api';

const fetchFromApi = async (endpoint: string, params: Record<string, string> = {}) => {
  // Construct URL with query parameters
  const url = new URL(endpoint, window.location.origin + BASE_URL); // results in /api/endpoint
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  
  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const json = await response.json();
    
    // Validation: Ensure we actually got data
    const result = json.data || json.result || json;
    
    if (!result) return null;
    if (Array.isArray(result) && result.length === 0) return null;
    
    return result;
  } catch (error) {
    console.warn(`Fetch error for ${endpoint}:`, error);
    return null; // Return null to trigger fallback to Mock Data
  }
};

// Adapter: Normalize API Data to App Interface
const normalizeDrama = (item: any): Drama => {
  const id = item.bookId?.toString() || item.id?.toString() || crypto.randomUUID();
  const title = item.title || item.name || 'Unknown Title';
  
  // Fix mixed content (http vs https) for images if necessary
  const fixUrl = (url?: string) => url?.replace('http://', 'https://');

  return {
    id: id,
    title: title,
    thumbnail: fixUrl(item.cover || item.thumbnail || item.image) || 'https://via.placeholder.com/300x450?text=No+Image',
    poster: fixUrl(item.poster || item.cover || item.thumbnail) || 'https://via.placeholder.com/1920x1080?text=No+Poster',
    rating: parseFloat(item.rating || '0') || 9.0,
    genres: Array.isArray(item.genres) ? item.genres : [item.category || 'Drama'],
    description: item.intro || item.synopsis || item.description || 'No synopsis available.',
    status: item.status || 'Ongoing',
    year: parseInt(item.year) || new Date().getFullYear(),
    latestEpisode: parseInt(item.latest_episode || '0'),
    streamUrl: fixUrl(item.stream_url)
  };
};

const normalizeEpisode = (item: any, dramaId: string): Episode => {
  return {
    id: item.id?.toString() || `ep-${dramaId}-${item.episode || Math.random()}`,
    dramaId: dramaId,
    episodeNumber: parseInt(item.episode) || 0,
    title: item.title || `Episode ${item.episode}`,
    streamUrl: item.url || item.stream_url || '',
    thumbnail: item.thumbnail || item.cover
  };
};

export const dramaService = {
  getForYou: async (): Promise<Drama[]> => {
    const data = await fetchFromApi('/foryou');
    if (!data || !Array.isArray(data)) return MOCK_DRAMAS.slice(0, 5); 
    return data.map(normalizeDrama);
  },

  getLatest: async (): Promise<Drama[]> => {
    const data = await fetchFromApi('/latest');
    if (!data || !Array.isArray(data)) return MOCK_DRAMAS;
    return data.map(normalizeDrama);
  },

  getTrending: async (): Promise<Drama[]> => {
    const data = await fetchFromApi('/trending');
    if (!data || !Array.isArray(data)) return MOCK_DRAMAS; 
    return data.map(normalizeDrama);
  },

  getVip: async (): Promise<Drama[]> => {
    const data = await fetchFromApi('/vip');
    if (!data || !Array.isArray(data)) return MOCK_DRAMAS;
    return data.map(normalizeDrama);
  },

  getDubIndo: async (): Promise<Drama[]> => {
    const data = await fetchFromApi('/dubindo');
    if (!data || !Array.isArray(data)) return MOCK_DRAMAS;
    return data.map(normalizeDrama);
  },

  // Helper to get by category slug
  getByCategory: async (category: string): Promise<Drama[]> => {
    switch (category.toLowerCase()) {
      case 'foryou': return dramaService.getForYou();
      case 'trending': return dramaService.getTrending();
      case 'latest': return dramaService.getLatest();
      case 'vip': return dramaService.getVip();
      case 'dubindo': return dramaService.getDubIndo();
      default: return dramaService.getTrending();
    }
  },

  getById: async (id: string): Promise<Drama | undefined> => {
    if (id.startsWith('d') && id.length < 5) {
        return MOCK_DRAMAS.find(d => d.id === id);
    }

    const data = await fetchFromApi('/detail', { bookId: id });
    if (!data) return MOCK_DRAMAS[0]; 
    
    const item = Array.isArray(data) ? data[0] : data;
    const normalized = normalizeDrama(item);
    if (normalized.title === 'Unknown Title') return MOCK_DRAMAS[0]; 
    
    return normalized;
  },

  search: async (query: string): Promise<Drama[]> => {
    if (!query) return [];
    const data = await fetchFromApi('/search', { query: query });
    
    if (!data || !Array.isArray(data)) {
        const lowerQuery = query.toLowerCase();
        return MOCK_DRAMAS.filter(d => 
          d.title.toLowerCase().includes(lowerQuery) || 
          d.genres.some(g => g.toLowerCase().includes(lowerQuery))
        );
    }
    return data.map(normalizeDrama);
  },

  getEpisodes: async (dramaId: string): Promise<Episode[]> => {
    if (dramaId.startsWith('d') && dramaId.length < 5) {
        const drama = MOCK_DRAMAS.find(d => d.id === dramaId);
        return Array.from({ length: 10 }).map((_, i) => ({
            id: `ep-${dramaId}-${i + 1}`,
            dramaId,
            episodeNumber: i + 1,
            title: `Episode ${i + 1}`,
            streamUrl: drama?.streamUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            thumbnail: `https://picsum.photos/seed/${dramaId}-${i}/320/180`
        }));
    }

    const data = await fetchFromApi('/allepisode', { bookId: dramaId });
    if (!data || !Array.isArray(data)) {
        return Array.from({ length: 5 }).map((_, i) => ({
            id: `fallback-${i}`,
            dramaId,
            episodeNumber: i + 1,
            title: `Episode ${i + 1}`,
            streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            thumbnail: "https://via.placeholder.com/320x180?text=No+Signal"
        }));
    }
    
    return data
      .map((item: any) => normalizeEpisode(item, dramaId))
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  },

  getRandom: async (): Promise<Drama[]> => {
    const data = await fetchFromApi('/randomdrama');
    if (!data || !Array.isArray(data)) return MOCK_DRAMAS;
    return data.map(normalizeDrama);
  }
};