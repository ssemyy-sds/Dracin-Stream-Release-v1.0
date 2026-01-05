
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama } from '../types';
import { DramaCard } from './DramaCard';

export const Home: React.FC = () => {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDramas() {
      try {
        setLoading(true);
        const data = await dramaService.getTrending();
        setDramas(data);
      } catch (err: any) {
        console.error('[Home] Error loading dramas:', err);
        setError(err.message || 'Failed to load dramas');
      } finally {
        setLoading(false);
      }
    }

    loadDramas();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dramas...</p>
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

  const featuredDrama = dramas[0];

  return (
    <div className="min-h-screen bg-brand-black pt-20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Premium Chinese Drama Streaming
          </h1>
          <p className="text-gray-400 text-lg">
            Watch the latest and most popular Chinese dramas
          </p>
        </div>

        {/* Featured Drama */}
        {featuredDrama && (
          <div className="mb-12">
            <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden group">
              <img
                src={featuredDrama.cover}
                alt={featuredDrama.bookName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/1920x1080/1e1e1e/FFF?text=No+Cover';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {featuredDrama.bookName}
                </h2>
                <div className="flex gap-4 mb-4 text-sm md:text-base">
                  <span className="text-gray-300">{featuredDrama.status}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-300">{featuredDrama.latestEpisode} Episodes</span>
                  <span className="text-brand-orange font-bold">⭐ {featuredDrama.rating}</span>
                </div>
                {featuredDrama.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {featuredDrama.genres.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-white/10 backdrop-blur-md text-gray-200 rounded-full text-xs uppercase tracking-wide">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-gray-300 mb-6 max-w-2xl line-clamp-3">
                  {featuredDrama.introduction}
                </p>
                <div className="flex gap-4">
                  <Link
                    to={`/watch/${featuredDrama.bookId}`}
                    className="px-8 py-3 bg-brand-orange text-white rounded-lg hover:bg-orange-600 transition font-bold"
                  >
                    Watch Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trending Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-brand-orange pl-3">Trending Now</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dramas.slice(0, 12).map((drama) => (
              <DramaCard key={drama.bookId} drama={drama} />
            ))}
          </div>
        </section>

        {/* Popular Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-brand-orange pl-3">Popular Dramas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dramas.slice(12, 24).map((drama) => (
               <DramaCard key={drama.bookId} drama={drama} />
            ))}
          </div>
        </section>

        {/* Recently Added */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-brand-orange pl-3">Recently Added</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dramas.slice(24, 36).map((drama) => (
               <DramaCard key={drama.bookId} drama={drama} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
