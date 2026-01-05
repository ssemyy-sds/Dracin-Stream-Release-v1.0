//Deplay ke 2 setelah update api.ts

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama, Episode } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { PlayCircle, Share2, Heart, Plus, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';

export const WatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [drama, setDrama] = useState<Drama | undefined>(undefined);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  
  // New state for the resolved stream URL
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [loadingStream, setLoadingStream] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
          const dramaData = await dramaService.getById(id);
          const episodeData = await dramaService.getEpisodes(id);
          
          setDrama(dramaData);
          setEpisodes(episodeData);
          
          if (episodeData.length > 0) {
            setCurrentEpisode(episodeData[0]);
          }
      } catch (e) {
          console.error("Failed to load drama details");
      } finally {
          setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Effect to fetch stream URL when current episode changes
  useEffect(() => {
      const fetchStream = async () => {
          if (!currentEpisode || !drama) return;

          // If the episode already has a stream URL (from primary API), use it
          if (currentEpisode.streamUrl && currentEpisode.streamUrl.length > 10) {
              setActiveStreamUrl(currentEpisode.streamUrl);
              return;
          }

          setLoadingStream(true);
          setActiveStreamUrl(''); // Reset while loading

          try {
              // Fetch from secondary API
              const url = await dramaService.getStreamUrl(drama.id, currentEpisode.episodeNumber);
              if (url) {
                  setActiveStreamUrl(url);
              }
          } catch (e) {
              console.error("Error fetching stream URL", e);
          } finally {
              setLoadingStream(false);
          }
      };

      fetchStream();
  }, [currentEpisode, drama]);

  if (loading || !drama) {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-brand-black pt-16">
      {/* Video Section */}
      <div className="w-full bg-black shadow-2xl relative aspect-video md:aspect-auto md:h-[60vh] lg:h-[70vh]">
        <div className="w-full h-full mx-auto">
           {loadingStream ? (
               <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white gap-3">
                   <div className="w-10 h-10 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-sm font-medium">Loading Stream...</p>
               </div>
           ) : activeStreamUrl ? (
              <VideoPlayer 
                src={activeStreamUrl} 
                poster={drama.poster}
              />
           ) : (
               <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-gray-500 gap-2">
                   <AlertCircle className="h-10 w-10 text-gray-600" />
                   <p>Stream not available for this episode.</p>
               </div>
           )}
        </div>
      </div>

      {/* Info & Episodes */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Details */}
        <div className="lg:col-span-2 space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{drama.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <span className="text-green-400 font-bold">{drama.rating} Match</span>
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
                        <h2 className="text-lg font-semibold text-brand-orange mb-1">
                            {currentEpisode.title}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            {loadingStream ? 'Loading source...' : 'Now Playing'}
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
                    <p>{drama.description}</p>
                </div>
            </div>
        </div>

        {/* Right Col: Episode List */}
        <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-4">Episodes ({episodes.length})</h3>
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                {episodes.map((ep) => (
                    <div 
                        key={ep.id}
                        onClick={() => setCurrentEpisode(ep)}
                        className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            currentEpisode?.id === ep.id 
                            ? 'bg-white/10 border-l-4 border-brand-orange' 
                            : 'hover:bg-white/5 bg-transparent'
                        }`}
                    >
                        <div className="relative w-32 aspect-video flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                            <img 
                                src={ep.thumbnail || drama.thumbnail} 
                                className="w-full h-full object-cover opacity-70" 
                                alt={ep.title} 
                                loading="lazy" 
                            />
                            {currentEpisode?.id === ep.id && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <PlayCircle className="h-8 w-8 text-brand-orange fill-black" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col justify-center">
                            <h4 className={`font-medium text-sm ${currentEpisode?.id === ep.id ? 'text-brand-orange' : 'text-white'}`}>
                                Episode {ep.episodeNumber}
                            </h4>
                            <p className="text-xs text-gray-400 line-clamp-2">
                                {drama.title}
                            </p>
                        </div>
                    </div>
                ))}
                {episodes.length === 0 && (
                     <div className="p-4 text-center text-gray-500 text-sm">
                         No episodes found.
                     </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
