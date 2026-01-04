import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama } from '../types';
import { DramaCard } from './DramaCard';
import { GENRES } from '../constants';

export const SearchPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('q') || '';
  const [results, setResults] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      let data = await dramaService.search(query);
      if (selectedGenre !== 'All') {
        data = data.filter(d => d.genres.includes(selectedGenre));
      }
      setResults(data);
      setLoading(false);
    };
    fetchResults();
  }, [query, selectedGenre]);

  const handleGenreClick = (genre: string) => {
    setSelectedGenre(genre);
    if (genre !== 'All' && !query) {
        navigate(`/search?q=${encodeURIComponent(genre)}`);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black pt-24 px-4 md:px-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">
            {query ? `Results for "${query}"` : 'Explore Dramas'}
        </h1>
        
        {/* Genre Filter */}
        <div className="flex flex-wrap gap-2">
            {GENRES.map(genre => (
                <button
                    key={genre}
                    onClick={() => handleGenreClick(genre)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedGenre === genre 
                        ? 'bg-white text-black' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                >
                    {genre}
                </button>
            ))}
        </div>
      </div>

      {loading ? (
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({length: 10}).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-md" />
            ))}
         </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {results.map(drama => (
            <DramaCard key={drama.id} drama={drama} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No dramas found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};