
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama, Episode } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { Share2, Heart, Plus, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';

export const WatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [drama, setDrama] = useState<Drama | undefined>(undefined);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  
  // Auto Play State
  const [autoPlay, setAutoPlay] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      
      try {
          const dramaData = await dramaService.getById(id);
          if (!dramaData) {
              setError("Drama not found.");
              setLoading(false);
              return;
          }
          setDrama(dramaData);

          const episodeData = await dramaService.getEpisodes(id);
          setEpisodes(episodeData);
          
          if (episodeData.length > 0) {
            setCurrentEpisode(episodeData[0]);
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

  // Find Current Index
  const currentIndex = episodes.findIndex(ep => ep.chapterId === currentEpisode?.chapterId);
  const hasNext = currentIndex !== -1 && currentIndex < episodes.length - 1;
  const hasPrev = currentIndex > 0;

  // Handlers
  const handleNext = () => {
    if (hasNext) {
        const nextEp = episodes[currentIndex + 1];
        setCurrentEpisode(nextEp);
        // Do not scroll to top, keep immersion
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
        setCurrentEpisode(episodes[currentIndex - 1]);
    }
  };

  const handleVideoEnded = () => {
    if (autoPlay && hasNext) {
        handleNext();
    }
  };

  const handleEpisodeSelect = (episode: Episode) => {
    setCurrentEpisode(episode);
  };

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
              <Button onClick={() => window.location.reload()} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Retry
              </Button>
          </div>
      );
  }

  const activeStreamUrl = currentEpisode?.videoUrl || '';

  return (
    <div className="min-h-screen bg-brand-black md:py-8 flex items-center justify-center">
      
      {/* 
        IMMERSIVE PLAYER CONTAINER 
        - Desktop: Centered, max-w-md (Mobile Simulator look), Rounded
        - Mobile: Full width/height, Edge-to-edge
      */}
      <div className="w-full md:max-w-[450px] bg-black md:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col h-[100dvh] md:h-[85vh] border border-white/5">
        
        {/* Header Overlay (Back Button) */}
        <div className="absolute top-0 left-0 z-30 p-4 w-full bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <button 
                onClick={() => navigate(-1)} 
                className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-full transition-colors"
            >
                <ArrowLeft className="h-6 w-6 text-white" />
            </button>
        </div>

        {/* Video Player Area - Takes full remaining space */}
        <div className="flex-1 relative bg-gray-900">
            {activeStreamUrl ? (
                <VideoPlayer 
                    src={activeStreamUrl} 
                    poster={drama.cover}
                    onEnded={handleVideoEnded}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    hasNext={hasNext}
                    hasPrev={hasPrev}
                    episodeCurrent={currentIndex + 1}
                    episodeTotal={episodes.length}
                    title={currentEpisode?.chapterName || drama.bookName}
                    episodes={episodes}
                    onEpisodeSelect={handleEpisodeSelect}
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                    <AlertCircle className="h-10 w-10 text-gray-600" />
                    <p>Stream unavailable</p>
                </div>
            )}
        </div>

        {/* Optional: Bottom info area (below player) for synopsis/actions if needed */}
        {/* Currently kept minimal as per "Immersive Vertical" request */}
        
      </div>

      {/* Desktop Background Ambience */}
      <div className="hidden md:block fixed inset-0 z-[-1]">
         <img src={drama.cover} className="w-full h-full object-cover blur-3xl opacity-20 scale-110" alt="" />
         <div className="absolute inset-0 bg-black/60"></div>
      </div>
    </div>
  );
};
