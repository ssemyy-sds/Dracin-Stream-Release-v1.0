
import { Drama, Episode } from '../types';

const BASE_URL = '/api';

// --- Helper Functions ---

const fixUrl = (url?: string) => {
    if (!url || url === 'undefined' || url === 'null') return '';
    
    // Handle standard protocol-less URLs
    if (url.startsWith('//')) return `https:${url}`;
    
    // Handle relative paths
    if (url.startsWith('/uploads') || url.startsWith('/images')) {
       return `${window.location.origin}${url}`; 
    }

    if (!url.startsWith('http')) {
        // Heuristic: if it looks like a domain
        if (url.includes('.') && !url.includes(' ')) return `https://${url}`;
        return url;
    }
    
    return url.replace('http://', 'https://');
};

const extractVideoUrl = (cdnList: any[]): string => {
    if (!Array.isArray(cdnList) || cdnList.length === 0) return '';

    // 1. Get Default CDN or first one
    const cdn = cdnList.find((c) => c.isDefault === 1) || cdnList[0];
    
    if (!cdn || !Array.isArray(cdn.videoPathList)) return '';

    // 2. Find Quality 720p (preferred)
    let bestVideo = cdn.videoPathList.find((v: any) => v.quality === 720);
    
    // 3. Fallback to 1080p or any default
    if (!bestVideo) bestVideo = cdn.videoPathList.find((v: any) => v.quality === 1080);
    if (!bestVideo) bestVideo = cdn.videoPathList.find((v: any) => v.isDefault === 1);
    if (!bestVideo) bestVideo = cdn.videoPathList[0];

    return fixUrl(bestVideo?.videoPath);
};

// --- Normalization ---

const normalizeDrama = (item: any): Drama => {
    // Determine ID
    const id = item.bookId?.toString() || item.book_id?.toString() || item.id?.toString() || crypto.randomUUID();
    
    // Determine Cover
    const cover = fixUrl(item.cover || item.coverWap || item.poster || item.image || item.thumbnail);
    const PLACEHOLDER = 'https://placehold.co/300x450/1e1e1e/FFF?text=No+Cover';

    // Determine Genres
    let genres = ['Drama'];
    if (Array.isArray(item.tags) && item.tags.length > 0) genres = item.tags;
    else if (Array.isArray(item.labels) && item.labels.length > 0) genres = item.labels;
    else if (item.category) genres = [item.category];

    return {
        bookId: id,
        bookName: item.bookName || item.book_name || item.title || item.name || 'Unknown Title',
        cover: cover || PLACEHOLDER,
        introduction: item.introduction || item.intro || item.synopsis || item.description || 'No synopsis available.',
        
        rating: parseFloat(item.score || item.rating || '9.0'),
        genres: genres,
        status: item.status || (item.updateStatus === 1 ? 'Completed' : 'Ongoing'),
        year: parseInt(item.year || item.shelfTime || new Date().getFullYear()),
        latestEpisode: parseInt(item.chapterCount || item.latest_episode || '0'),
        viewCount: item.viewCount
    };
};

const normalizeEpisode = (item: any): Episode => {
    return {
        chapterId: item.chapterId?.toString() || crypto.randomUUID(),
        chapterIndex: parseInt(item.chapterIndex || item.episode || 0),
        chapterName: item.chapterName || item.title || `Episode ${item.chapterIndex}`,
        cover: fixUrl(item.cover || item.image),
        videoUrl: extractVideoUrl(item.cdnList || []) || fixUrl(item.url || item.stream_url)
    };
};

// --- API Fetcher ---

const fetchFromApi = async (endpoint: string, params: Record<string, string> = {}, provider: 'primary' | 'secondary' = 'primary') => {
    const url = new URL(`${window.location.origin}${BASE_URL}/${endpoint.replace(/^\//, '')}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    if (provider === 'secondary') url.searchParams.append('provider', 'secondary');

    try {
        const res = await fetch(url.toString());
        if (!res.ok) return null;
        const json = await res.json();
        return json;
    } catch (e) {
        console.error(`[API] Error fetching ${endpoint}:`, e);
        return null;
    }
};

// --- Service Implementation ---

const getById = async (bookId: string): Promise<Drama | undefined> => {
    // 1. Fetch Detail (Target: /detail?bookId=...)
    const json = await fetchFromApi('detail', { bookId });
    
    // CRITICAL: Handle Nested Structure { data: { book: ... } }
    if (json && json.data && json.data.book) {
        return normalizeDrama(json.data.book);
    }
    
    // Fallback: Check if it's flat structure or secondary provider
    if (json && (json.bookId || json.bookName)) {
        return normalizeDrama(json);
    }

    return undefined;
};

const getEpisodes = async (bookId: string): Promise<Episode[]> => {
    // 1. Fetch Episodes (Target: /allepisode?bookId=...)
    const json = await fetchFromApi('allepisode', { bookId });

    // CRITICAL: Handle Direct Array Structure [...]
    let rawList = [];
    if (Array.isArray(json)) {
        rawList = json;
    } else if (json && Array.isArray(json.data)) {
        rawList = json.data;
    }

    // Map and Filter
    const episodes = rawList.map(normalizeEpisode).filter(ep => ep.chapterIndex > 0);
    return episodes.sort((a, b) => a.chapterIndex - b.chapterIndex);
};

const getStreamUrl = async (bookId: string, episode: number): Promise<string | null> => {
    // Since we extract videoUrl in getEpisodes, this might be redundant, 
    // but kept for specific 'play' endpoint if needed.
    const json = await fetchFromApi('play', { bookId, episode: episode.toString() });
    if (json && json.url) return fixUrl(json.url);
    return null;
};

const getTrending = async (): Promise<Drama[]> => {
    const json = await fetchFromApi('trending'); // or /search/dramabox action=home
    // Handle potential response variations
    const list = Array.isArray(json) ? json : (json?.data || []);
    return list.map(normalizeDrama);
};

// Generic search/category wrapper
const getList = async (endpoint: string, params: any = {}): Promise<Drama[]> => {
    const json = await fetchFromApi(endpoint, params);
    const list = Array.isArray(json) ? json : (json?.data || []);
    return list.map(normalizeDrama);
};

export const dramaService = {
    getById,
    getEpisodes,
    getStreamUrl,
    getTrending,
    search: (q: string) => getList('search', { query: q }),
    getForYou: () => getList('foryou'),
    getLatest: () => getList('latest'),
    getVip: () => getList('vip'),
    getDubIndo: () => getList('dubindo'),
    getByCategory: (cat: string) => {
        if (cat === 'trending') return getTrending();
        return getList(cat); // simplified
    }
};
