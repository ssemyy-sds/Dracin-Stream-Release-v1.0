
import React, { useEffect, useState } from 'react';
import { Play, ChevronRight, Eye, Tag, RefreshCw, AlertTriangle, Wifi } from 'lucide-react';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';

// Using Gimita Primary API for Test Home
const GIMITA_API = '/api?provider=gimita';

interface GimitaDrama {
    id: string;
    name: string;
    cover: string;
    introduction: string;
    chapterCount: number;
    playCount: string;
    cornerName?: string;
    cornerColor?: string;
    tags: { tagName: string }[];
}

interface DisplayDrama {
    bookId: string;
    bookName: string;
    cover: string;
    introduction: string;
    latestEpisode: number;
    playCount: string;
    cornerName?: string;
    cornerColor?: string;
    genres: string[];
    rating: number;
    year: number;
    status: string;
}

const normalizeGimitaDrama = (item: GimitaDrama): DisplayDrama => {
    return {
        bookId: item.id,
        bookName: item.name,
        cover: item.cover,
        introduction: item.introduction,
        latestEpisode: item.chapterCount,
        playCount: item.playCount,
        cornerName: item.cornerName || undefined,
        cornerColor: item.cornerColor || undefined,
        genres: item.tags?.map(t => t.tagName) || [],
        rating: 8.5,
        year: new Date().getFullYear(),
        status: 'Ongoing'
    };
};

export const TestHome = () => {
    const [dramas, setDramas] = useState<DisplayDrama[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchGimita = async () => {
        setLoading(true);
        setError(null);
        setErrorDetails(null);
        try {
            const apiUrl = `${window.location.origin}${GIMITA_API}&path=/home/latest`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const json = await response.json();

            if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
                const normalized = json.data.map(normalizeGimitaDrama);
                setDramas(normalized);
            } else if (json && json.error) {
                // Proxy returned an error message
                throw new Error(json.error + (json.details ? `: ${json.details}` : ''));
            } else {
                throw new Error('API mengembalikan data kosong atau format tidak valid');
            }
        } catch (err) {
            console.error("Gimita Fetch Error:", err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            
            // Check for common error types
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                setError('Gagal terhubung ke API');
                setErrorDetails('Kemungkinan masalah CORS atau jaringan. Pastikan API proxy berfungsi dengan benar.');
            } else if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
                setError('API Upstream Tidak Tersedia');
                setErrorDetails('Server Gimita tidak dapat dijangkau oleh proxy.');
            } else {
                setError('Gagal memuat data dari Gimita API');
                setErrorDetails(errorMessage);
            }
            
            // NO MOCK DATA FALLBACK - show error UI only
            setDramas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGimita();
    }, []);

    return (
        <div className="min-h-screen bg-brand-black pt-24 pb-20">
            <div className="container mx-auto px-4">

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-brand-orange font-bold text-sm mb-2 uppercase tracking-widest">
                            <span className="w-8 h-[2px] bg-brand-orange"></span>
                            Secondary API Provider
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                            GIMITA <span className="text-brand-orange">DRAMAS</span>
                        </h2>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            className="rounded-xl font-bold bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2"
                            onClick={fetchGimita}
                        >
                            <RefreshCw className="h-4 w-4" /> Refresh API
                        </Button>
                        <Button className="rounded-xl font-bold gap-2" onClick={() => navigate('/')}>
                            Kembali ke Home <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : error ? (
                    /* ERROR STATE - No Mock Data, Clear Message */
                    <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-6">
                            <AlertTriangle className="h-10 w-10 text-red-400" />
                        </div>
                        
                        <h3 className="text-2xl font-black text-white mb-3">{error}</h3>
                        
                        {errorDetails && (
                            <p className="text-gray-400 text-sm mb-6 bg-black/30 rounded-xl p-4 font-mono break-all">
                                {errorDetails}
                            </p>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button onClick={fetchGimita} className="gap-2">
                                <RefreshCw className="h-4 w-4" /> Coba Lagi
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/')} className="gap-2">
                                Kembali ke Home
                            </Button>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-white/5">
                            <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
                                <Wifi className="h-3 w-3" />
                                Jika masalah berlanjut, periksa koneksi atau hubungi admin.
                            </p>
                        </div>
                    </div>
                ) : dramas.length === 0 ? (
                    /* EMPTY STATE */
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center max-w-xl mx-auto">
                        <p className="text-gray-400">Tidak ada drama ditemukan dari API Gimita.</p>
                        <Button onClick={fetchGimita} className="mt-4 gap-2">
                            <RefreshCw className="h-4 w-4" /> Refresh
                        </Button>
                    </div>
                ) : (
                    /* SUCCESS STATE - Show Dramas */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
                        {dramas.map((drama) => (
                            <div
                                key={drama.bookId}
                                onClick={() => navigate(`/detail/${drama.bookId}`)}
                                className="group relative cursor-pointer"
                            >
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden relative shadow-2xl transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-brand-orange/20">
                                    <img
                                        src={drama.cover}
                                        alt={drama.bookName}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />

                                    {/* Play Overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div className="bg-brand-orange rounded-full p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-xl">
                                            <Play className="h-6 w-6 text-white fill-current" />
                                        </div>
                                    </div>

                                    {/* Corner Badge */}
                                    {drama.cornerName && (
                                        <div
                                            className="absolute top-0 right-0 px-3 py-1 text-[10px] font-black text-white uppercase tracking-tighter rounded-bl-xl shadow-lg z-20"
                                            style={{ backgroundColor: drama.cornerColor || '#FF6600' }}
                                        >
                                            {drama.cornerName}
                                        </div>
                                    )}

                                    {/* Stats Badge */}
                                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
                                        <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-bold flex items-center gap-1 border border-white/10">
                                            <Eye className="h-3 w-3 text-brand-orange" />
                                            {drama.playCount}
                                        </div>
                                    </div>

                                    {/* Episode Badge */}
                                    <div className="absolute bottom-3 left-3 z-30">
                                        <div className="bg-brand-orange text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                                            EP {drama.latestEpisode}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <h3 className="text-white font-bold text-sm md:text-base line-clamp-1 group-hover:text-brand-orange transition-colors">
                                        {drama.bookName}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-gray-500 text-xs flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            {drama.genres[0] || 'Drama'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
