
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dramaService } from '../services/api';
import { Drama, Episode } from '../types';
import { Play, Calendar, Star, AlignLeft, Share2, Clock, List } from 'lucide-react';
import { Button } from './ui/Button';

export const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [drama, setDrama] = useState<Drama | undefined>(undefined);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [dramaData, episodeData] = await Promise.all([
            dramaService.getById(id),
            dramaService.getEpisodes(id)
        ]);
        
        if (!dramaData) {
            setError("Drama not found");
        } else {
            setDrama(dramaData);
            setEpisodes(episodeData);
        }
      } catch (e) {
        console.error("Error loading details:", e);
        setError("Failed to load details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-black pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
      </div>
    );
  }

  if (error || !drama) {
    return (
      <div className="min-h-screen bg-brand-black pt-20 flex flex-col items-center justify-center text-white">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black pb-20">
        {/* Hero Background */}
        <div className="relative h-[50vh] w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-black/40 z-0" />
            <img 
                src={drama.cover} 
                alt={drama.bookName} 
                className="w-full h-full object-cover blur-sm scale-105"
            />
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-20">
            <div className="flex flex-col md:flex-row gap-8">
                
                {/* Poster */}
                <div className="flex-shrink-0 mx-auto md:mx-0 w-[200px] md:w-[280px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-4 border-brand-black">
                    <img 
                        src={drama.cover} 
                        alt={drama.bookName} 
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left pt-4 md:pt-12">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">{drama.bookName}</h1>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-300 mb-6">
                        <div className="flex items-center gap-1 text-brand-orange font-semibold bg-brand-orange/10 px-2 py-1 rounded">
                            <Star className="h-4 w-4 fill-current" />
                            <span>{drama.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{drama.year}</span>
                        </div>
                         <div className="flex items-center gap-1">
                            <List className="h-4 w-4" />
                            <span>{episodes.length} Episodes</span>
                        </div>
                        <span className="px-2 py-0.5 border border-white/20 rounded text-xs">{drama.status}</span>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
                        <Button 
                            size="lg" 
                            className="gap-2 px-8 rounded-full shadow-lg shadow-brand-orange/20"
                            onClick={() => navigate(`/watch/${drama.bookId}`)}
                        >
                            <Play className="h-5 w-5 fill-current" /> Start Watching
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="lg" 
                            className="gap-2 rounded-full"
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: drama.bookName,
                                        url: window.location.href
                                    });
                                }
                            }}
                        >
                            <Share2 className="h-5 w-5" /> Share
                        </Button>
                    </div>

                    <div className="mb-8 max-w-3xl">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2 justify-center md:justify-start">
                            <AlignLeft className="h-5 w-5 text-gray-400" /> Synopsis
                        </h3>
                        <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                            {drama.introduction}
                        </p>
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-8">
                        {drama.genres.map((genre, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-400 border border-white/5 hover:border-white/20 transition-colors cursor-default">
                                {genre}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Episode Grid */}
            <div className="mt-12">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <List className="h-6 w-6 text-brand-orange" /> Episodes
                </h3>
                
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {episodes.map((ep) => (
                            <button
                                key={ep.chapterId}
                                onClick={() => navigate(`/watch/${drama.bookId}`)} // In a real app, passing state to start at specific episode would be ideal, but for now we link to player
                                className="aspect-square flex items-center justify-center bg-brand-black border border-white/10 rounded-lg hover:bg-brand-orange hover:border-brand-orange hover:text-white text-gray-400 font-semibold transition-all duration-200 group relative overflow-hidden"
                            >
                                <span className="relative z-10">{ep.chapterIndex}</span>
                                {ep.chapterIndex <= 3 && (
                                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-t-brand-orange border-l-[20px] border-l-transparent opacity-50"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
