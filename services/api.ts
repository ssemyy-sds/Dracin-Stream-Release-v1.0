
import { Drama, Episode } from '../types';

const BASE_URL = '/api';

// Helper: Fix incomplete URLs
const fixUrl = (url?: string) => {
    if (!url) return undefined;
    
    // Handle standard protocol-less URLs
    if (url.startsWith('//')) return `https:${url}`;
    
    // Handle specific relative paths often found in scraper APIs
    if (url.startsWith('/uploads') || url.startsWith('/images')) {
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
    return null;
  }
};

// Adapter: Robust Normalization for multiple API sources
const normalizeDrama = (item: any): Drama => {
  // ID Mapping: bookId is priority for Dramabox API
  const id = item.bookId?.toString() || item.id?.toString() || item.link || crypto.randomUUID();
  
  // Title Mapping: bookName is priority
  const title = item.bookName || item.title || item.name || 'Unknown Title';
  
  // Image Mapping 
  // Priority: coverWap (Dramabox) -> cover -> poster ...
  const rawThumb = item.coverWap || item.cover || item.poster || item.thumb || item.thumbnail || item.image || item.img || item.url_img;
  const rawPoster = item.coverWap || item.poster || item.cover || item.image || item.thumb || item.thumbnail || item.img;
  
  // Description Mapping: introduction is priority
  const description = item.introduction || item.intro || item.synopsis || item.description || item.desc || 'No synopsis available.';

  // Genres/Tags Mapping: tags (Array) is priority
  let genres = ['Drama'];
  if (Array.isArray(item.tags) && item.tags.length > 0) {
      genres = item.tags;
  } else if (Array.isArray(item.genres)) {
      genres = item.genres;
  } else if (item.category) {
      genres = [item.category];
  }

  // Episode Count
  const latestEpisode = parseInt(item.chapterCount || item.latest_episode || item.total_episode || '0');

  // Placeholders
  const PLACEHOLDER_THUMB = 'https://placehold.co/300x450/1e1e1e/FFF?text=No+Image';
  const PLACEHOLDER_POSTER = 'https://placehold.co/1920x1080/1e1e1e/FFF?text=No+Poster';

  return {
    id: id,
    title: title,
    thumbnail: fixUrl(rawThumb) || PLACEHOLDER_THUMB,
    poster: fixUrl(rawPoster) || PLACEHOLDER_POSTER,
    rating: parseFloat(item.rating || item.score || '0') || 9.0,
    genres: genres,
    description: description,
    status: item.status || 'Ongoing',
    year: parseInt(item.year) || new Date().getFullYear(),
    latestEpisode: latestEpisode,
    streamUrl: fixUrl(item.stream_url)
  };
};

const normalizeEpisode = (item: any, dramaId: string, index?: number): Episode => {
  const epNum = parseInt(item.episode || index || 0);
  return {
    id: item.id?.toString() || `ep-${dramaId}-${epNum}`,
    dramaId: dramaId,
    episodeNumber: epNum,
    title: item.title || `Episode ${epNum}`,
    streamUrl: item.url || item.stream_url || '', // Might be empty initially
    thumbnail: item.thumbnail || item.cover
  };
};

// --- Explicit Interface Definition ---
export interface DramaApiService {
  getWithFallback(primaryEndpoint: string): Promise<Drama[]>;
  getForYou(): Promise<Drama[]>;
  getLatest(): Promise<Drama[]>;
  getTrending(): Promise<Drama[]>;
  getVip(): Promise<Drama[]>;
  getDubIndo(): Promise<Drama[]>;
  getByCategory(category: string): Promise<Drama[]>;
  getById(id: string): Promise<Drama | undefined>;
  search(query: string): Promise<Drama[]>;
  getEpisodes(dramaId: string): Promise<Episode[]>;
  getStreamUrl(bookId: string, episode: number): Promise<string | null>;
  getRandom(): Promise<Drama[]>;
}

// --- Standalone Functions ---

const getWithFallback = async (primaryEndpoint: string): Promise<Drama[]> => {
    // 1. Try Primary
    let data = await fetchFromApi(primaryEndpoint);
    
    if (data && Array.isArray(data) && data.length > 0) {
        return data.map(normalizeDrama);
    }

    // 2. Try Secondary (Gimita) - Removed 'api/' prefix to fix double prefixing
    data = await fetchFromApi('search/dramabox', { action: 'home' }, 'secondary');

    if (data && Array.isArray(data) && data.length > 0) {
        return data.map(normalizeDrama);
    }

    return [];
};

const getForYou = async (): Promise<Drama[]> => {
  return getWithFallback('/foryou');
};

