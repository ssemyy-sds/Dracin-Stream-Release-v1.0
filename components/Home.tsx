
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama } from '../types';
import { DramaCard } from './DramaCard';
import { Play, Info, Star, Calendar, Coffee, ChevronRight, Clock } from 'lucide-react';
import { DonationModal } from './DonationModal';

export const Home: React.FC = () => {
  const [trending, setTrending] = useState<Drama[]>([]);
  const [popular, setPopular] = useState<Drama[]>([]);
  const [recent, setRecent] = useState<Drama[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState<Drama[]>([]);

  // Donation Modal State
  const [showDonation, setShowDonation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch all data in parallel
        const [trendingData, popularData, recentData] = await Promise.all([
            dramaService.getTrending(),
            dramaService.getPopularDramas(),
            dramaService.getLatestDramas()
        ]);

        setTrending(trendingData);
        setPopular(popularData);
        setRecent(recentData);

        // Mix Trending and Recent for the Hero Slider
        // Take top 3 trending and top 3 recent
        const slides = [
            ...trendingData.slice(0, 3).map(d => ({...d, _source: 'Trending'})),
            ...recentData.slice(0, 3).map(d => ({...d, _source: 'Recently Added'}))
        ];
        setHeroSlides(slides);

      } catch (err: any) {
        console.error('[Home] Error loading content:', err);
        setError(err.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (heroSlides.length === 0) return;
    
    // Interval ganti slide (default 5-8 detik agar user sempat membaca)
    const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); 

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-400 animate-pulse">Loading best dramas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-black pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-brand-orange hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black relative pb-20">
      
      {/* 
        INTERACTIVE HERO CAROUSEL 
        Matches the reference style: Full immersive background, bottom text, orange button.
      */}
      {heroSlides.length > 0 && (
        <div className="relative w-full h-[85vh] md:h-[90vh] overflow-hidden mb-8 group">
            
            {/* Background Slides */}
            {heroSlides.map((slide, index) => (
                <div 
                    key={`${slide.bookId}-${index}`}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                     {/* Image */}
                    <div className="absolute inset-0">
                        <img 
                            src={slide.cover} 
                            alt={slide.bookName} 
                            className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-[10000ms]"
                        />
                        {/* Gradient Overlays for Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/60 to-transparent opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-black/80 via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Content Container */}
                    <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-24 md:pb-32">
                        <div className="max-w-2xl animate-in slide-in-from-bottom-10 fade-in duration-700 delay-100">
                            
                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span 
                                    className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-md border border-white/20 ${
                                        (slide as any)._source === 'Trending' 
                                        ? 'bg-brand-orange/20 text-brand-orange' 
                                        : 'bg-purple-500/20 text-purple-400'
                                    }`}
                                >
                                    {(slide as any)._source === 'Trending' ? `#${index + 1} Featured` : 'Recently Added'}
                                </span>
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-gray-200 text-xs font-semibold rounded-full border border-white/10">
                                    {slide.latestEpisode} Episodes
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-xl line-clamp-2">
                                {slide.bookName}
                            </h1>

                            {/* Synopsis / Intro */}
                            <p className="text-gray-300 text-sm md:text-lg line-clamp-2 md:line-clamp-3 mb-6 max-w-xl">
                                {slide.introduction}
                            </p>

                            {/* Action Button - Brand Orange Style */}
                            <button
                                onClick={() => navigate(`/watch/${slide.bookId}`)}
                                className="w-full md:w-auto px-8 py-3.5 bg-brand-orange text-white hover:bg-orange-600 transition-colors rounded-xl font-bold flex items-center justify-center gap-2 mb-4 shadow-lg shadow-brand-orange/20"
                            >
                                <Play className="h-5 w-5 fill-white" />
                                Tonton Sekarang
                            </button>

                            {/* Mini Tags */}
                            <div className="flex items-center gap-4 text-xs md:text-sm text-gray-400 font-medium">
                                <span className="flex items-center gap-1 text-brand-orange">
                                    <Star className="h-3 w-3 fill-current" /> {slide.rating}
                                </span>
                                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                <span>{slide.genres[0]}</span>
                                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                <span>{slide.year}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Slide Indicators (Top Right) */}
            <div className="absolute top-24 right-4 z-20 flex gap-1.5">
                {heroSlides.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`h-1 rounded-full transition-all duration-300 ${
                            idx === currentSlide ? 'w-8 bg-brand-orange' : 'w-4 bg-white/30'
                        }`}
                    />
                ))}
            </div>
        </div>
      )}

      {/* Main Content Categories */}
      <div className="container mx-auto px-4 -mt-10 relative z-10">
        
        {/* Recommendation / Trending Strip */}
        {trending.length > 0 && (
            <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-brand-orange fill-current" />
                    Rekomendasi Untukmu
                </h2>
                <Link to="/category/trending" className="text-gray-400 text-sm flex items-center hover:text-white">
                    Lihat Semua <ChevronRight className="h-4 w-4" />
                </Link>
            </div>
            {/* Horizontal Scroll Layout for "Recommendation" feel */}
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
                {trending.slice(0, 8).map((drama) => (
                    <div key={drama.bookId} className="min-w-[140px] md:min-w-[180px] snap-start">
                        <DramaCard drama={drama} />
                    </div>
                ))}
            </div>
            </section>
        )}

        {/* Popular Grid */}
        {popular.length > 0 && (
            <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                    Popular Dramas
                </h2>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                {popular.slice(0, 12).map((drama) => (
                    <DramaCard key={drama.bookId} drama={drama} />
                ))}
            </div>
            </section>
        )}

        {/* Recently Added Grid */}
        {recent.length > 0 && (
            <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                     <Clock className="h-5 w-5 text-purple-500" />
                    Baru Ditambahkan
                </h2>
                <Link to="/category/latest" className="text-gray-400 text-sm flex items-center hover:text-white">
                    Lihat Semua <ChevronRight className="h-4 w-4" />
                </Link>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                {recent.slice(0, 12).map((drama) => (
                    <DramaCard key={drama.bookId} drama={drama} />
                ))}
            </div>
            </section>
        )}
      </div>

      {/* FLOATING DONATION BUTTON */}
      <div 
        className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-2 cursor-pointer group animate-in slide-in-from-bottom-5 duration-700"
        onClick={() => setShowDonation(true)}
      >
        <div className="bg-brand-orange p-3 md:p-4 rounded-full shadow-[0_0_20px_rgba(255,102,0,0.5)] group-hover:scale-110 transition-transform duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
            <Coffee className="h-6 w-6 text-white fill-white/20" />
        </div>
        <div className="bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 shadow-lg">
             <span className="text-[10px] md:text-xs font-bold text-white whitespace-nowrap">Traktir Kopi</span>
        </div>
      </div>

      {/* DONATION MODAL */}
      <DonationModal isOpen={showDonation} onClose={() => setShowDonation(false)} />

    </div>
  );
};

export default Home;
