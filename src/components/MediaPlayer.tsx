import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Upload, Film, Sparkles } from 'lucide-react';

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
  const [videoSrc, setVideoSrc] = useState<string>(initialVideoUrl || '/scene12.mp4');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isGeneratingVeo, setIsGeneratingVeo] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(initialTimecodeMs / 1000);
  const [durationSec, setDurationSec] = useState(90);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlayPause = () => {
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
    if (videoRef.current) {
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

  const handleGenerateVeo = async () => {
    setIsGeneratingVeo(true);
    try {
      const res = await fetch('/api/v1/media/veo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sceneTitle })
      });
      const data = await res.json();
      if (data.video_url) {
        setVideoSrc(data.video_url);
        setIsPlaying(true);
        setTimeout(() => {
          videoRef.current?.play().catch(() => {});
        }, 100);
      }
    } catch (err) {
      console.error('Veo generation call failed:', err);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Film size={16} color="var(--violet)" />
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{sceneTitle}</h3>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <span>{isGeneratingVeo ? 'Generating Veo Scene...' : 'Generate via Google Veo'}</span>
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
            <span>Change Video</span>
          </button>
        </div>
      </div>

      {/* Video / Canvas Frame */}
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
        <video
          ref={videoRef}
          src={videoSrc}
          poster="/scene12.png"
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          muted={isMuted}
          onClick={handlePlayPause}
        />

        {/* Big Overlay Play Button when Paused */}
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
          {formatTimecode(currentTimeSec)} / {formatTimecode(durationSec)}
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
            justifyContent: 'center'
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
            justifyContent: 'center'
          }}
        >
          {isMuted ? <VolumeX size={18} color="var(--coral)" /> : <Volume2 size={18} />}
        </button>
      </div>
    </div>
  );
};
