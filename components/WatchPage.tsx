import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama, Episode } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { PlayCircle, Share2, Heart, Plus } from 'lucide-react';
import { Button } from './ui/Button';

export const WatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [drama, setDrama] = useState<Drama | undefined>(undefined);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      const dramaData = await dramaService.getById(id);
      const episodeData = await dramaService.getEpisodes(id);
      
      setDrama(dramaData);
      setEpisodes(episodeData);
      if (episodeData.length > 0) {
        setCurrentEpisode(episodeData[0]);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

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
      <div className="w-full bg-black shadow-2xl">
        <div className="max-w-7xl mx-auto">
           {currentEpisode ? (
              <VideoPlayer 
                src={currentEpisode.streamUrl || drama.streamUrl || ''} 
                poster={drama.poster}
              />
           ) : (
               <div className="aspect-video bg-gray-900 flex items-center justify-center text-gray-500">
                   No Stream Available
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
                    <span>{drama.genres.join(', ')}</span>
                </div>
                
                {currentEpisode && (
                    <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                        <h2 className="text-lg font-semibold text-brand-orange mb-1">
                            {currentEpisode.title}
                        </h2>
                        <p className="text-gray-400 text-sm">Now Playing</p>
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
            <h3 className="text-xl font-bold text-white mb-4">Episodes</h3>
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
                            <img src={ep.thumbnail || drama.thumbnail} className="w-full h-full object-cover opacity-70" alt={ep.title} loading="lazy" />
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
                                {drama.title} - Full HD
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};