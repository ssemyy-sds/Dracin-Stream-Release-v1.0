// components/Home.tsx
import react, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrendingDramas } from '../services/api';

export default function Home() {
  const [dramas, setDramas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDramas() {
      try {
        setLoading(true);
        const data = await getTrendingDramas();
        setDramas(data);
      } catch (err) {
        console.error('[Home] Error loading dramas:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDramas();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-ultra-dark pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dramas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ultra-dark pt-20 flex items-center justify-center">
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
    <div className="min-h-screen bg-ultra-dark pt-20">
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
        {dramas.length > 0 && (
          <div className="mb-12">
            <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden">
              <img
                src={dramas[0].cover}
                alt={dramas[0].bookName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/1920x1080/1e1e1e/FFF?text=No+Poster';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ultra-dark via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {dramas[0].bookName}
                </h2>
                <div className="flex gap-4 mb-4">
                  <span className="text-gray-300">{dramas[0].language || 'Chinese'}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-300">{dramas[0].chapterCount} Episodes</span>
                </div>
                {dramas[0].tags && dramas[0].tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dramas[0].tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-gray-300 mb-6 max-w-2xl line-clamp-3">
                  {dramas[0].introduction}
                </p>
                <div className="flex gap-4">
                  <Link
                    to={`/watch/${dramas[0].bookId}`}
                    className="px-6 py-3 bg-brand-orange text-white rounded-lg hover:bg-opacity-90 transition"
                  >
                    Watch Now
                  </Link>
                  <button className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition">
                    More Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trending Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Trending Now</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dramas.slice(0, 12).map((drama) => (
              <Link
                key={drama.bookId}
                to={`/watch/${drama.bookId}`}
                className="group"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
                  <img
                    src={drama.cover}
                    alt={drama.bookName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/300x450/1e1e1e/FFF?text=No+Image';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                    <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                    </svg>
                  </div>
                </div>
                <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-brand-orange transition">
                  {drama.bookName}
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  {drama.chapterCount} Episodes
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Popular Dramas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dramas.slice(12, 24).map((drama) => (
              <Link
                key={drama.bookId}
                to={`/watch/${drama.bookId}`}
                className="group"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
                  <img
                    src={drama.cover}
                    alt={drama.bookName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/300x450/1e1e1e/FFF?text=No+Image';
                    }}
                  />
                </div>
                <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-brand-orange transition">
                  {drama.bookName}
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  {drama.viewCount.toLocaleString()} views
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Recently Added */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Recently Added</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dramas.slice(24, 36).map((drama) => (
              <Link
                key={drama.bookId}
                to={`/watch/${drama.bookId}`}
                className="group"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
                  <img
                    src={drama.cover}
                    alt={drama.bookName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/300x450/1e1e1e/FFF?text=No+Image';
                    }}
                  />
                </div>
                <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-brand-orange transition">
                  {drama.bookName}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
