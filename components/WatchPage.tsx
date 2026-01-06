
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama, Episode } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { PlayCircle, Share2, Heart, Plus, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, ToggleRight, ToggleLeft } from 'lucide-react';
import { Button } from './ui/Button';

export const WatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
          // 1. Fetch Drama Details (Nested Response handled in API service)
          const dramaData = await dramaService.getById(id);
          
          if (!dramaData) {
              setError("Drama not found.");
              setLoading(false);
              return;
          }
          setDrama(dramaData);

          // 2. Fetch Episodes (Direct Array handled in API service)
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

  // Monitor Episode Changes
  useEffect(() => {
    if (currentEpisode) {
        console.log('[WatchPage] Episode changed');
        console.log('[WatchPage] currentEpisodeId:', currentEpisode.chapterId);
        console.log('[WatchPage] videoUrl:', currentEpisode.videoUrl);
    }
  }, [currentEpisode]);

  // Find Current Index
  const currentIndex = episodes.findIndex(ep => ep.chapterId === currentEpisode?.chapterId);
  const hasNext = currentIndex !== -1 && currentIndex < episodes.length - 1;
  const hasPrev = currentIndex > 0;

  // Handlers
  const handleNext = () => {
    console.log('[WatchPage] handleNextEpisode called');
    console.log('[WatchPage] Current episode index:', currentIndex);
    
    if (hasNext) {
        const nextEp = episodes[currentIndex + 1];
        console.log('[WatchPage] Next episode:', nextEp);
        setCurrentEpisode(nextEp);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.log('[WatchPage] No more episodes');
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
        setCurrentEpisode(episodes[currentIndex - 1]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleVideoEnded = () => {
    console.log('[WatchPage] handleVideoEnded called. AutoPlay:', autoPlay, 'HasNext:', hasNext);
    if (autoPlay && hasNext) {
        console.log("Auto-playing next episode...");
        handleNext();
    } else if (!hasNext) {
        console.log("Series completed");
    }
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
              <p className="text-gray-400">{error || "Could not load drama details."}</p>
              <Button onClick={() => window.location.reload()} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Retry
              </Button>
          </div>
      );
  }

  // Determine Video URL
  const activeStreamUrl = currentEpisode?.videoUrl || '';

  return (
    <div className="min-h-screen bg-brand-black pt-16">
      {/* 
        Video Player Section 
        Responsive: Full width mobile, Centered max-1200px Desktop
      */}
      <div className="w-full bg-black shadow-2xl relative">
        <div className="w-full max-w-[1200px] mx-auto aspect-video">
           {activeStreamUrl ? (
              <VideoPlayer 
                src={activeStreamUrl} 
                poster={drama.cover}
                onEnded={handleVideoEnded}
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

      {/* Navigation & Controls Bar */}
      <div className="bg-brand-gray border-b border-white/5 py-4">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                  <Button 
                    variant="secondary" 
                    disabled={!hasPrev} 
                    onClick={handlePrev}
                    className="flex-1 md:flex-none gap-2"
                  >
                      <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>

                  <div className="text-center md:hidden">
                    <span className="text-sm text-gray-400 font-medium">
                        Ep {currentIndex + 1} / {episodes.length}
                    </span>
                  </div>

                  <Button 
                    variant="primary" 
                    disabled={!hasNext} 
                    onClick={handleNext}
                    className="flex-1 md:flex-none gap-2"
                  >
                      Next <ChevronRight className="h-4 w-4" />
                  </Button>
              </div>

              {/* Desktop Episode Info */}
              <div className="hidden md:block text-center">
                  <h3 className="text-white font-medium text-lg">{currentEpisode?.chapterName}</h3>
                  <span className="text-sm text-gray-400">Episode {currentIndex + 1} of {episodes.length}</span>
              </div>

              {/* Auto Play Toggle */}
              <div 
                className="flex items-center gap-3 cursor-pointer group" 
                onClick={() => setAutoPlay(!autoPlay)}
              >
                  <span className={`text-sm font-medium transition-colors ${autoPlay ? 'text-brand-orange' : 'text-gray-400'}`}>
                      Auto Play Next
                  </span>
                  {autoPlay ? (
                      <ToggleRight className="h-8 w-8 text-brand-orange transition-transform group-hover:scale-105" />
                  ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-600 transition-transform group-hover:scale-105" />
                  )}
              </div>
          </div>
      </div>

      {/* Info & Episodes List */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Details */}
        <div className="lg:col-span-2 space-y-6">
            <div>
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
                    <p>{drama.introduction}</p>
                </div>
            </div>
        </div>

        {/* Right Col: Episode List */}
        <div className="lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-4">Episodes ({episodes.length})</h3>
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto no-scrollbar pr-2 bg-brand-gray/50 p-2 rounded-lg border border-white/5">
                {episodes.map((ep) => (
                    <div 
                        key={ep.chapterId}
                        onClick={() => {
                            setCurrentEpisode(ep);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            currentEpisode?.chapterId === ep.chapterId 
                            ? 'bg-brand-orange/20 border-l-4 border-brand-orange' 
                            : 'hover:bg-white/5 bg-transparent'
                        }`}
                    >
                        <div className="relative w-28 aspect-video flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                            <img 
                                src={ep.cover || drama.cover} 
                                className="w-full h-full object-cover opacity-70" 
                                alt={ep.chapterName} 
                                loading="lazy" 
                            />
                            {currentEpisode?.chapterId === ep.chapterId && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <div className="h-3 w-3 bg-brand-orange rounded-full animate-pulse shadow-[0_0_10px_#FF6600]"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col justify-center min-w-0">
                            <h4 className={`font-medium text-sm truncate ${currentEpisode?.chapterId === ep.chapterId ? 'text-brand-orange' : 'text-white'}`}>
                                {ep.chapterName}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                                Ep {ep.chapterIndex}
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
