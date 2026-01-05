
import { Drama, Episode } from '../types';

const BASE_URL = '/api';

// Helper: Fix incomplete URLs
const fixUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('//')) return `https:${url}`;
    if (!url.startsWith('http')) return url; // Might be relative, leave it or handle specific cases
    return url.replace('http://', 'https://');
};

const fetchFromApi = async (endpoint: string, params: Record<string, string> = {}, provider: 'primary' | 'secondary' = 'primary') => {
  // Remove leading slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  const url = new URL(`${window.location.origin}${BASE_URL}/${cleanEndpoint}`);
  
  // Add params
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  
  // Add provider param for the proxy to switch targets
  if (provider === 'secondary') {
      url.searchParams.append('provider', 'secondary');
  }
  
  try {
    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) return null;
    
    const json = await response.json();
    
    // Validation: Handle various API response structures
    // Some return { data: [...] }, some { result: [...] }, some directly [...]
    // Secondary API might return { status: true, data: [...] }
    const result = json.data || json.result || json;
    
    if (!result) return null;
    if (Array.isArray(result) && result.length === 0) return null;
    
    return result;
  } catch (error) {
    console.warn(`Fetch error for ${endpoint} (${provider}):`, error);
    return null;
  }
};

// Adapter: Robust Normalization for multiple API sources
const normalizeDrama = (item: any): Drama => {
  // ID Mapping
  const id = item.bookId?.toString() || item.id?.toString() || item.link || crypto.randomUUID();
  
  // Title Mapping
  const title = item.title || item.name || item.bookName || 'Unknown Title';
  
  // Image Mapping (Aggressively check all possible fields)
  // Primary usually uses: cover, poster
  // Secondary usually uses: img, thumbnail
  const rawThumb = item.cover || item.thumbnail || item.image || item.img || item.poster;
  const rawPoster = item.poster || item.cover || item.thumbnail || item.img;
  
  // Placeholders
  const PLACEHOLDER_THUMB = 'https://placehold.co/300x450/1e1e1e/FFF?text=No+Image';
  const PLACEHOLDER_POSTER = 'https://placehold.co/1920x1080/1e1e1e/FFF?text=No+Poster';

  return {
    id: id,
    title: title,
    thumbnail: fixUrl(rawThumb) || PLACEHOLDER_THUMB,
    poster: fixUrl(rawPoster) || PLACEHOLDER_POSTER,
    rating: parseFloat(item.rating || item.score || '0') || 9.0,
    genres: Array.isArray(item.genres) ? item.genres : (item.category ? [item.category] : ['Drama']),
    description: item.intro || item.synopsis || item.description || item.desc || 'No synopsis available.',
    status: item.status || 'Ongoing',
    year: parseInt(item.year) || new Date().getFullYear(),
    latestEpisode: parseInt(item.latest_episode || item.total_episode || '0'),
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

// --- Service Methods with Fallback Logic ---

export const dramaService = {
  // Generic Fallback Handler for Lists
  // 1. Try Primary Endpoint
  // 2. If fail, Try Secondary "Home" Endpoint (since secondary serves mixed content)
  getWithFallback: async (primaryEndpoint: string): Promise<Drama[]> => {
      // 1. Try Primary
      console.log(`Trying Primary: ${primaryEndpoint}`);
      let data = await fetchFromApi(primaryEndpoint);
      
      if (data && Array.isArray(data) && data.length > 0) {
          return data.map(normalizeDrama);
      }

      // 2. Try Secondary (Gimita)
      // Path: /api/search/dramabox?action=home -> mapped via proxy
      console.log(`Primary failed, Trying Secondary: api/search/dramabox?action=home`);
      data = await fetchFromApi('api/search/dramabox', { action: 'home' }, 'secondary');

      if (data && Array.isArray(data) && data.length > 0) {
          return data.map(normalizeDrama);
      }

      // 3. Return empty array (No Mock Data)
      return [];
  },

  getForYou: async (): Promise<Drama[]> => {
    return dramaService.getWithFallback('/foryou');
  },

  getLatest: async (): Promise<Drama[]> => {
    return dramaService.getWithFallback('/latest');
  },

  getTrending: async (): Promise<Drama[]> => {
    return dramaService.getWithFallback('/trending');
  },

  getVip: async (): Promise<Drama[]> => {
    return dramaService.getWithFallback('/vip');
  },

  getDubIndo: async (): Promise<Drama[]> => {
    return dramaService.getWithFallback('/dubindo');
  },

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
    // Try Primary Detail
    let data = await fetchFromApi('/detail', { bookId: id });
    
    // If Primary fails, we might need a secondary detail logic
    // For now, if the ID came from Secondary API (which might look different),
    // we might need to adjust. Assuming Secondary API "home" result objects are complete enough
    // OR we fall back to searching specifically for it.
    
    // Note: The secondary API docs provided is just `search/dramabox?action=home`.
    // It doesn't explicitly show a detail endpoint. We rely on Primary for details for now.
    
    if (!data) return undefined;
    
    const item = Array.isArray(data) ? data[0] : data;
    return normalizeDrama(item);
  },

  search: async (query: string): Promise<Drama[]> => {
    if (!query) return [];
    
    // Try Primary Search
    let data = await fetchFromApi('/search', { query: query });
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        // Try Secondary Search (guessing endpoint based on home action)
        // Assuming ?action=search&q=... or standard search param
        // Using provided base: api/search/dramabox
        data = await fetchFromApi('api/search/dramabox', { action: 'search', query: query }, 'secondary');
    }

    if (!data || !Array.isArray(data)) return [];
    
    return data.map(normalizeDrama);
  },

  getEpisodes: async (dramaId: string): Promise<Episode[]> => {
    const data = await fetchFromApi('/allepisode', { bookId: dramaId });
    
    if (!data || !Array.isArray(data)) return [];
    
    return data
      .map((item: any) => normalizeEpisode(item, dramaId))
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  },

  getRandom: async (): Promise<Drama[]> => {
    // Fallback to trending if random endpoint fails
    const data = await fetchFromApi('/randomdrama');
    if (!data || !Array.isArray(data)) return dramaService.getTrending();
    return data.map(normalizeDrama);
  }
};
