
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
      
      {/* --- LARGE PLAYER & NAVIGATION SECTION --- */}
      <div className="w-full bg-black lg:bg-brand-black lg:py-8 border-b border-white/5 pb-8">
        <div className="max-w-[1200px] mx-auto px-0 lg:px-4">
            
            {/* 1. Video Player Container */}
            <div className="w-full aspect-video bg-black lg:rounded-lg overflow-hidden shadow-2xl relative">
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

            {/* 2. Prominent Navigation Controls */}
            <div className="px-4 lg:px-0 mt-4 md:mt-6">
                <div className="flex items-center gap-3 md:gap-6">
                    {/* Previous Button */}
                    <button 
                        onClick={handlePrev}
                        disabled={!hasPrev}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg group shadow-lg"
                    >
                        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 group-hover:-translate-x-1 transition-transform" />
                        <span className="md:inline">Previous</span>
                        <span className="hidden md:inline"> Episode</span>
                    </button>

                    {/* Next Button */}
                    <button 
                        onClick={handleNext}
                        disabled={!hasNext}
                        className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-lg group shadow-lg shadow-brand-orange/20"
                    >
                        <span className="md:inline">Next</span>
                        <span className="hidden md:inline"> Episode</span>
                        <ChevronRight className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* 3. Episode Info & Auto-Play Toggle */}
                <div className="flex flex-col md:flex-row items-center justify-between mt-6 pt-4 border-t border-white/5 gap-4">
                    <div className="text-center md:text-left">
                         <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                            {currentEpisode?.chapterName}
                         </h2>
                         <p className="text-brand-orange font-medium mt-1">
                            Episode {currentIndex + 1} of {episodes.length}
                         </p>
                    </div>

                    <div 
                        className="flex items-center gap-3 cursor-pointer group bg-white/5 px-4 py-2 rounded-full hover:bg-white/10 transition-colors" 
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

        </div>
      </div>

      {/* --- CONTENT SECTION (Drama Info & List) --- */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            
            {/* Left Col: Details */}
            <div className="lg:col-span-2 space-y-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{drama.bookName}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                        <span className="bg-white/10 px-2 py-1 rounded text-white font-mono">{drama.year}</span>
                        <span className={`px-2 py-1 rounded border ${drama.status === 'Completed' ? 'border-green-500 text-green-500' : 'border-brand-orange text-brand-orange'}`}>
                            {drama.status}
                        </span>
                        <div className="flex gap-2">
                            {drama.genres.map((g, i) => (
                                <span key={i} className="text-gray-300">#{g}</span>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex gap-4 mb-8">
                        <Button variant="secondary" className="flex-1 gap-2 py-6 text-base">
                            <Plus className="h-5 w-5" /> My List
                        </Button>
                        <Button variant="secondary" className="flex-1 gap-2 py-6 text-base">
                            <Heart className="h-5 w-5" /> Like
                        </Button>
                        <Button variant="secondary" className="flex-1 gap-2 py-6 text-base">
                            <Share2 className="h-5 w-5" /> Share
                        </Button>
                    </div>

                    <div className="bg-brand-gray/30 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-white font-bold text-lg mb-3">Synopsis</h3>
                        <p className="text-gray-300 leading-relaxed text-base">
                            {drama.introduction}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Col: Episode List */}
            <div className="lg:col-span-1">
                <div className="bg-brand-gray/20 rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-brand-gray/40">
                         <h3 className="text-xl font-bold text-white">Episodes List</h3>
                         <p className="text-xs text-gray-500 mt-1">Total {episodes.length} Episodes</p>
                    </div>
                    
                    <div className="flex flex-col gap-1 max-h-[600px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-brand-gray scrollbar-track-transparent">
                        {episodes.map((ep) => (
                            <div 
                                key={ep.chapterId}
                                onClick={() => {
                                    setCurrentEpisode(ep);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                                    currentEpisode?.chapterId === ep.chapterId 
                                    ? 'bg-brand-orange/10 border border-brand-orange/30' 
                                    : 'hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <div className="relative w-28 aspect-video flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden group-hover:shadow-lg transition-all">
                                    <img 
                                        src={ep.cover || drama.cover} 
                                        className={`w-full h-full object-cover transition-opacity ${currentEpisode?.chapterId === ep.chapterId ? 'opacity-50' : 'opacity-80 group-hover:opacity-100'}`}
                                        alt={ep.chapterName} 
                                        loading="lazy" 
                                    />
                                    {currentEpisode?.chapterId === ep.chapterId && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-4 w-4 bg-brand-orange rounded-full animate-pulse shadow-[0_0_15px_#FF6600]"></div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center min-w-0">
                                    <h4 className={`font-medium text-sm truncate ${currentEpisode?.chapterId === ep.chapterId ? 'text-brand-orange' : 'text-gray-200 group-hover:text-white'}`}>
                                        {ep.chapterName}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ep {ep.chapterIndex}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
