
import React, { useEffect, useState } from 'react';
import { dramaService } from '../services/api';
import { Drama } from '../types';
import { Play, TrendingUp, Clock, Star, Gift, ChevronRight, MessageCircle } from 'lucide-react';
import { DramaCard } from './DramaCard';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';
import { DonationModal } from './DonationModal';

export const Home = () => {
    const [trending, setTrending] = useState<Drama[]>([]);
    const [popular, setPopular] = useState<Drama[]>([]);
    const [latest, setLatest] = useState<Drama[]>([]);
    const [recent, setRecent] = useState<Drama[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const [isDonationOpen, setIsDonationOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDramas = async () => {
            setLoading(true);
            try {
                const [trendData, popData, latestData, recentData] = await Promise.all([
                    dramaService.getTrending(),
                    dramaService.getPopularDramas(),
                    dramaService.getLatestDramas(),
                    dramaService.getLatest() // Using forYou or latest
                ]);
                setTrending(trendData.slice(0, 10));
                setPopular(popData.slice(0, 12));
                setLatest(latestData.slice(0, 12));
                setRecent(recentData.slice(0, 5));
            } catch (err) {
                console.error("Failed to fetch dramas:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDramas();
    }, []);

    // Auto-advance hero carousel
    useEffect(() => {
        if (recent.length === 0) return;
        const timer = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % recent.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [recent.length]);

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
            </div>
        );
    }

    const currentHero = recent[currentHeroIndex] || trending[0];

    return (
        <div className="min-h-screen bg-brand-black">
            {/* Hero Section */}
            <div className="relative h-[85vh] md:h-[90vh] w-full overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/20 to-transparent z-10" />

                {/* Main Hero Background with transition */}
                <div className="absolute inset-0 transition-all duration-1000 transform group-hover:scale-105">
                    {recent.length > 0 && recent.map((drama, idx) => (
                        <div
                            key={drama.bookId}
                            className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentHeroIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <img
                                src={drama.cover}
                                alt={drama.bookName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                    {!recent.length && trending[0] && (
                        <img
                            src={trending[0].cover}
                            alt={trending[0].bookName}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                <div className="container mx-auto px-4 h-full flex flex-col justify-end pb-20 relative z-20">
                    <div className="max-w-3xl animate-in slide-in-from-left duration-700">
                        {currentHero?.status === 'Completed' && (
                            <span className="bg-brand-orange/20 text-brand-orange backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block border border-brand-orange/30">
                                FULL EPISODE
                            </span>
                        )}
                        <h2 className="text-4xl md:text-7xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
                            {currentHero?.bookName}
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-gray-200 mb-8 font-medium">
                            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span>{currentHero?.rating || '9.2'}</span>
                            </div>
                            <span>•</span>
                            <span>{currentHero?.year || '2024'}</span>
                            <span>•</span>
                            <div className="flex gap-2">
                                {currentHero?.genres.slice(0, 2).map((g, idx) => (
                                    <span key={idx} className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-xs">{g}</span>
                                ))}
                            </div>
                        </div>

                        <p className="text-gray-300 text-sm md:text-lg mb-8 line-clamp-3 md:line-clamp-2 max-w-2xl leading-relaxed drop-shadow">
                            {currentHero?.introduction}
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <Button
                                size="lg"
                                className="rounded-full px-8 gap-2 font-black shadow-2xl shadow-brand-orange/40 hover:scale-105 active:scale-95 transition-all"
                                onClick={() => navigate(`/watch/${currentHero.bookId}`)}
                            >
                                <Play className="h-6 w-6 fill-current" /> MULAI NONTON
                            </Button>
                            <Button
                                variant="secondary"
                                size="lg"
                                className="rounded-full px-8 bg-white/10 hover:bg-white/20 border-white/10 backdrop-blur-xl text-white font-bold hover:scale-105 active:scale-95 transition-all"
                                onClick={() => navigate(`/detail/${currentHero.bookId}`)}
                            >
                                INFORMASI DETAIL
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Hero Indicators */}
                <div className="absolute bottom-8 right-4 z-20 flex gap-2">
                    {recent.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentHeroIndex(idx)}
                            className={`h-1.5 transition-all duration-300 rounded-full ${idx === currentHeroIndex ? 'w-8 bg-brand-orange' : 'w-4 bg-white/20'}`}
                        />
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 space-y-16">
                {/* Donation Banner */}
                <div className="relative overflow-hidden rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-orange-600 to-brand-orange shadow-2xl shadow-brand-orange/20 animate-in fade-in duration-1000">
                    <div className="relative z-10 text-center md:text-left">
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-2">Dukung Kami Berkembang! 🚀</h3>
                        <p className="text-orange-50/80 text-sm md:text-base max-w-xl">
                            Dracin Stream dikelola oleh komunitas secara mandiri. Bantuan donasi Anda sangat berarti untuk biaya server dan maintain layanan agar tetap stabil.
                        </p>
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => setIsDonationOpen(true)}
                            className="bg-white text-brand-orange hover:bg-orange-50 font-bold px-8 rounded-xl shadow-xl hover:scale-105 transition-transform"
                        >
                            Donasi Sekarang
                        </Button>
                        <a
                            href="https://wa.me/628123456789"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-black/20 text-white rounded-xl font-bold hover:bg-black/30 transition-all border border-white/10"
                        >
                            <MessageCircle className="h-5 w-5" /> Hubungi Admin
                        </a>
                    </div>
                    {/* Visual Decor */}
                    <Gift className="absolute -right-4 -bottom-4 h-40 w-40 text-white/10 rotate-12" />
                </div>

                {/* Trending Section */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-brand-orange/20 p-2 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-brand-orange" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">SEDANG TRENDING</h3>
                        </div>
                        <button
                            onClick={() => navigate('/category/foryou')}
                            className="text-gray-400 hover:text-brand-orange font-bold text-sm flex items-center gap-1 transition-colors group"
                        >
                            Lihat Semua <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                        {trending.map((drama) => (
                            <DramaCard key={drama.bookId} drama={drama} />
                        ))}
                    </div>
                </section>

                {/* Popular Search Section */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-brand-orange/20 p-2 rounded-lg">
                                <Star className="h-6 w-6 text-brand-orange" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">PALING POPULER</h3>
                        </div>
                        <button
                            onClick={() => navigate('/category/trending')}
                            className="text-gray-400 hover:text-brand-orange font-bold text-sm flex items-center gap-1 transition-colors group"
                        >
                            Lihat Semua <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                        {popular.map((drama) => (
                            <DramaCard key={drama.bookId} drama={drama} />
                        ))}
                    </div>
                </section>

                {/* Latest Added */}
                <section className="pb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-brand-orange/20 p-2 rounded-lg">
                                <Clock className="h-6 w-6 text-brand-orange" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">BARU DITAMBAHKAN</h3>
                        </div>
                        <button
                            onClick={() => navigate('/category/latest')}
                            className="text-gray-400 hover:text-brand-orange font-bold text-sm flex items-center gap-1 transition-colors group"
                        >
                            Lihat Semua <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                        {latest.map((drama) => (
                            <DramaCard key={drama.bookId} drama={drama} />
                        ))}
                    </div>
                </section>
            </div>

            <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} />
        </div>
    );
};