const getLatest = async (): Promise<Drama[]> => {
  return getWithFallback('/latest');
};

const getTrending = async (): Promise<Drama[]> => {
  return getWithFallback('/trending');
};

const getVip = async (): Promise<Drama[]> => {
  return getWithFallback('/vip');
};

const getDubIndo = async (): Promise<Drama[]> => {
  return getWithFallback('/dubindo');
};

const getByCategory = async (category: string): Promise<Drama[]> => {
  switch (category.toLowerCase()) {
    case 'foryou': return getForYou();
    case 'trending': return getTrending();
    case 'latest': return getLatest();
    case 'vip': return getVip();
    case 'dubindo': return getDubIndo();
    default: return getTrending();
  }
};

const getById = async (id: string): Promise<Drama | undefined> => {
  // 1. Try Primary Detail
  let data = await fetchFromApi('/detail', { bookId: id });
  
  // 2. Fallback to Secondary if primary fails or returns empty
  if (!data || (Array.isArray(data) && data.length === 0)) {
      // Try fetching via secondary API detail action
      data = await fetchFromApi('search/dramabox', { action: 'detail', book_id: id }, 'secondary');
  }

  // 3. Fallback: If still no detail, try searching it by ID (some APIs use ID as search term)
  if (!data) {
       // This is a desperate fallback to get metadata if direct detail fails
       const searchData = await fetchFromApi('search/dramabox', { action: 'search', query: id }, 'secondary');
       if (searchData && Array.isArray(searchData) && searchData.length > 0) {
           data = searchData[0]; // Assume first result is the match
       }
  }
  
  if (!data) return undefined;
  
  const item = Array.isArray(data) ? data[0] : data;
  return normalizeDrama(item);
};

const search = async (query: string): Promise<Drama[]> => {
  if (!query) return [];
  
  let data = await fetchFromApi('/search', { query: query });
  
  // Fallback to Secondary - Removed 'api/' prefix
  if (!data || !Array.isArray(data) || data.length === 0) {
      data = await fetchFromApi('search/dramabox', { action: 'search', query: query }, 'secondary');
  }

  if (!data || !Array.isArray(data)) return [];
  
  return data.map(normalizeDrama);
};

const getEpisodes = async (dramaId: string): Promise<Episode[]> => {
  // 1. Try fetching explicit episode list
  let data = await fetchFromApi('/allepisode', { bookId: dramaId });
  
  if (data && Array.isArray(data) && data.length > 0) {
      return data
      .map((item: any) => normalizeEpisode(item, dramaId))
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  }

  // 2. Try Secondary explicit list
  if (!data) {
      data = await fetchFromApi('search/dramabox', { action: 'chapter_list', book_id: dramaId }, 'secondary');
      if (data && Array.isArray(data) && data.length > 0) {
          return data
          .map((item: any) => normalizeEpisode(item, dramaId))
          .sort((a, b) => a.episodeNumber - b.episodeNumber);
      }
  }

  // 3. Fallback: Generate virtual episodes based on chapterCount from details
  // Use getById directly here instead of dramaService.getById to avoid circular dependency
  const detailData = await getById(dramaId);
  
  if (detailData && detailData.latestEpisode && detailData.latestEpisode > 0) {
      const virtualEpisodes: Episode[] = [];
      for (let i = 1; i <= detailData.latestEpisode; i++) {
          virtualEpisodes.push({
              id: `virt-${dramaId}-${i}`,
              dramaId: dramaId,
              episodeNumber: i,
              title: `Episode ${i}`,
              streamUrl: '', // Will be fetched on demand
              thumbnail: detailData.thumbnail
          });
      }
      return virtualEpisodes;
  }

  return [];
};

const getStreamUrl = async (bookId: string, episode: number): Promise<string | null> => {
    // Call: /api/search/dramabox?action=stream&book_id=...&episode=...
    // Removed 'api/' prefix because BASE_URL adds '/api' and proxy expects 'search/dramabox'
    const data = await fetchFromApi('search/dramabox', {
        action: 'stream',
        book_id: bookId,
        episode: episode.toString()
    }, 'secondary');

    if (data && data.url) {
        return fixUrl(data.url) || null;
    }
    return null;
};

const getRandom = async (): Promise<Drama[]> => {
  const data = await fetchFromApi('/randomdrama');
  if (!data || !Array.isArray(data)) return getTrending();
  return data.map(normalizeDrama);
};

// --- Export with Explicit Type ---

export const dramaService: DramaApiService = {
  getWithFallback,
  getForYou,
  getLatest,
  getTrending,
  getVip,
  getDubIndo,
  getByCategory,
  getById,
  search,
  getEpisodes,
  getStreamUrl,
  getRandom
};
