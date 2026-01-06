
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Settings, 
  Check, SkipBack, SkipForward, List, ChevronLeft, X
} from 'lucide-react';
import { Episode } from '../types';

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
  // Episode List Props
  episodes?: Episode[];
  onEpisodeSelect?: (episode: Episode) => void;
}

interface QualityLevel {
  height: number;
  level: number;
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
  episodes = [],
  onEpisodeSelect
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  // Episode List State
  const [showEpisodeList, setShowEpisodeList] = useState(false);

  // Speed Control State
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Quality Control State
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 is Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isHlsSupported, setIsHlsSupported] = useState(false);
  
  const controlsTimeoutRef = useRef<number | null>(null);
  const speeds = [0.75, 1, 1.25, 1.5, 2];

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
    setQualities([]);
    setIsHlsSupported(false);
    setCurrentQuality(-1);

    const isHlsSource = src.includes('.m3u8');

    if (isHlsSource && Hls.isSupported()) {
      setIsHlsSupported(true);
      const hls = new Hls({
        capLevelToPlayerSize: true, 
        autoStartLoad: true,
        startLevel: -1 
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((level, index) => ({
          height: level.height,
          level: index
        })).sort((a, b) => b.height - a.height); 
        setQualities(levels);
        video.play().catch(() => setIsPlaying(false));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHlsSource) {
      video.src = src;
      video.load();
      video.play().catch(() => setIsPlaying(false));
    }

    video.playbackRate = playbackRate;

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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // --- UI Helpers ---

  const handleVolumeChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);
        videoRef.current.muted = newMuteState;
        videoRef.current.volume = newMuteState ? 0 : 1;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setProgress(parseFloat(e.target.value));
    }
  };

  const toggleSpeedMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSpeedMenu(!showSpeedMenu);
    setShowQualityMenu(false);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const toggleEpisodeList = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEpisodeList(!showEpisodeList);
    // Hide controls momentarily so they don't overlap visually if needed, though z-index handles it
  };

  const selectEpisode = (ep: Episode) => {
    if (onEpisodeSelect) {
      onEpisodeSelect(ep);
      setShowEpisodeList(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    if (showSpeedMenu || showQualityMenu || showEpisodeList) return;

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

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
      onMouseLeave={() => isPlaying && !showEpisodeList && setShowControls(false)}
    >
      {/* Video Element: Object Cover for Full Vertical Immersion */}
      <video
        ref={videoRef}
        poster={poster}
        onEnded={handleVideoEnded}
        onClick={handlePlayPause}
        className="w-full h-full object-cover"
        playsInline
      />
      
      {/* Top Gradient Overlay (for Title visibility) */}
      <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* Center Play Button (Only visible when paused and list is closed) */}
      {!isPlaying && !showEpisodeList && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-10"
          onClick={handlePlayPause}
        >
          <div className="bg-black/40 backdrop-blur-sm rounded-full p-6 border border-white/10 animate-in zoom-in duration-200">
            <Play className="h-10 w-10 text-white fill-current ml-1" />
          </div>
        </div>
      )}

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
                    {episodes.map((ep) => (
                        <button
                            key={ep.chapterId}
                            onClick={() => selectEpisode(ep)}
                            className={`py-3 px-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                                episodeCurrent === ep.chapterIndex
                                ? 'bg-brand-orange border-brand-orange text-white shadow-[0_0_15px_#FF6600]'
                                : 'bg-gray-800 border-transparent text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-600'
                            }`}
                        >
                            {ep.chapterIndex}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* Bottom Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ${showControls && !showEpisodeList ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent -z-10 h-[180px] bottom-0 top-auto"></div>

        <div className="px-4 pb-6 pt-10 flex flex-col gap-2">
            
            {/* Title & Info */}
            <div className="mb-2 pl-1">
                <h2 className="text-white font-semibold text-lg drop-shadow-md line-clamp-1">{title || 'Loading...'}</h2>
            </div>

            {/* Time & Progress Bar */}
            <div className="flex items-center justify-between text-xs text-gray-300 font-medium px-1 mb-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            <div className="relative h-1 bg-white/20 rounded-full cursor-pointer group/progress touch-none">
              <div 
                className="absolute top-0 left-0 h-full bg-brand-orange rounded-full z-10"
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

            {/* Main Controls Row */}
            <div className="flex items-center justify-between mt-3">
                
                {/* Left: Play/Pause & List */}
                <div className="flex items-center gap-4">
                    <button onClick={handlePlayPause} className="text-white hover:text-brand-orange transition-colors">
                        {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
                    </button>
                    <button 
                        onClick={toggleEpisodeList}
                        className="text-white/80 hover:text-white hover:scale-110 transition-all"
                        title="Episode List"
                    >
                        <List className="h-6 w-6" />
                    </button>
                </div>

                {/* Center: Navigation */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                        disabled={!hasPrev}
                        className="text-white/80 hover:text-brand-orange disabled:opacity-30 transition-colors"
                    >
                        <SkipBack className="h-6 w-6 fill-current" />
                    </button>
                    
                    <div className="text-white text-sm font-semibold whitespace-nowrap">
                        Ep {episodeCurrent} <span className="text-white/50">/ {episodeTotal}</span>
                    </div>

                    <button 
                        onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                        disabled={!hasNext}
                        className="text-white/80 hover:text-brand-orange disabled:opacity-30 transition-colors"
                    >
                        <SkipForward className="h-6 w-6 fill-current" />
                    </button>
                </div>

                {/* Right: Settings/Mute */}
                <div className="flex items-center gap-4">
                    
                    {/* Speed Menu */}
                    <div className="relative">
                        {showSpeedMenu && (
                            <div className="absolute bottom-full right-[-10px] mb-3 bg-black/90 border border-white/10 rounded-lg overflow-hidden flex flex-col shadow-xl min-w-[60px]">
                                {speeds.map((s) => (
                                    <button
                                        key={s}
                                        onClick={(e) => { e.stopPropagation(); handleSpeedChange(s); }}
                                        className={`px-3 py-2 text-xs text-center hover:bg-white/10 ${playbackRate === s ? 'text-brand-orange' : 'text-white'}`}
                                    >
                                        {s}x
                                    </button>
                                ))}
                            </div>
                        )}
                        <button onClick={toggleSpeedMenu} className="text-white/80 hover:text-white">
                            <Settings className="h-5 w-5" />
                        </button>
                    </div>

                    <button onClick={handleVolumeChange} className="text-white/80 hover:text-white">
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
export default VideoPlayer;
