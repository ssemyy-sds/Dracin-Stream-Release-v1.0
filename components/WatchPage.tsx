// src/components/WatchPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Drama, Episode } from '../types';
import { getDramaDetail, getAllEpisodes } from '../services/api';
import VideoPlayer from './VideoPlayer';

export default function WatchPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [drama, setDrama] = useState<Drama | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentEpisodeId = searchParams.get('episode') || episodes[0]?.chapterId;
  const currentEpisode = episodes.find(ep => ep.chapterId === currentEpisodeId);

  useEffect(() => {
    async function loadData() {
      if (!bookId) {
        setError('Book ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch drama detail and episodes in parallel
        const [dramaData, episodesData] = await Promise.all([
          getDramaDetail(bookId),
          getAllEpisodes(bookId)
        ]);

        console.log('Drama loaded:', dramaData);
        console.log('Episodes loaded:', episodesData);

        setDrama(dramaData);
        setEpisodes(episodesData);

        // Set first episode as default if no episode selected
        if (!currentEpisodeId && episodesData.length > 0) {
          setSearchParams({ episode: episodesData[0].chapterId });
        }
      } catch (err) {
        console.error('Error loading watch page:', err);
        setError(err instanceof Error ? err.message : 'Failed to load drama');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [bookId]);

  const handleEpisodeSelect = (chapterId: string) => {
    setSearchParams({ episode: chapterId });
  };

  // Get video URL from current episode
  const videoUrl = currentEpisode?.cdnList?.[0]?.videoPathList?.find(
    v => v.isDefault === 1
  )?.videoPath || currentEpisode?.cdnList?.[0]?.videoPathList?.[0]?.videoPath;

  if (loading) {
    return (
      <div className="min-h-screen bg-ultra-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-400">Loading drama...</p>
        </div>
      </div>
    );
  }

  if (error || !drama) {
    return (
      <div className="min-h-screen bg-ultra-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Drama not found'}</p>
          <a href="/" className="text-brand-orange hover:underline">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ultra-dark pt-16">
      {/* Video Player */}
      <div className="w-full bg-black">
        {videoUrl ? (
          <VideoPlayer src={videoUrl} />
        ) : (
          <div className="aspect-video flex items-center justify-center bg-gray-900">
            <p className="text-gray-400">No video available</p>
          </div>
        )}
      </div>

      {/* Drama Info & Episodes */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Drama Info */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-white mb-4">
              {drama.bookName}
            </h1>
            
            <div className="flex gap-4 mb-6">
              <img
                src={drama.cover}
                alt={drama.bookName}
                className="w-32 h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/300x450/1e1e1e/FFF?text=No+Image';
                }}
              />
              
              <div className="flex-1">
                <div className="flex gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Views</p>
                    <p className="text-white font-semibold">
                      {drama.viewCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Followers</p>
                    <p className="text-white font-semibold">
                      {drama.followCount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Episodes</p>
                    <p className="text-white font-semibold">
                      {drama.chapterCount}
                    </p>
                  </div>
                </div>
                
                {drama.tags && drama.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {drama.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-3">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed">
                {drama.introduction}
              </p>
            </div>

            {drama.performerList && drama.performerList.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xl font-bold text-white mb-3">Cast</h2>
                <div className="flex gap-4 overflow-x-auto">
                  {drama.performerList.map((performer) => (
                    <div key={performer.performerId} className="flex-shrink-0">
                      <img
                        src={performer.performerAvatar}
                        alt={performer.performerName}
                        className="w-16 h-16 rounded-full object-cover mb-2"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/100x100/1e1e1e/FFF?text=?';
                        }}
                      />
                      <p className="text-sm text-white text-center">
                        {performer.performerName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Episode List */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4">
              Episodes ({episodes.length})
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {episodes.map((episode) => (
                <button
                  key={episode.chapterId}
                  onClick={() => handleEpisodeSelect(episode.chapterId)}
                  className={`w-full text-left p-4 rounded-lg transition ${
                    currentEpisodeId === episode.chapterId
                      ? 'bg-brand-orange text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <p className="font-semibold">{episode.chapterName}</p>
                  {episode.isCharge === 1 && (
                    <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded mt-1 inline-block">
                      Premium
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
