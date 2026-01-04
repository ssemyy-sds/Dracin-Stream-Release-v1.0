
import React, { useEffect, useState } from 'react';
import { dramaService } from '../services/api';
import { Drama } from '../types';
import { DramaCard } from './DramaCard';
import { Button } from './ui/Button';
import { Play, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const [featuredDrama, setFeaturedDrama] = useState<Drama | null>(null);
  const [trendingDramas, setTrendingDramas] = useState<Drama[]>([]);
  const [latestDramas, setLatestDramas] = useState<Drama[]>([]);
  const [forYouDramas, setForYouDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch specific categories in parallel for performance
        const [trending, latest, forYou] = await Promise.all([
          dramaService.getTrending(),
          dramaService.getLatest(),
          dramaService.getForYou()
        ]);

        // Prioritize For You for hero, fallback to Trending
        const heroPool = forYou.length > 0 ? forYou : trending;
        if (heroPool.length > 0) {
          // Pick a random one from the first 5 for variety on refresh
          const randomIndex = Math.floor(Math.random() * Math.min(5, heroPool.length));
          setFeaturedDrama(heroPool[randomIndex]);
        }

        setTrendingDramas(trending);
        setLatestDramas(latest);
        setForYouDramas(forYou);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pb-20">
      {/* Hero Section */}
      {featuredDrama && (
        <div className="relative h-[85vh] w-full">
          <div className="absolute inset-0">
            <img 
              src={featuredDrama.poster} 
              alt={featuredDrama.title} 
              className="w-full h-full object-cover object-top"
              // Add robust error handler for images to prevent infinite loops and ensure display
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallback = 'https://placehold.co/1920x1080/1e1e1e/FFF?text=Image+Error';
                
                // Try thumbnail first if it's different from current src
                if (featuredDrama.thumbnail && target.src !== featuredDrama.thumbnail && !target.src.includes('placehold.co')) {
                    target.src = featuredDrama.thumbnail;
                } else if (target.src !== fallback) {
                    // Fallback to placeholder if thumbnail also fails or was already used
                    target.src = fallback;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          <div className="absolute bottom-[20%] left-0 w-full px-4 md:px-12 max-w-3xl">
            <div className="space-y-4 animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg leading-tight line-clamp-2">
                {featuredDrama.title}
              </h1>
              <div className="flex items-center gap-3 text-sm md:text-base font-medium">
                <span className="text-green-400 font-bold">New</span>
                <span className="text-gray-300">{featuredDrama.year}</span>
                <span className="border border-gray-500 px-1 text-xs rounded text-gray-300">{featuredDrama.status}</span>
                {featuredDrama.genres && featuredDrama.genres.slice(0, 3).map(g => (
                   <span key={g} className="text-gray-300">• {g}</span>
                ))}
              </div>
              <p className="text-gray-300 text-sm md:text-lg line-clamp-3 md:line-clamp-none max-w-2xl drop-shadow-md">
                {featuredDrama.description}
              </p>
              
              <div className="flex items-center gap-4 pt-4">
                <Button 
                    size="lg" 
                    className="gap-2 font-bold px-8 text-black bg-white hover:bg-gray-200"
                    onClick={() => navigate(`/watch/${featuredDrama.id}`)}
                >
                  <Play className="h-5 w-5 fill-current" /> Play
                </Button>
                <Button variant="secondary" size="lg" className="gap-2 font-bold px-8" onClick={() => navigate(`/watch/${featuredDrama.id}`)}>
                  <Info className="h-5 w-5" /> Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Rows */}
      <div className="px-4 md:px-12 -mt-24 relative z-10 space-y-12">
        
        {forYouDramas.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 pl-1 border-l-4 border-brand-orange">For You</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {forYouDramas.slice(0, 10).map((drama) => (
                <DramaCard key={drama.id} drama={drama} />
              ))}
            </div>
          </section>
        )}
        
        {trendingDramas.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 pl-1 border-l-4 border-brand-orange">Trending Now</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {trendingDramas.slice(0, 10).map((drama) => (
                <DramaCard key={drama.id} drama={drama} />
              ))}
            </div>
          </section>
        )}

        {latestDramas.length > 0 && (
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 pl-1 border-l-4 border-brand-orange">Latest Release</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {latestDramas.slice(0, 15).map((drama) => (
                <DramaCard key={drama.id} drama={drama} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
