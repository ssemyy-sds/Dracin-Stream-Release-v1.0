
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama, Episode } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { PlayCircle, Share2, Heart, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

export const WatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [drama, setDrama] = useState<Drama | undefined>(undefined);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      
      try {
          console.log("[WatchPage] Fetching detail for:", id);
          // 1. Fetch Drama Details (Nested Response handled in API service)
          const dramaData = await dramaService.getById(id);
          
          if (!dramaData) {
              console.error("[WatchPage] Drama data is null");
              setError("Drama not found.");
              setLoading(false);
              return;
          }
          setDrama(dramaData);

          // 2. Fetch Episodes (Direct Array handled in API service)
          const episodeData = await dramaService.getEpisodes(id);
          console.log("[WatchPage] Episodes loaded:", episodeData.length);
          
          setEpisodes(episodeData);
          
          if (episodeData.length > 0) {
            setCurrentEpisode(episodeData[0]);
          } else {
             // If API returns no episodes, maybe show a "Coming Soon" or handle error
             console.warn("[WatchPage] No episodes found in array");
          }
      } catch (e) {
          console.error("[WatchPage] Critical Error:", e);
          setError("Failed to load content.");
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
  }

  if (error || !drama) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <h2 className="text-xl font-bold">Oops! Something went wrong.</h2>
              <p className="text-gray-400">{error || "Could not load drama details."}</p>
              <Button onClick={() => window.location.reload()} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Retry
              </Button>
          </div>
      );
  }

  // Determine Video URL: Priority to currentEpisode.videoUrl extracted from cdnList
  const activeStreamUrl = currentEpisode?.videoUrl || '';

  return (
    <div className="min-h-screen bg-brand-black pt-16">
      {/* Video Section */}
      <div className="w-full bg-black shadow-2xl relative aspect-video md:aspect-auto md:h-[60vh] lg:h-[70vh]">
        <div className="w-full h-full mx-auto">
           {activeStreamUrl ? (
              <VideoPlayer 
                src={activeStreamUrl} 
                poster={drama.cover}
              />
           ) : (
               <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-gray-500 gap-2 p-4 text-center">
                   <AlertCircle className="h-10 w-10 text-gray-600" />
                   <p className="font-medium text-white">Stream not available for {currentEpisode?.chapterName}</p>
                   <p className="text-xs">Please try another episode.</p>
               </div>
           )}
        </div>
      </div>

      {/* Info & Episodes */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Details */}
        <div className="lg:col-span-2 space-y-6">
            <div>
                {/* CORRECT FIELD: bookName */}
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{drama.bookName}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span>{drama.year}</span>
                    <span className="border border-gray-600 px-1 rounded text-xs">{drama.status}</span>
                    <div className="flex gap-1">
                        {drama.genres.slice(0, 3).map((g, i) => (
                             <span key={i} className="text-gray-400">{g}{i < 2 && i < drama.genres.length -1 ? ',' : ''}</span>
                        ))}
                    </div>
                </div>
                
                {currentEpisode && (
                    <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                        {/* CORRECT FIELD: chapterName */}
                        <h2 className="text-lg font-semibold text-brand-orange mb-1">
                            {currentEpisode.chapterName}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Now Playing
                        </p>
                    </div>
                )}

                <div className="flex gap-4 mb-6">
                    <Button variant="secondary" className="flex-1 gap-2">
                        <Plus className="h-4 w-4" /> My List
                    </Button>
                    <Button variant="secondary" className="flex-1 gap-2">
                        <Heart className="h-4 w-4" /> Like
                    </Button>
                    <Button variant="secondary" className="flex-1 gap-2">
                        <Share2 className="h-4 w-4" /> Share
                    </Button>
                </div>

                <div className="text-gray-300 leading-relaxed">
                    <h3 className="text-white font-bold mb-2">Synopsis</h3>
                    {/* CORRECT FIELD: introduction */}
                    <p>{drama.introduction}</p>
                </div>
            </div>
        </div>

        {/* Right Col: Episode List */}
        <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-4">Episodes ({episodes.length})</h3>
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                {episodes.map((ep) => (
                    <div 
                        key={ep.chapterId}
                        onClick={() => setCurrentEpisode(ep)}
                        className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            currentEpisode?.chapterId === ep.chapterId 
                            ? 'bg-white/10 border-l-4 border-brand-orange' 
                            : 'hover:bg-white/5 bg-transparent'
                        }`}
                    >
                        <div className="relative w-32 aspect-video flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                            {/* Fallback to drama cover if episode cover missing */}
                            <img 
                                src={ep.cover || drama.cover} 
                                className="w-full h-full object-cover opacity-70" 
                                alt={ep.chapterName} 
                                loading="lazy" 
                            />
                            {currentEpisode?.chapterId === ep.chapterId && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <PlayCircle className="h-8 w-8 text-brand-orange fill-black" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col justify-center">
                            <h4 className={`font-medium text-sm ${currentEpisode?.chapterId === ep.chapterId ? 'text-brand-orange' : 'text-white'}`}>
                                {ep.chapterName}
                            </h4>
                            <p className="text-xs text-gray-400 line-clamp-2">
                                {drama.bookName}
                            </p>
                        </div>
                    </div>
                ))}
                {episodes.length === 0 && (
                     <div className="p-4 text-center text-gray-500 text-sm">
                         No episodes available.
                     </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
