
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama } from '../types';
import { DramaCard } from './DramaCard';

export const CategoryPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!type) return;
      setLoading(true);
      try {
        const data = await dramaService.getByCategory(type);
        setDramas(data);
      } catch (error) {
        console.error("Error fetching category:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  const getTitle = (slug?: string) => {
    switch(slug?.toLowerCase()) {
      case 'foryou': return 'For You';
      case 'trending': return 'Trending Now';
      case 'latest': return 'Latest Releases';
      case 'vip': return 'VIP Exclusive';
      case 'dubindo': return 'Dubbing Indo';
      default: return 'Dramas';
    }
  };

  return (
    <div className="min-h-screen bg-brand-black pt-24 px-4 md:px-12">
      <div className="mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-white">
            {getTitle(type)}
        </h1>
        <p className="text-gray-400 mt-2 text-sm">Best selection from Dracin Stream</p>
      </div>

      {loading ? (
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({length: 10}).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-md" />
            ))}
         </div>
      ) : dramas.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {dramas.map(drama => (
            <DramaCard key={drama.bookId} drama={drama} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No dramas found in this category.</p>
        </div>
      )}
    </div>
  );
};
