
import { Drama, Episode, QualityOption } from '../types';

const BASE_URL = '/api';

// --- Helper Functions ---

const fixUrl = (url?: string): string => {
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

const extractVideoUrl = (cdnList: unknown[]): string => {
    if (!Array.isArray(cdnList) || cdnList.length === 0) return '';

    // 1. Get Default CDN or first one
    const cdn = (cdnList as { isDefault?: number; videoPathList?: { quality?: number; isDefault?: number; videoPath?: string }[] }[]).find((c) => c.isDefault === 1) || cdnList[0] as { videoPathList?: { quality?: number; isDefault?: number; videoPath?: string }[] };

    if (!cdn || !Array.isArray(cdn.videoPathList)) return '';

    // 2. Find Quality 720p (preferred)
    let bestVideo = cdn.videoPathList.find((v) => v.quality === 720);

    // 3. Fallback to 1080p or any default
    if (!bestVideo) bestVideo = cdn.videoPathList.find((v) => v.quality === 1080);
    if (!bestVideo) bestVideo = cdn.videoPathList.find((v) => v.isDefault === 1);
    if (!bestVideo) bestVideo = cdn.videoPathList[0];

    return fixUrl(bestVideo?.videoPath);
};

// Extract ALL quality options from cdnList
const extractAllQualityOptions = (cdnList: unknown[]): QualityOption[] => {
    if (!Array.isArray(cdnList) || cdnList.length === 0) return [];

    // Get Default CDN or first one
    const cdn = (cdnList as { isDefault?: number; videoPathList?: { quality?: number; isDefault?: number; videoPath?: string }[] }[]).find((c) => c.isDefault === 1) || cdnList[0] as { videoPathList?: { quality?: number; isDefault?: number; videoPath?: string }[] };

    if (!cdn || !Array.isArray(cdn.videoPathList)) return [];

    // Map all quality options
    const qualityOptions: QualityOption[] = cdn.videoPathList
        .filter((v) => v.quality && v.videoPath)
        .map((v) => ({
            quality: typeof v.quality === 'number' ? v.quality : parseInt(String(v.quality)),
            videoUrl: fixUrl(v.videoPath),
            isDefault: v.isDefault === 1
        }))
        .sort((a: QualityOption, b: QualityOption) => b.quality - a.quality); // Sort by quality desc (1080 first)

    return qualityOptions;
};

// --- Normalization ---

interface RawDramaItem {
    bookId?: string | number;
    book_id?: string | number;
    id?: string | number;
    cover?: string;
    coverWap?: string;
    poster?: string;
    image?: string;
    thumbnail?: string;
    tags?: string[];
    labels?: string[];
    category?: string;
    bookName?: string;
    book_name?: string;
    title?: string;
    name?: string;
    introduction?: string;
    intro?: string;
    synopsis?: string;
    description?: string;
    score?: string | number;
    rating?: string | number;
    status?: string;
    updateStatus?: number;
    year?: string | number;
    shelfTime?: string | number;
    chapterCount?: string | number;
    latest_episode?: string | number;
    viewCount?: number;
}

const normalizeDrama = (item: RawDramaItem): Drama => {
    // Determine ID
    const id = item.bookId?.toString() || item.book_id?.toString() || item.id?.toString() || crypto.randomUUID();

    // Determine Cover
    const cover = fixUrl(item.cover || item.coverWap || item.poster || item.image || item.thumbnail);
    const PLACEHOLDER = 'https://placehold.co/300x450/1e1e1e/FFF?text=No+Cover';

    // Determine Genres
    let genres: string[] = ['Drama'];
    if (Array.isArray(item.tags) && item.tags.length > 0) genres = item.tags;
    else if (Array.isArray(item.labels) && item.labels.length > 0) genres = item.labels;
    else if (item.category) genres = [item.category];

    return {
        bookId: id,
        bookName: item.bookName || item.book_name || item.title || item.name || 'Unknown Title',
        cover: cover || PLACEHOLDER,
        introduction: item.introduction || item.intro || item.synopsis || item.description || 'No synopsis available.',

        rating: parseFloat(String(item.score || item.rating || '9.0')),
        genres: genres,
        status: (item.status || (item.updateStatus === 1 ? 'Completed' : 'Ongoing')) as 'Ongoing' | 'Completed',
        year: parseInt(String(item.year || item.shelfTime || new Date().getFullYear())),
        latestEpisode: parseInt(String(item.chapterCount || item.latest_episode || '0')),
        viewCount: item.viewCount
    };
};

interface RawEpisodeItem {
    chapterIndex?: number | string;
    episode?: number | string;
    chapterName?: string;
    title?: string;
    chapterId?: string;
    cover?: string;
    image?: string;
    cdnList?: unknown[];
    url?: string;
    stream_url?: string;
}

const normalizeEpisode = (item: RawEpisodeItem, arrayIndex: number): Episode => {
    // Priority: chapterIndex -> episode -> arrayIndex
    let rawIndex = item.chapterIndex;
    if (rawIndex === undefined || rawIndex === null) rawIndex = item.episode;

    let indexVal = parseInt(String(rawIndex));

    // Fallback: If index is NaN, use the array index + 1
    if (isNaN(indexVal)) {
        indexVal = arrayIndex + 1;
    }

    // Determine Title
    // If chapterName is empty, use "Episode {index}"
    // Note: If indexVal is 0, we might want to display it as 1 in the title if the name is missing
    const displayNum = indexVal === 0 ? 1 : indexVal;
    const title = item.chapterName || item.title || `Episode ${displayNum}`;

    // Extract quality options
    const qualityOptions = extractAllQualityOptions(item.cdnList || []);

    return {
        chapterId: item.chapterId?.toString() || crypto.randomUUID(),
        chapterIndex: indexVal,
        chapterName: title,
        cover: fixUrl(item.cover || item.image),
        videoUrl: extractVideoUrl(item.cdnList || []) || fixUrl(item.url || item.stream_url),
        qualityOptions: qualityOptions
    };
};

// --- API Fetcher ---

const fetchFromApi = async (endpoint: string, params: Record<string, string> = {}, provider: 'primary' | 'secondary' = 'primary'): Promise<unknown> => {
    const url = new URL(`${window.location.origin}${BASE_URL}/${endpoint.replace(/^\//, '')}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    if (provider === 'secondary') url.searchParams.append('provider', 'secondary');

    try {
        const res = await fetch(url.toString());
        if (!res.ok) return null;
        const json: unknown = await res.json();
        return json;
    } catch (e) {
        console.error(`[API] Error fetching ${endpoint}:`, e);
        return null;
    }
};

// --- Service Implementation ---

const getById = async (bookId: string): Promise<Drama | undefined> => {
    const json = await fetchFromApi('detail', { bookId }) as { data?: { book?: RawDramaItem }; bookId?: string; bookName?: string } | null;

    if (json && json.data && json.data.book) {
        return normalizeDrama(json.data.book);
    }

    if (json && (json.bookId || json.bookName)) {
        return normalizeDrama(json as unknown as RawDramaItem);
    }

    return undefined;
};

const getEpisodes = async (bookId: string): Promise<Episode[]> => {
    const json = await fetchFromApi('allepisode', { bookId });

    let rawList: RawEpisodeItem[] = [];
    if (Array.isArray(json)) {
        rawList = json as RawEpisodeItem[];
    } else if (json && typeof json === 'object' && 'data' in json && Array.isArray((json as { data: unknown }).data)) {
        rawList = (json as { data: RawEpisodeItem[] }).data;
    }

    const episodes = rawList.map((item: RawEpisodeItem, index: number) => normalizeEpisode(item, index));

    return episodes.sort((a: Episode, b: Episode) => a.chapterIndex - b.chapterIndex);
};

const getStreamUrl = async (bookId: string, episode: number): Promise<string | null> => {
    const json = await fetchFromApi('play', { bookId, episode: episode.toString() }) as { url?: string } | null;
    if (json && json.url) return fixUrl(json.url);
    return null;
};

const getTrending = async (): Promise<Drama[]> => {
    const json = await fetchFromApi('trending');
    const list = Array.isArray(json) ? json : ((json as { data?: RawDramaItem[] } | null)?.data || []);
    return (list as RawDramaItem[]).map(normalizeDrama);
};

// Generic search/category wrapper
const getList = async (endpoint: string, params: Record<string, string> = {}): Promise<Drama[]> => {
    const json = await fetchFromApi(endpoint, params);
    const list = Array.isArray(json) ? json : ((json as { data?: RawDramaItem[] } | null)?.data || []);
    return (list as RawDramaItem[]).map(normalizeDrama);
};

// Specific endpoints as requested
const getPopularDramas = async (): Promise<Drama[]> => {
    return getList('populersearch');
};

const getLatestDramas = async (): Promise<Drama[]> => {
    return getList('latest');
};

// Updated Category Handlers
const getForYou = (): Promise<Drama[]> => getList('foryou');
const getLatest = (): Promise<Drama[]> => getList('latest');
const getVip = (page: number = 1): Promise<Drama[]> => getList('vip', { page: page.toString() });

// Updated Dub Indo to accept pagination and classify
const getDubIndo = (page: number = 1, classify: string = 'terpopuler'): Promise<Drama[]> => {
    return getList('dubindo', {
        classify: classify,
        page: page.toString()
    });
};

export const dramaService = {
    getById,
    getEpisodes,
    getStreamUrl,
    getTrending,
    getPopularDramas, // Exported
    getLatestDramas,  // Exported
    search: (q: string): Promise<Drama[]> => getList('search', { query: q }),
    getForYou,
    getLatest,
    getVip,
    getDubIndo,
    getByCategory: (cat: string, page: number = 1, classify: string = 'terpopuler'): Promise<Drama[]> => {
        switch (cat.toLowerCase()) {
            case 'foryou': return getForYou();
            case 'trending': return getTrending();
            case 'latest': return getLatest();
            case 'vip': return getVip(page);
            case 'dubindo': return getDubIndo(page, classify);
            default: return getTrending();
        }
    }
};
