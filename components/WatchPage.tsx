
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama, Episode } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { useIsFavorite } from '../hooks/useFavorites';

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

  // Quality State
  const [currentQuality, setCurrentQuality] = useState<number>(720);

  // Favorites
  const { isFavorite, toggle: toggleFavorite } = useIsFavorite(id || '');

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
          // Set initial quality to default or 720
          const firstEp = episodeData[0];
          if (firstEp.qualityOptions && firstEp.qualityOptions.length > 0) {
            const defaultQuality = firstEp.qualityOptions.find(q => q.isDefault) || firstEp.qualityOptions[0];
            setCurrentQuality(defaultQuality.quality);
          }
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

  // Calculate active stream URL based on quality
  const getActiveStreamUrl = () => {
    if (!currentEpisode) return '';

    // Try to get the selected quality URL
    const qualityOption = currentEpisode.qualityOptions?.find(q => q.quality === currentQuality);
    if (qualityOption) return qualityOption.videoUrl;

    // Fallback to default videoUrl
    return currentEpisode.videoUrl || '';
  };

  const activeStreamUrl = getActiveStreamUrl();

  // Handlers
  const handleNext = () => {
    if (hasNext) {
      const nextEp = episodes[currentIndex + 1];
      setCurrentEpisode(nextEp);
      // Reset quality to default for new episode
      if (nextEp.qualityOptions && nextEp.qualityOptions.length > 0) {
        const defaultQuality = nextEp.qualityOptions.find(q => q.isDefault) || nextEp.qualityOptions[0];
        setCurrentQuality(defaultQuality.quality);
      }
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      const prevEp = episodes[currentIndex - 1];
      setCurrentEpisode(prevEp);
      // Reset quality to default for new episode
      if (prevEp.qualityOptions && prevEp.qualityOptions.length > 0) {
        const defaultQuality = prevEp.qualityOptions.find(q => q.isDefault) || prevEp.qualityOptions[0];
        setCurrentQuality(defaultQuality.quality);
      }
    }
  };

  const handleVideoEnded = () => {
    if (autoPlay && hasNext) {
      handleNext();
    }
  };

  const handleEpisodeSelect = (episode: Episode) => {
    setCurrentEpisode(episode);
    // Reset quality to default for new episode
    if (episode.qualityOptions && episode.qualityOptions.length > 0) {
      const defaultQuality = episode.qualityOptions.find(q => q.isDefault) || episode.qualityOptions[0];
      setCurrentQuality(defaultQuality.quality);
    }
  };

  const handleQualityChange = (quality: number, videoUrl: string) => {
    setCurrentQuality(quality);
    // The video will automatically reload with new URL via activeStreamUrl
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

  return (
    <div className="min-h-screen bg-brand-black md:py-8 flex items-center justify-center">

      {/* 
        IMMERSIVE PLAYER CONTAINER 
        - Desktop: Centered, max-w-md (Mobile Simulator look), Rounded
        - Mobile: Full width/height, Edge-to-edge
      */}
      <div className="w-full md:max-w-[450px] bg-black md:rounded-3xl shadow-2xl relative overflow-hidden flex flex-col h-[100dvh] md:h-[85vh] border border-white/5">

        {/* Video Player Area - Takes full space, controls are inside */}
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
              dramaTitle={drama.bookName}
              episodes={episodes}
              onEpisodeSelect={handleEpisodeSelect}
              isFavorite={isFavorite}
              onToggleFavorite={() => drama && toggleFavorite(drama)}
              onBack={() => navigate(-1)}
              qualityOptions={currentEpisode?.qualityOptions || []}
              currentQuality={currentQuality}
              onQualityChange={handleQualityChange}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
              <AlertCircle className="h-10 w-10 text-gray-600" />
              <p>Stream unavailable</p>
            </div>
          )}
        </div>

      </div>

      {/* Desktop Background Ambience */}
      <div className="hidden md:block fixed inset-0 z-[-1]">
        <img src={drama.cover} className="w-full h-full object-cover blur-3xl opacity-20 scale-110" alt="" />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
    </div>
  );
};
