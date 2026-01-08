
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Heart, Share2, List, X, ChevronLeft, SkipBack, SkipForward
} from 'lucide-react';
import { Episode, QualityOption } from '../types';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onEnded?: () => void;
  // Navigation props
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  episodeCurrent?: number;
  episodeTotal?: number;
  title?: string;
  dramaTitle?: string;
  // Episode List Props
  episodes?: Episode[];
  onEpisodeSelect?: (episode: Episode) => void;
  // Favorites props
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  // Back button
  onBack?: () => void;
  // Quality options from API
  qualityOptions?: QualityOption[];
  currentQuality?: number; // e.g., 720, 1080
  onQualityChange?: (quality: number, videoUrl: string) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  onEnded,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  episodeCurrent,
  episodeTotal,
  title,
  dramaTitle,
  episodes = [],
  onEpisodeSelect,
  isFavorite = false,
  onToggleFavorite,
  onBack,
  qualityOptions = [],
  currentQuality = 720,
  onQualityChange
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Episode List State
  const [showEpisodeList, setShowEpisodeList] = useState(false);

  // Quality Menu State
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Double-click tracking for favorite button
  const lastFavoriteClickRef = useRef<number>(0);

  const controlsTimeoutRef = useRef<number | null>(null);

  // --- Main Effect: Load Source & HLS Management ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    video.pause();
    video.removeAttribute('src');
    video.load();
    setIsPlaying(false);
    setProgress(0);

    const isHlsSource = src.includes('.m3u8');

    if (isHlsSource && Hls.isSupported()) {
      const hls = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: true,
        startLevel: -1
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => setIsPlaying(false));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHlsSource) {
      video.src = src;
      video.load();
      video.play().catch(() => setIsPlaying(false));
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  // --- Event Handlers ---
  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (onEnded) onEnded();
  };

  const updateProgress = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / dur) * 100);
      setDuration(dur);
    }
  };

  const handlePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const video = videoRef.current;
    if (video) {
      if (video.paused || video.ended) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  // Bind Standard Events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  // --- UI Helpers ---
  const handleVolumeChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMuteState = !isMuted;
      setIsMuted(newMuteState);
      videoRef.current.muted = newMuteState;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const handleQualitySelect = (quality: number) => {
    const selectedQuality = qualityOptions.find(q => q.quality === quality);
    if (selectedQuality && onQualityChange) {
      onQualityChange(quality, selectedQuality.videoUrl);
    }
    setShowQualityMenu(false);
  };

  const toggleEpisodeList = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEpisodeList(!showEpisodeList);
    setShowQualityMenu(false);
  };

  const selectEpisode = (ep: Episode) => {
    if (onEpisodeSelect) {
      onEpisodeSelect(ep);
      setShowEpisodeList(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: dramaTitle || title || 'Dracin Stream',
          text: `Tonton ${dramaTitle || title} di Dracin Stream!`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link disalin ke clipboard!');
    }
  };

  // Handle favorite click with double-click detection for back navigation
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const timeSinceLastClick = now - lastFavoriteClickRef.current;

    if (timeSinceLastClick < 300) {
      // Double-click detected - go back
      onBack?.();
    } else {
      // Single click - toggle favorite
      onToggleFavorite?.();
    }

    lastFavoriteClickRef.current = now;
  };

  const toggleFullscreen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    if (showQualityMenu || showEpisodeList) return;

    controlsTimeoutRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 1080) return '1080P';
    if (quality >= 720) return '720P';
    if (quality >= 480) return '480P';
    if (quality >= 360) return '360P';
    return `${quality}P`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black group overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
      onTouchStart={handleMouseMove}
      onMouseLeave={() => isPlaying && !showEpisodeList && !showQualityMenu && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        onEnded={handleVideoEnded}
        onClick={handlePlayPause}
        className="w-full h-full object-cover"
        playsInline
      />

      {/* Top Header */}
      <div className={`absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Back Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onBack?.(); }}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>

        {/* Episode Indicator - Hidden on mobile to prevent overlap with navbar */}
        <div className="hidden sm:block bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
          <span className="text-white text-sm font-medium">
            EPISODE <span className="font-bold text-brand-orange">{episodeCurrent}</span>
          </span>
        </div>
      </div>

      {/* Center Play Button (Only visible when paused) */}
      {!isPlaying && !showEpisodeList && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          onClick={handlePlayPause}
        >
          <div className="bg-black/40 backdrop-blur-sm rounded-full p-6 border border-white/10 animate-in zoom-in duration-200">
            <Play className="h-12 w-12 text-white fill-current ml-1" />
          </div>
        </div>
      )}

      {/* RIGHT SIDEBAR - TikTok Style Action Bar */}
      <div className={`absolute right-3 bottom-[180px] z-30 flex flex-col items-center gap-5 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>

        {/* Favorite Button - Double-click to go back */}
        <button
          onClick={handleFavoriteClick}
          className="flex flex-col items-center gap-1 group/fav"
          title="Klik 2x untuk kembali"
        >
          <div className={`p-3 rounded-full transition-all ${isFavorite ? 'bg-red-500' : 'bg-white/20 backdrop-blur-md'} group-hover/fav:scale-110`}>
            <Heart className={`h-6 w-6 transition-all ${isFavorite ? 'text-white fill-current' : 'text-white'}`} />
          </div>
          <span className="text-white text-[10px] font-medium uppercase tracking-wide">Favorit</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 group/share"
        >
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-md group-hover/share:scale-110 transition-all">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-[10px] font-medium uppercase tracking-wide">Bagikan</span>
        </button>

        {/* Quality Selector - Now uses API quality options */}
        <div className="relative">
          {showQualityMenu && qualityOptions.length > 0 && (
            <div className="absolute right-full mr-3 bottom-0 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[80px] animate-in slide-in-from-right-2 duration-200">
              {qualityOptions.map((q) => (
                <button
                  key={q.quality}
                  onClick={(e) => { e.stopPropagation(); handleQualitySelect(q.quality); }}
                  className={`w-full px-4 py-2.5 text-xs text-left hover:bg-white/10 transition-colors ${currentQuality === q.quality ? 'text-brand-orange font-bold' : 'text-white'}`}
                >
                  {getQualityLabel(q.quality)}
                  {q.isDefault && <span className="ml-1 text-gray-400">•</span>}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); }}
            className="flex flex-col items-center gap-1 group/quality"
          >
            <div className="px-3 py-2 rounded-full bg-white/20 backdrop-blur-md group-hover/quality:scale-110 transition-all">
              <span className="text-white text-xs font-bold">
                {getQualityLabel(currentQuality)}
              </span>
            </div>
            <span className="text-white text-[10px] font-medium uppercase tracking-wide">Kualitas</span>
          </button>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="flex flex-col items-center gap-1 group/fs"
        >
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-md group-hover/fs:scale-110 transition-all">
            {isFullscreen ? <Minimize className="h-6 w-6 text-white" /> : <Maximize className="h-6 w-6 text-white" />}
          </div>
          <span className="text-white text-[10px] font-medium uppercase tracking-wide">Layar</span>
        </button>
      </div>

      {/* BOTTOM SECTION - Title, Progress, Controls */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ${showControls && !showEpisodeList ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent -z-10 h-[200px] bottom-0 top-auto pointer-events-none"></div>

        <div className="px-4 pb-6 pt-12">

          {/* Title & Episode Info */}
          <div className="mb-4 pr-16">
            <h2 className="text-white font-bold text-lg drop-shadow-md leading-tight">
              {dramaTitle || 'Loading...'}
            </h2>
            <p className="text-gray-300 text-sm mt-1">Episode {episodeCurrent}</p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-white/70 text-xs font-medium w-10">{formatTime(currentTime)}</span>
            <div className="relative flex-1 h-1 bg-white/20 rounded-full cursor-pointer group/progress">
              <div
                className="absolute top-0 left-0 h-full bg-brand-orange rounded-full z-10 transition-all"
                style={{ width: `${progress}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress || 0}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              />
            </div>
            <span className="text-white/70 text-xs font-medium w-10 text-right">{formatTime(duration)}</span>
          </div>

          {/* Bottom Controls Row */}
          <div className="flex items-center justify-between">

            {/* Left: Play/Pause & Mute */}
            <div className="flex items-center gap-3">
              <button onClick={handlePlayPause} className="text-white hover:text-brand-orange transition-colors">
                {isPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current" />}
              </button>
              <button onClick={handleVolumeChange} className="text-white/80 hover:text-white transition-colors">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>

            {/* Center: Episode Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                disabled={!hasPrev}
                className="text-white/80 hover:text-brand-orange disabled:opacity-30 transition-colors"
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </button>

              <button
                onClick={toggleEpisodeList}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-xs font-semibold transition-colors"
              >
                Ep {episodeCurrent}/{episodeTotal}
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                disabled={!hasNext}
                className="text-white/80 hover:text-brand-orange disabled:opacity-30 transition-colors"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>
            </div>

            {/* Right: Episode List */}
            <button
              onClick={toggleEpisodeList}
              className="text-white/80 hover:text-white transition-colors"
              title="Episode List"
            >
              <List className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Episode List Overlay (Drawer) */}
      {showEpisodeList && (
        <div
          className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black">
            <h3 className="text-white font-bold text-lg">Episodes ({episodes.length})</h3>
            <button
              onClick={() => setShowEpisodeList(false)}
              className="p-2 text-gray-400 hover:text-white bg-white/10 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {episodes.map((ep, idx) => (
                <button
                  key={ep.chapterId}
                  onClick={() => selectEpisode(ep)}
                  className={`py-3 px-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${episodeCurrent === (idx + 1)
                    ? 'bg-brand-orange border-brand-orange text-white shadow-[0_0_15px_#FF6600]'
                    : 'bg-gray-800 border-transparent text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-600'
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
