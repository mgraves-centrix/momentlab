import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Upload, Film, Sparkles, Youtube } from 'lucide-react';
import { useMobile } from '../hooks/useMobile';

interface MediaPlayerProps {
  initialVideoUrl?: string;
  initialTimecodeMs?: number;
  onTimeUpdate?: (timeMs: number) => void;
  sceneTitle?: string;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  initialVideoUrl,
  initialTimecodeMs = 37000,
  onTimeUpdate,
  sceneTitle = '12 · INT. APARTMENT – NIGHT'
}) => {
  const isMobile = useMobile();
  const [videoSrc, setVideoSrc] = useState<string>(initialVideoUrl || '/scene12.mp4');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isGeneratingVeo, setIsGeneratingVeo] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(initialTimecodeMs / 1000);
  const [durationSec, setDurationSec] = useState(0);
  const isYouTube = videoSrc.includes('youtube.com') || videoSrc.includes('youtu.be');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');

  const [veoStatusMessage, setVeoStatusMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlayPause = () => {
    if (isYouTube) {
      setIsPlaying(!isPlaying);
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
    const match = youtubeUrlInput.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    const videoId = match ? match[1] : youtubeUrlInput.trim();
    setVideoSrc(`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1`);
    setShowYoutubeInput(false);
    setIsPlaying(true);
  };

  const handleGenerateVeo = async () => {
    setIsGeneratingVeo(true);
    setVeoStatusMessage(null);
    try {
      const res = await fetch('/api/v1/media/veo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sceneTitle })
      });
      const data = await res.json();
      if (data.status === 'COMPLETED' && data.video_url) {
        setVideoSrc(data.video_url);
        setIsPlaying(true);
        setVeoStatusMessage('Synthetic Veo scene generated successfully.');
      } else if (data.status === 'BLOCKED') {
        setVeoStatusMessage(`Veo Generation Blocked: ${data.reason}`);
      }
    } catch (err) {
      console.error('Veo generation call failed:', err);
      setVeoStatusMessage('Veo generation endpoint unavailable.');
    } finally {
      setIsGeneratingVeo(false);
    }
  };

  const formatTimecode = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

            <button
              onClick={handleGenerateVeo}
              disabled={isGeneratingVeo}
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid var(--violet)',
                color: 'var(--violet-soft)',
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
              <Sparkles size={12} color="var(--violet)" />
              <span>{isGeneratingVeo ? 'Generating Veo...' : 'Google Veo'}</span>
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

      {veoStatusMessage && (
        <div style={{ backgroundColor: '#131b22', border: '1px solid #283540', borderRadius: '4px', padding: '8px 12px', fontSize: '11px', color: '#ffb86c', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{veoStatusMessage}</span>
          <button onClick={() => setVeoStatusMessage(null)} style={{ background: 'none', border: 'none', color: '#8d979f', cursor: 'pointer', fontSize: '12px' }}>✕</button>
        </div>
      )}

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
        {isYouTube ? (
          <iframe
            src={videoSrc}
            title={sceneTitle}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              poster="/northlight_thumb.png"
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              muted={isMuted}
              onClick={handlePlayPause}
            />

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
          {formatTimecode(Math.min(currentTimeSec, durationSec))} / {formatTimecode(durationSec)}
        </div>
      </div>

      {/* Media Transport Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
        <button
          onClick={handlePlayPause}
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
          max={durationSec}
          value={currentTimeSec}
          onChange={(e) => {
            const sec = parseFloat(e.target.value);
            setCurrentTimeSec(sec);
            if (videoRef.current) {
              videoRef.current.currentTime = sec;
            }
            if (onTimeUpdate) {
              onTimeUpdate(Math.floor(sec * 1000));
            }
          }}
          style={{ flex: 1, accentColor: 'var(--violet)', cursor: 'pointer' }}
        />

        <button
          onClick={() => setIsMuted(!isMuted)}
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
