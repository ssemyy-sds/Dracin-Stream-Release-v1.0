
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, Check } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onEnded?: () => void;
}

interface QualityLevel {
  height: number;
  level: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  // Speed Control State
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Quality Control State
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 is Auto
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isHlsSupported, setIsHlsSupported] = useState(false);
  
  const controlsTimeoutRef = useRef<number | null>(null);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // --- Main Effect: Load Source & HLS Management ---
  useEffect(() => {
    console.log('[VideoPlayer] useEffect triggered');
    console.log('[VideoPlayer] src:', src);
    console.log('[VideoPlayer] videoRef.current:', videoRef.current);

    const video = videoRef.current;
    if (!video || !src) {
        console.log('[VideoPlayer] Missing src or videoRef, skipping');
        return;
    }

    // 1. Cleanup Previous HLS Instance
    if (hlsRef.current) {
      console.log('[VideoPlayer] Destroying old HLS instance');
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // 2. Reset Video Element State (Critical for manual next)
    console.log('[VideoPlayer] Resetting video element');
    video.pause();
    video.removeAttribute('src'); 
    video.load();
    setIsPlaying(false);
    setProgress(0);
    setQualities([]);
    setIsHlsSupported(false);
    setCurrentQuality(-1);

    // 3. Initialize Player based on Format
    const isHlsSource = src.includes('.m3u8');

    if (isHlsSource && Hls.isSupported()) {
      console.log('[VideoPlayer] HLS is supported, creating new instance');
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
        console.log('[VideoPlayer] Manifest parsed, ready to play');
        const levels = hls.levels.map((level, index) => ({
          height: level.height,
          level: index
        })).sort((a, b) => b.height - a.height); 

        setQualities(levels);

        // Attempt Auto-Play after load
        video.play().catch(err => {
            console.warn('[VideoPlayer] Auto-play blocked or failed:', err);
            setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            console.error('[VideoPlayer] HLS Fatal Error:', data);
          }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !isHlsSource) {
      // Native HLS (Safari) or standard MP4
      console.log('[VideoPlayer] Using Native Playback');
      video.src = src;
      
      // Check native HLS support for quality UI toggle (usually not available natively)
      if (isHlsSource) {
         setIsHlsSupported(false); 
      }

      video.load();
      // Attempt Auto-Play
      video.play().catch(err => {
          console.warn('[VideoPlayer] Auto-play blocked or failed:', err);
          setIsPlaying(false);
      });
    }

    // Restore user preference for playback rate
    video.playbackRate = playbackRate;

    // Cleanup on unmount or src change
    return () => {
      console.log('[VideoPlayer] Cleanup useEffect');
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  // --- Event Handlers ---

  const handleVideoEnded = () => {
      console.log('[VideoPlayer] Video ended event fired');
      setIsPlaying(false);
      if (onEnded) {
          console.log('[VideoPlayer] Calling onEnded callback');
          onEnded();
      }
  };

  const updateProgress = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
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
      
      // NOTE: 'ended' is handled via JSX prop to ensure no duplicate listeners
      
      return () => {
          video.removeEventListener('timeupdate', updateProgress);
          video.removeEventListener('play', onPlay);
          video.removeEventListener('pause', onPause);
      };
  }, []);

  // Apply playback rate when state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // --- UI Helpers ---

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuteState = !isMuted;
      setIsMuted(newMuteState);
      videoRef.current.muted = newMuteState;
      if (!newMuteState) {
          videoRef.current.volume = volume || 1;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  };

  const toggleSpeedMenu = () => {
    const newState = !showSpeedMenu;
    setShowSpeedMenu(newState);
    if (newState) {
      setShowQualityMenu(false); 
      resetControlsTimeout();
    }
  };

  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setCurrentQuality(level);
      setShowQualityMenu(false);
    }
  };

  const toggleQualityMenu = () => {
    const newState = !showQualityMenu;
    setShowQualityMenu(newState);
    if (newState) {
      setShowSpeedMenu(false); 
      resetControlsTimeout();
    }
  };

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    
    if (showSpeedMenu || showQualityMenu) return;

    controlsTimeoutRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
          setShowControls(false);
      }
    }, 2500);
  };

  const handleMouseLeave = () => {
    if (showSpeedMenu || showQualityMenu) return;
    if (isPlaying) setShowControls(false);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getCurrentQualityLabel = () => {
    if (currentQuality === -1) return "Auto";
    const quality = qualities.find(q => q.level === currentQuality);
    return quality ? `${quality.height}p` : "Auto";
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black group overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        poster={poster}
        onEnded={handleVideoEnded}
        onClick={handlePlayPause}
        className="w-full h-full object-contain"
        playsInline
      />
      
      {/* Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Bar */}
        <div className="relative h-1 bg-gray-600 rounded-full cursor-pointer group/progress mb-4">
          <div 
            className="absolute top-0 left-0 h-full bg-brand-orange rounded-full z-10"
            style={{ width: `${progress}%` }}
          />
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progress || 0} 
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handlePlayPause} className="text-white hover:text-brand-orange transition-colors">
              {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
            </button>
            
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-white hover:text-gray-300">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange}
                className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            <div className="text-white text-xs font-mono">
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quality Control (Only if HLS is supported) */}
            {isHlsSupported && qualities.length > 0 && (
              <div className="relative">
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-4 bg-black/90 border border-white/20 rounded-lg overflow-hidden flex flex-col shadow-xl z-50 min-w-[100px]">
                    <button
                      onClick={() => handleQualityChange(-1)}
                      className={`px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors flex justify-between items-center ${currentQuality === -1 ? 'text-brand-orange font-bold' : 'text-white'}`}
                    >
                      Auto {currentQuality === -1 && <Check className="h-3 w-3" />}
                    </button>
                    {qualities.map((q) => (
                      <button
                        key={q.level}
                        onClick={() => handleQualityChange(q.level)}
                        className={`px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors flex justify-between items-center ${currentQuality === q.level ? 'text-brand-orange font-bold' : 'text-white'}`}
                      >
                        {q.height}p {currentQuality === q.level && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                )}
                <button 
                  onClick={toggleQualityMenu} 
                  className="text-white hover:text-brand-orange transition-colors flex items-center gap-1"
                  title="Quality"
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-xs font-bold w-8 text-center">{getCurrentQualityLabel()}</span>
                </button>
              </div>
            )}

            {/* Speed Control */}
            <div className="relative">
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-4 bg-black/90 border border-white/20 rounded-lg overflow-hidden flex flex-col shadow-xl z-50 min-w-[80px]">
                  {speeds.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-4 py-2 text-sm text-left hover:bg-white/10 transition-colors ${playbackRate === speed ? 'text-brand-orange font-bold' : 'text-white'}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
              <button 
                onClick={toggleSpeedMenu} 
                className="text-white hover:text-brand-orange transition-colors text-sm font-bold w-8"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>
            </div>

            <button onClick={toggleFullscreen} className="text-white hover:text-brand-orange transition-colors">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Center Play Button Overlay */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={handlePlayPause}
        >
          <div className="bg-brand-orange/90 rounded-full p-6 shadow-lg shadow-brand-orange/20 transform hover:scale-110 transition-transform">
            <Play className="h-8 w-8 text-white fill-current ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoPlayer;
