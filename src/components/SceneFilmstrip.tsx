import React from 'react';
import { formatTimecodeMs } from '../utils/format';

interface SceneFilmstripProps {
  currentTimeMs: number;
  onTimeSelect: (timeMs: number) => void;
  durationMs?: number;
  anomalyStartMs?: number;
  anomalyEndMs?: number;
}

export const SceneFilmstrip: React.FC<SceneFilmstripProps> = ({
  currentTimeMs,
  onTimeSelect,
  durationMs = 60000,
  anomalyStartMs = 33000,
  anomalyEndMs = 41000
}) => {
  // Generate 12 frame markers representing keyframes across duration
  const stepMs = Math.max(1000, Math.floor(durationMs / 12));
  const frames = Array.from({ length: 12 }, (_, i) => {
    const timeMs = i * stepMs;
    const timecode = formatTimecodeMs(timeMs);
    const isAnomaly = timeMs >= anomalyStartMs && timeMs <= anomalyEndMs;
    return { index: i, timeMs, timecode, isAnomaly };
  });

  const currentPercent = Math.min(100, Math.max(0, (currentTimeMs / durationMs) * 100));

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTimeMs = Math.round(ratio * durationMs);
    onTimeSelect(newTimeMs);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      onTimeSelect(Math.max(0, currentTimeMs - 1000));
    } else if (e.key === 'ArrowRight') {
      onTimeSelect(Math.min(durationMs, currentTimeMs + 1000));
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Scene keyframe filmstrip scrubber"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
          Scene Timeline
        </span>
        <span style={{ fontSize: '11px', color: 'var(--lime)', fontWeight: 700 }} className="tabular-nums">
          {formatTimecodeMs(currentTimeMs)} / {formatTimecodeMs(durationMs)}
        </span>
      </div>

      {/* Filmstrip Track */}
      <div
        onClick={handleTrackClick}
        style={{
          position: 'relative',
          height: '48px',
          backgroundColor: 'var(--surface-2)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex'
        }}
      >
        {/* Frame Thumbnails Representation */}
        {frames.map((frame) => {
          const isSelected = Math.abs(currentTimeMs - frame.timeMs) < 2500;
          return (
            <div
              key={frame.index}
              style={{
                flex: 1,
                borderRight: '1px solid rgba(255,255,255,0.05)',
                backgroundColor: frame.isAnomaly
                  ? 'rgba(255, 102, 82, 0.15)'
                  : isSelected
                  ? 'rgba(139, 92, 246, 0.2)'
                  : 'transparent',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '4px',
                transition: 'background-color 0.15s ease'
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: frame.isAnomaly ? 'var(--coral)' : 'var(--muted)',
                  fontWeight: frame.isAnomaly ? 700 : 400
                }}
                className="tabular-nums"
              >
                {frame.timecode}
              </span>
            </div>
          );
        })}

        {/* Anomaly Highlight Overlay */}
        <div
          style={{
            position: 'absolute',
            left: `${(anomalyStartMs / durationMs) * 100}%`,
            width: `${((anomalyEndMs - anomalyStartMs) / durationMs) * 100}%`,
            top: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 102, 82, 0.2)',
            borderLeft: '1px dashed var(--coral)',
            borderRight: '1px dashed var(--coral)',
            pointerEvents: 'none'
          }}
        />

        {/* Playhead Marker */}
        <div
          style={{
            position: 'absolute',
            left: `${currentPercent}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'var(--lime)',
            boxShadow: '0 0 8px rgba(183, 227, 61, 0.8)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--lime)'
            }}
          />
        </div>
      </div>
    </div>
  );
};
