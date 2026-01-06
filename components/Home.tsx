
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama } from '../types';
import { DramaCard } from './DramaCard';
import { Play, Info, Star, Calendar, Coffee } from 'lucide-react';
import { DonationModal } from './DonationModal';

export const Home: React.FC = () => {
  const [trending, setTrending] = useState<Drama[]>([]);
  const [popular, setPopular] = useState<Drama[]>([]);
  const [recent, setRecent] = useState<Drama[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Donation Modal State
  const [showDonation, setShowDonation] = useState(false);

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

      } catch (err: any) {
        console.error('[Home] Error loading content:', err);
        setError(err.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

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

  const featuredDrama = trending[0];

  return (
    <div className="min-h-screen bg-brand-black relative">
      
      {/* 
        Redesigned Hero Section: Cinematic Split Layout 
      */}
      {featuredDrama && (
        <div className="relative w-full min-h-[650px] md:h-[90vh] flex items-center overflow-hidden mb-12">
            
            {/* 1. Atmospheric Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src={featuredDrama.cover} 
                    alt="Background" 
                    className="w-full h-full object-cover blur-3xl opacity-40 scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/60 to-transparent" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>

            {/* 2. Content Layer */}
            <div className="container mx-auto px-4 relative z-10 pt-20">
                <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 md:gap-16 items-center">
                    
                    {/* Left: Text Content */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <span className="px-3 py-1 bg-brand-orange text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-lg shadow-brand-orange/20">
                                #1 Trending
                            </span>
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-gray-200 text-xs font-semibold rounded-full border border-white/10">
                                {featuredDrama.status}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight drop-shadow-2xl">
                            {featuredDrama.bookName}
                        </h1>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm md:text-base text-gray-300 font-medium">
                            <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="h-4 w-4 fill-current" />
                                <span>{featuredDrama.rating}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{featuredDrama.year}</span>
                            </div>
                            <div className="h-1 w-1 bg-gray-500 rounded-full"></div>
                            <span>{featuredDrama.latestEpisode} Episodes</span>
                            <div className="h-1 w-1 bg-gray-500 rounded-full"></div>
                            <span className="text-brand-orange">{featuredDrama.genres[0]}</span>
                        </div>

                        <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-2xl line-clamp-3 md:line-clamp-4">
                            {featuredDrama.introduction}
                        </p>

                        <div className="flex gap-4 pt-4">
                            <Link
                                to={`/watch/${featuredDrama.bookId}`}
                                className="px-8 py-4 bg-brand-orange text-white rounded-xl hover:bg-orange-600 transition-all duration-300 font-bold flex items-center gap-3 shadow-lg shadow-brand-orange/25 group"
                            >
                                <Play className="h-5 w-5 fill-current group-hover:scale-110 transition-transform" />
                                Watch Now
                            </Link>
                            
                            <Link 
                                to={`/detail/${featuredDrama.bookId}`}
                                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold flex items-center gap-3 border border-white/10"
                            >
                                <Info className="h-5 w-5" />
                                More Info
                            </Link>
                        </div>
                    </div>

                    {/* Right: Floating Poster (Desktop Only) */}
                    <div className="hidden md:block relative group perspective-1000">
                        <div className="relative w-[350px] lg:w-[400px] aspect-[2/3] mx-auto transform rotate-3 group-hover:rotate-0 transition-all duration-700 ease-out">
                            <div className="absolute inset-0 bg-brand-orange rounded-2xl blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                            <img
                                src={featuredDrama.cover}
                                alt={featuredDrama.bookName}
                                className="relative w-full h-full object-cover rounded-2xl shadow-2xl border border-white/10"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/600x900/1e1e1e/FFF?text=No+Cover';
                                }}
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      )}

      <div className="container mx-auto px-4 pb-20">
        {/* Trending Section */}
        {trending.length > 0 && (
            <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <div className="w-1.5 h-8 bg-brand-orange rounded-full"></div>
                Trending Now
                </h2>
                <Link to="/category/trending" className="text-brand-orange text-sm font-semibold hover:text-white transition-colors">
                    View All
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {trending.slice(0, 12).map((drama) => (
                <DramaCard key={drama.bookId} drama={drama} />
                ))}
            </div>
            </section>
        )}

        {/* Popular Section */}
        {popular.length > 0 && (
            <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                Popular Dramas
                </h2>
                <Link to="/category/trending" className="text-brand-orange text-sm font-semibold hover:text-white transition-colors">
                    View All
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
                {popular.slice(0, 12).map((drama) => (
                <DramaCard key={drama.bookId} drama={drama} />
                ))}
            </div>
            </section>
        )}

        {/* Recently Added */}
        {recent.length > 0 && (
            <section>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <div className="w-1.5 h-8 bg-purple-500 rounded-full"></div>
                Recently Added
                </h2>
                <Link to="/category/latest" className="text-brand-orange text-sm font-semibold hover:text-white transition-colors">
                    View All
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
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
