
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

    if (!response.ok) {
        // Silent fail for 404/400 to allow fallback
        return null;
    }
    
    const json = await response.json();

    // LOGIC CHECK: Many APIs return 200 OK but with { code: 404, msg: "Not Found" }
    if (json.code !== undefined && json.code !== 200 && json.code !== 0) {
        console.warn(`API Logic Error: ${json.msg || 'Unknown'}`, json);
        return null; 
    }
    
    // Validation: Handle various API response structures
    const result = json.data || json.result || json;
    
    if (!result) return null;
    if (Array.isArray(result) && result.length === 0) return null;
    if (typeof result === 'object' && Object.keys(result).length === 0) return null;
    
    return result;
  } catch (error) {
    console.error("Fetch Error:", error);
    return null;
  }
};

// Adapter: Strict mapping for api.sansekai.my.id response structure
const normalizeDrama = (item: any): Drama => {
  // ID Mapping: Priority to bookId
  const id = item.bookId?.toString() || item.book_id?.toString() || item.id?.toString() || crypto.randomUUID();
  
  // Title Mapping: bookName is the specific key from /detail
  const title = item.bookName || item.book_name || item.title || item.name || 'Unknown Title';
  
  // Image Mapping 
  const rawThumb = item.cover || item.coverWap || item.poster || item.thumb || item.thumbnail || item.image;
  const rawPoster = item.cover || item.coverWap || item.poster || item.image;
  
  // Description Mapping: 'intro' is the key from /detail
  const description = item.intro || item.introduction || item.synopsis || item.description || 'No synopsis available.';

  // Genres/Tags Mapping
  let genres = ['Drama'];
  if (Array.isArray(item.tags) && item.tags.length > 0) {
      genres = item.tags;
  } else if (Array.isArray(item.genres)) {
      genres = item.genres;
  } else if (item.category) {
      genres = [item.category];
  }

  // Episode Count
  const countRaw = item.chapterCount || item.chapter_count || item.total_chapter || item.latest_episode || '0';
  const latestEpisode = parseInt(String(countRaw), 10);

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
  // Parse episode number
  const epNum = parseInt(item.episode || item.chapterIndex || index || 0);
  
  // DEFAULT STREAM EXTRACTION LOGIC
  let streamUrl = item.url || item.stream_url || '';

  // LOGIC: Parse cdnList to find 720p mp4
  if (!streamUrl && Array.isArray(item.cdnList) && item.cdnList.length > 0) {
      // 1. Get the default CDN or the first one
      const cdn = item.cdnList.find((c: any) => c.isDefault === 1) || item.cdnList[0];
      
      if (cdn && Array.isArray(cdn.videoPathList) && cdn.videoPathList.length > 0) {
          // 2. Find Quality 720 specifically (as requested)
          let bestVideo = cdn.videoPathList.find((v: any) => v.quality === 720);
          
          // 3. Fallback: 1080 if 720 not found, then any default
          if (!bestVideo) {
             bestVideo = cdn.videoPathList.find((v: any) => v.quality === 1080);
          }
          if (!bestVideo) {
             bestVideo = cdn.videoPathList[0];
          }

          if (bestVideo && bestVideo.videoPath) {
              streamUrl = bestVideo.videoPath;
          }
      }
  }

  return {
    id: item.id?.toString() || item.chapterId?.toString() || `ep-${dramaId}-${epNum}`,
    dramaId: dramaId,
    episodeNumber: epNum,
    title: item.title || item.chapterName || `Episode ${epNum}`,
    streamUrl: fixUrl(streamUrl) || '', 
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
    let data = await fetchFromApi(primaryEndpoint);
    if (data && Array.isArray(data) && data.length > 0) {
        return data.map(normalizeDrama);
    }
    // Fallback to secondary
    data = await fetchFromApi('search/dramabox', { action: 'home' }, 'secondary');
    if (data && Array.isArray(data) && data.length > 0) {
        return data.map(normalizeDrama);
    }
    return [];
};

const getForYou = async (): Promise<Drama[]> => getWithFallback('/foryou');
const getLatest = async (): Promise<Drama[]> => getWithFallback('/latest');
const getTrending = async (): Promise<Drama[]> => getWithFallback('/trending');
const getVip = async (): Promise<Drama[]> => getWithFallback('/vip');
const getDubIndo = async (): Promise<Drama[]> => getWithFallback('/dubindo');

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
  // STRICT: Call /detail?bookId=[id]
  let data = await fetchFromApi('/detail', { bookId: id });
  
  if (!data) {
      // Fallback
      data = await fetchFromApi('search/dramabox', { action: 'detail', book_id: id }, 'secondary');
  }

  // Fallback 3: Search
  if (!data) {
       const searchData = await fetchFromApi('search/dramabox', { action: 'search', query: id }, 'secondary');
       if (searchData && Array.isArray(searchData) && searchData.length > 0) {
          const exact = searchData.find((d: any) => 
            (d.bookId?.toString() === id) || (d.id?.toString() === id)
          );
          data = exact || searchData[0];
       }
  }

  if (!data) return undefined;
  const item = Array.isArray(data) ? data[0] : data;
  return normalizeDrama(item);
};

const search = async (query: string): Promise<Drama[]> => {
  if (!query) return [];
  let data = await fetchFromApi('/search', { query: query });
  
  if (!data || !Array.isArray(data) || data.length === 0) {
      data = await fetchFromApi('search/dramabox', { action: 'search', query: query }, 'secondary');
  }

  if (!data || !Array.isArray(data)) return [];
  return data.map(normalizeDrama);
};

const getEpisodes = async (dramaId: string): Promise<Episode[]> => {
  // 1. Primary: /allepisode?bookId=[id]
  // This endpoint returns 'cdnList' with 'videoPath' inside
  let data = await fetchFromApi('/allepisode', { bookId: dramaId });
  
  if (data && Array.isArray(data) && data.length > 0) {
      return data
      .map((item: any) => normalizeEpisode(item, dramaId))
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  }

  // 2. Secondary: Gimita Chapter List
  if (!data) {
      data = await fetchFromApi('search/dramabox', { action: 'chapter_list', book_id: dramaId }, 'secondary');
      if (data && Array.isArray(data) && data.length > 0) {
          return data
          .map((item: any) => normalizeEpisode(item, dramaId))
          .sort((a, b) => a.episodeNumber - b.episodeNumber);
      }
  }

  // 3. Fallback: Virtual Episodes
  const detailData = await getById(dramaId);
  if (detailData && detailData.latestEpisode && detailData.latestEpisode > 0) {
      const virtualEpisodes: Episode[] = [];
      for (let i = 1; i <= detailData.latestEpisode; i++) {
          virtualEpisodes.push({
              id: `virt-${dramaId}-${i}`,
              dramaId: dramaId,
              episodeNumber: i,
              title: `Episode ${i}`,
              streamUrl: '', 
              thumbnail: detailData.thumbnail
          });
      }
      return virtualEpisodes;
  }

  return [];
};

const getStreamUrl = async (bookId: string, episode: number): Promise<string | null> => {
    // Note: If getEpisodes worked correctly via Primary API, we shouldn't even need to call this function often.
    
    // 1. Try Secondary API
    let data = await fetchFromApi('search/dramabox', {
        action: 'stream',
        book_id: bookId,
        episode: episode.toString()
    }, 'secondary');

    if (data && data.url) {
        return fixUrl(data.url) || null;
    }
    
    // 2. Try Primary API fallback
    data = await fetchFromApi('/play', { 
        bookId: bookId, 
        episode: episode.toString() 
    });

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
