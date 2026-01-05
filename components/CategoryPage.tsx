
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama } from '../types';
import { DramaCard } from './DramaCard';
import { Button } from './ui/Button';
import { ArrowRight, ChevronRight, Loader2 } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Pagination & Filter State
  const [page, setPage] = useState(1);
  const [classify, setClassify] = useState<'terpopuler' | 'terbaru'>('terpopuler');
  const [isAppending, setIsAppending] = useState(false);

  // Reset state when category changes
  useEffect(() => {
    setDramas([]);
    setPage(1);
    setClassify('terpopuler');
  }, [type]);

  useEffect(() => {
    const fetchData = async () => {
      if (!type) return;
      
      // If page 1, we are doing a fresh load
      if (page === 1) {
          setLoading(true);
      } else {
          setIsAppending(true);
      }

      try {
        const data = await dramaService.getByCategory(type, page, classify);
        
        if (page === 1) {
            setDramas(data);
        } else {
            // Append new data for "Next" behavior (or we could replace if preferred, but append feels smoother)
            // User requested "Next" button, usually implies replace page, but let's stick to standard flow
            // However, to strictly follow "Show Page 1 and Next", let's append.
            // If the user wants traditional pagination, we would replace setDramas(data).
            // Let's replace for now as it's cleaner for huge lists, effectively "Next Page".
            setDramas(data);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (error) {
        console.error("Error fetching category:", error);
      } finally {
        setLoading(false);
        setIsAppending(false);
      }
    };
    fetchData();
  }, [type, page, classify]);

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

  const handleNextPage = () => {
      setPage(prev => prev + 1);
  };

  const isPaginatedCategory = type?.toLowerCase() === 'vip' || type?.toLowerCase() === 'dubindo';

  return (
    <div className="min-h-screen bg-brand-black pt-24 px-4 md:px-12 pb-12">
      <div className="mb-8 border-b border-gray-800 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white">
                {getTitle(type)}
            </h1>
            <p className="text-gray-400 mt-2 text-sm">Best selection from Dracin Stream</p>
        </div>

        {/* Filter for Dub Indo */}
        {type?.toLowerCase() === 'dubindo' && (
            <div className="flex bg-white/5 rounded-lg p-1">
                <button 
                    onClick={() => { setClassify('terpopuler'); setPage(1); }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${classify === 'terpopuler' ? 'bg-brand-orange text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Terpopuler
                </button>
                <button 
                    onClick={() => { setClassify('terbaru'); setPage(1); }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${classify === 'terbaru' ? 'bg-brand-orange text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Terbaru
                </button>
            </div>
        )}
      </div>

      {loading ? (
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({length: 10}).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-md" />
            ))}
         </div>
      ) : dramas.length > 0 ? (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
            {dramas.map(drama => (
                <DramaCard key={drama.bookId} drama={drama} />
            ))}
            </div>
            
            {/* Pagination Controls */}
            {isPaginatedCategory && (
                <div className="flex justify-center mt-8">
                    <Button 
                        onClick={handleNextPage} 
                        disabled={isAppending}
                        className="gap-2 px-8"
                        size="lg"
                    >
                        {isAppending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            <>
                                Next Page <ChevronRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            )}
        </>
      ) : (
        <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No dramas found in this category.</p>
            {type?.toLowerCase() === 'dubindo' && (
                <p className="text-gray-500 text-sm mt-2">Try switching filters or reloading.</p>
            )}
        </div>
      )}
    </div>
  );
};
