import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Upload, Film, Youtube } from 'lucide-react';
import { useMobile } from '../hooks/useMobile';
import { formatTimecodeSec } from '../utils/format';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface MediaPlayerProps {
  initialVideoUrl?: string;
  posterUrl?: string;
  initialTimecodeMs?: number;
  onTimeUpdate?: (timeMs: number) => void;
  sceneTitle?: string;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  initialVideoUrl,
  posterUrl,
  initialTimecodeMs = 37000,
  onTimeUpdate,
  sceneTitle = '12 · INT. APARTMENT – NIGHT'
}) => {
  const isMobile = useMobile();
  const [videoSrc, setVideoSrc] = useState<string | null>(initialVideoUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(initialTimecodeMs / 1000);
  const [durationSec, setDurationSec] = useState(0);
  const isYouTube = Boolean(videoSrc && (videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be')));
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prevInitialUrl, setPrevInitialUrl] = useState(initialVideoUrl);
  if (initialVideoUrl !== prevInitialUrl) {
    setPrevInitialUrl(initialVideoUrl);
    setVideoSrc(initialVideoUrl || null);
  }

  // Extract 11-char YouTube ID
  const extractVideoId = useCallback((url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  }, []);

  // Initialize YouTube IFrame Player API
  useEffect(() => {
    if (!isYouTube || !videoSrc) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      return;
    }

    const videoId = extractVideoId(videoSrc) || 'aqz-KE-bpKQ';

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player || !ytContainerRef.current) return;
      
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        ytPlayerRef.current.destroy();
      }

      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId: videoId,
        playerVars: {
          enablejsapi: 1,
          origin: window.location.origin,
          autoplay: 0,
          controls: 0,
          rel: 0
        },
        events: {
          onReady: (event: any) => {
            const dur = event.target.getDuration();
            if (dur && !isNaN(dur)) {
              setDurationSec(dur);
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = setInterval(() => {
                if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
                  const t = ytPlayerRef.current.getCurrentTime();
                  setCurrentTimeSec(t);
                  if (onTimeUpdate) {
                    onTimeUpdate(Math.floor(t * 1000));
                  }
                }
              }, 500);
            } else {
              setIsPlaying(false);
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
            }
          }
        }
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        ytPlayerRef.current.destroy();
      }
    };
  }, [isYouTube, videoSrc, extractVideoId, onTimeUpdate]);

  const handlePlayPause = () => {
    if (isYouTube && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
      return;
    }
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const sec = videoRef.current.currentTime;
      setCurrentTimeSec(sec);
      if (onTimeUpdate) {
        onTimeUpdate(Math.floor(sec * 1000));
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      setDurationSec(videoRef.current.duration);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(true);
      setTimeout(() => {
        videoRef.current?.play().catch(() => {});
      }, 100);
    }
  };

  const handleYouTubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrlInput.trim()) return;
    const videoId = extractVideoId(youtubeUrlInput) || youtubeUrlInput.trim();
    setVideoSrc(`https://www.youtube.com/watch?v=${videoId}`);
    setShowYoutubeInput(false);
  };

  return (
    <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
      {/* Top Bar with Title and Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Film size={16} color="var(--violet)" />
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{sceneTitle}</h3>
        </div>

        {/* Action Buttons (Desktop Only per mobile contract) */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            
            {/* YouTube Link Button */}
            <button
              onClick={() => setShowYoutubeInput(!showYoutubeInput)}
              style={{
                backgroundColor: 'rgba(255, 68, 68, 0.1)',
                border: '1px solid #ff4444',
                color: '#ff6666',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Youtube size={12} />
              <span>YouTube URL</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept="video/mp4,video/webm,video/ogg"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                backgroundColor: 'var(--surface-3)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Upload size={12} color="var(--violet-soft)" />
              <span>Upload</span>
            </button>
          </div>
        )}
      </div>

      {showYoutubeInput && (
        <form onSubmit={handleYouTubeSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="url"
            placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
            value={youtubeUrlInput}
            onChange={(e) => setYoutubeUrlInput(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'var(--surface-2)',
              border: '1px solid #ff4444',
              borderRadius: '4px',
              padding: '6px 10px',
              color: '#fff',
              fontSize: '12px'
            }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: '#ff4444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Load YouTube IFrame
          </button>
        </form>
      )}

      {/* Video / IFrame Frame */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/9',
          backgroundColor: '#000',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {!videoSrc ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              textAlign: 'center',
              color: 'var(--muted)',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--muted)'
              }}
            >
              <Film size={24} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                No Media Attached
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                This project has no active scene footage. Upload video.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  backgroundColor: 'var(--surface-3)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Upload size={12} />
                <span>Upload Media</span>
              </button>
            </div>
          </div>
        ) : isYouTube ? (
          <div ref={ytContainerRef} style={{ width: '100%', height: '100%' }} />
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              poster={posterUrl || "/northlight_thumb.png"}
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              muted={isMuted}
              onClick={handlePlayPause}
            />

            {/* Synthetic Footage Badge */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                backgroundColor: 'rgba(8, 11, 14, 0.85)',
                border: '1px solid var(--border)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--violet-soft)',
                letterSpacing: '0.04em',
                pointerEvents: 'none'
              }}
            >
              SYNTHETIC
            </div>

            {!isPlaying && (
              <div
                onClick={handlePlayPause}
                style={{
                  position: 'absolute',
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(139, 92, 246, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 0 24px rgba(139, 92, 246, 0.6)',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <Play size={32} style={{ marginLeft: '4px' }} />
              </div>
            )}
          </>
        )}

        {/* Floating Timecode Badge */}
        {videoSrc && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              backgroundColor: 'rgba(8, 11, 14, 0.85)',
              border: '1px solid var(--border)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text)'
            }}
            className="tabular-nums"
          >
            {formatTimecodeSec(durationSec > 0 ? Math.min(currentTimeSec, durationSec) : currentTimeSec)} / {formatTimecodeSec(durationSec)}
          </div>
        )}
      </div>

      {/* Media Transport Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
        <button
          onClick={handlePlayPause}
          aria-label={isPlaying ? "Pause video" : "Play video"}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--surface-3)',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border)',
            cursor: 'pointer'
          }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        {/* Seek Scrubber */}
        <input
          type="range"
          min={0}
          max={durationSec || 100}
          value={currentTimeSec}
          onChange={(e) => {
            const sec = parseFloat(e.target.value);
            setCurrentTimeSec(sec);
            if (isYouTube && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
              ytPlayerRef.current.seekTo(sec, true);
            } else if (videoRef.current) {
              videoRef.current.currentTime = sec;
            }
            if (onTimeUpdate) {
              onTimeUpdate(Math.floor(sec * 1000));
            }
          }}
          style={{ flex: 1, accentColor: 'var(--violet)', cursor: 'pointer' }}
        />

        <button
          onClick={() => {
            setIsMuted(!isMuted);
            if (isYouTube && ytPlayerRef.current) {
              if (isMuted) ytPlayerRef.current.unMute();
              else ytPlayerRef.current.mute();
            }
          }}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--surface-3)',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border)',
            cursor: 'pointer'
          }}
        >
          {isMuted ? <VolumeX size={18} color="var(--coral)" /> : <Volume2 size={18} />}
        </button>
      </div>
    </div>
  );
};
