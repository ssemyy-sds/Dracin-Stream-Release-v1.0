// components/SearchPage.tsx
import react, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchDramas } from '../services/api';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await searchDramas(query);
        setResults(data);
      } catch (err) {
        console.error('[SearchPage] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query]);

  return (
    <div className="min-h-screen bg-ultra-dark pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Search Results
        </h1>
        <p className="text-gray-400 mb-8">
          {query ? `Showing results for "${query}"` : 'Enter a search query'}
        </p>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
            <p className="text-gray-400">Searching...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Error: {error}</p>
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <div className="text-center py-12">
            <p className="text-gray-400">No results found for "{query}"</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((drama) => (
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
        )}
      </div>
    </div>
  );
}