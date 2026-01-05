
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama } from '../types';
import { DramaCard } from './DramaCard';

export const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await dramaService.search(query);
        setResults(data);
      } catch (err: any) {
        console.error('[SearchPage] Error:', err);
        setError(err.message || 'Failed to search');
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [query]);

  return (
    <div className="min-h-screen bg-brand-black pt-20">
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
              <DramaCard key={drama.bookId} drama={drama} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
