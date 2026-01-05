
import { Drama, Episode } from '../types';

const BASE_URL = '/api';

// Helper: Fix incomplete URLs
const fixUrl = (url?: string) => {
    if (!url) return undefined;
    
    // Handle standard protocol-less URLs
    if (url.startsWith('//')) return `https:${url}`;
    
    // Handle specific relative paths often found in scraper APIs
    if (url.startsWith('/uploads') || url.startsWith('/images')) {
       // Assumption: Relative paths belong to the secondary provider if encountered there
       // But usually, we just need a valid absolute URL. 
       // If source is unknown, we can't easily fix relative / without a base.
       // However, often these are just missing http
       return url; 
    }

    if (!url.startsWith('http')) {
        // Simple heuristic: if it looks like a domain, prepend https
        if (url.includes('.') && !url.includes(' ')) return `https://${url}`;
        return url;
    }
    
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

    // Silent Fail on 400/404 to trigger fallback mechanism gracefully
    if (!response.ok) {
        if (response.status !== 404 && response.status !== 400) {
            console.warn(`API Error ${response.status} for ${endpoint} (${provider})`);
        }
        return null;
    }
    
    const json = await response.json();
    
    // Validation: Handle various API response structures
    const result = json.data || json.result || json;
    
    if (!result) return null;
    if (Array.isArray(result) && result.length === 0) return null;
    
    return result;
  } catch (error) {
    // Network errors usually mean we should try fallback
    return null;
  }
};

// Adapter: Robust Normalization for multiple API sources
const normalizeDrama = (item: any): Drama => {
  // ID Mapping
  const id = item.bookId?.toString() || item.id?.toString() || item.link || crypto.randomUUID();
  
  // Title Mapping
  const title = item.title || item.name || item.bookName || 'Unknown Title';
  
  // Image Mapping (Aggressively check all possible fields including 'thumb' for Gimita API)
  // Priority: cover -> poster -> thumb -> thumbnail -> image -> img -> url_img
  const rawThumb = item.cover || item.poster || item.thumb || item.thumbnail || item.image || item.img || item.url_img;
  
  // For poster, we try to find a high-res version, but fallback to thumb if needed
  const rawPoster = item.poster || item.cover || item.image || item.thumb || item.thumbnail || item.img;
  
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
      let data = await fetchFromApi(primaryEndpoint);
      
      if (data && Array.isArray(data) && data.length > 0) {
          return data.map(normalizeDrama);
      }

      // 2. Try Secondary (Gimita)
      // Path: /api/search/dramabox?action=home -> mapped via proxy
      // Console log removed to reduce noise in production, assume fallback is active
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
    if (!data) return undefined;
    
    const item = Array.isArray(data) ? data[0] : data;
    return normalizeDrama(item);
  },

  search: async (query: string): Promise<Drama[]> => {
    if (!query) return [];
    
    // Try Primary Search
    let data = await fetchFromApi('/search', { query: query });
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        // Try Secondary Search
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
