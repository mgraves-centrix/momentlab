import React, { useState } from 'react';
import { TimelineDataPoint } from '../types/northlight';
import { AlertTriangle, Database } from 'lucide-react';

interface ResponseTimelineProps {
  data: TimelineDataPoint[];
  currentTimeMs?: number;
  onTimeSelect?: (timeMs: number) => void;
  selectedCohort?: 'all' | '18_24' | '25_34';
  error?: string | null;
  onRetry?: () => void;
  mvDurationMs?: number;
  rawDurationMs?: number;
}

export const ResponseTimeline: React.FC<ResponseTimelineProps> = ({
  data = [],
  currentTimeMs = 37000,
  onTimeSelect,
  selectedCohort = 'all',
  error = null,
  onRetry,
  mvDurationMs,
  rawDurationMs
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TimelineDataPoint | null>(null);
  const [showTableView, setShowTableView] = useState(false);
  const mvMs = mvDurationMs ?? (data as any)?.mvDurationMs;
  const rawMs = rawDurationMs ?? (data as any)?.rawDurationMs;

  // If telemetry database outage / 503 error
  if (error) {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--coral)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text)',
          minHeight: '240px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--coral)' }}>
          <AlertTriangle size={20} />
          <span style={{ fontSize: '14px', fontWeight: 700 }}>Telemetry Service Unavailable</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: '420px', margin: 0 }}>
          Unable to query audience telemetry from the ClickHouse database. The telemetry engine may be down or undergoing maintenance.
        </p>
        <span style={{ fontSize: '11px', color: 'var(--coral)', fontFamily: 'monospace', backgroundColor: 'rgba(255, 102, 82, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
          {error}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '12px',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  // SVG Chart bounds
  const width = 600;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const validData = Array.isArray(data) ? data.filter(d => d && typeof d.timeMs === 'number' && !isNaN(d.timeMs)) : [];

  if (validData.length === 0) {
    return (
      <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', color: 'var(--muted)', minHeight: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Database size={20} style={{ color: 'var(--muted)' }} />
        <span style={{ fontSize: '13px', fontWeight: 600 }}>No audience telemetry recorded for this scene</span>
        <span style={{ fontSize: '11px', color: '#5b6670' }}>ClickHouse streaming pipeline active</span>
      </div>
    );
  }

  const maxTime = Math.max(1, ...validData.map((d) => d.timeMs)) || 60000;
  const minScore = 30;
  const maxScore = 100;

  const getX = (timeMs: number) => {
    const t = isNaN(timeMs) ? 0 : Math.max(0, Math.min(maxTime, timeMs));
    return padding.left + (t / maxTime) * chartWidth;
  };

  const getY = (score: number) => {
    const s = isNaN(score) ? 50 : Math.max(minScore, Math.min(maxScore, score));
    return padding.top + chartHeight - ((s - minScore) / (maxScore - minScore)) * chartHeight;
  };

  const getCohortVal = (d: TimelineDataPoint) => {
    if (selectedCohort === '18_24') return d.cohort18_24;
    if (selectedCohort === '25_34') return d.cohort25_34;
    return d.allCohort;
  };

  // Build line segments for active cohort series from ClickHouse (breaking line across null gaps)
  const lineSegments: string[] = [];
  let currentSegment: string[] = [];

  validData.forEach((d) => {
    const val = getCohortVal(d);
    if (typeof val === 'number' && !isNaN(val)) {
      currentSegment.push(`${getX(d.timeMs).toFixed(1)},${getY(val).toFixed(1)}`);
    } else {
      if (currentSegment.length > 0) {
        lineSegments.push(`M ${currentSegment.join(' L ')}`);
        currentSegment = [];
      }
    }
  });
  if (currentSegment.length > 0) {
    lineSegments.push(`M ${currentSegment.join(' L ')}`);
  }
  const lineActivePath = lineSegments.join(' ');
  const hasCohortPoints = lineSegments.length > 0;

  // Build uncertainty band polygon
  const upperPoints = validData.filter(d => typeof d.uncertaintyUpper === 'number' && !isNaN(d.uncertaintyUpper)).map((d) => `${getX(d.timeMs).toFixed(1)},${getY(d.uncertaintyUpper!).toFixed(1)}`);
  const lowerPoints = validData.slice().reverse().filter(d => typeof d.uncertaintyLower === 'number' && !isNaN(d.uncertaintyLower)).map((d) => `${getX(d.timeMs).toFixed(1)},${getY(d.uncertaintyLower!).toFixed(1)}`);
  const uncertaintyPath = (upperPoints.length > 0 && lowerPoints.length > 0) ? `M ${upperPoints.join(' L ')} L ${lowerPoints.join(' L ')} Z` : null;

  // Dynamic anomaly cliff region derived strictly from data
  const anomalyPoints = validData.filter(d => d.isAnomaly);
  const hasAnomaly = anomalyPoints.length > 0;
  const anomalyStartX = hasAnomaly ? getX(Math.min(...anomalyPoints.map(d => d.timeMs))) : 0;
  const anomalyEndX = hasAnomaly ? getX(Math.max(...anomalyPoints.map(d => d.timeMs))) : 0;

  return (
    <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Audience Response Timeline</h3>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0 0' }}>Synchronized retention rate (%) across scene timeline</p>
          {(mvMs != null || rawMs != null) && (
            <div style={{ marginTop: '4px' }}>
              <span style={{ fontSize: '11px', backgroundColor: 'rgba(88, 201, 75, 0.12)', color: '#58c94b', border: '1px solid rgba(88, 201, 75, 0.3)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>
                served from materialized view - {mvMs != null ? `${mvMs}ms` : 'fast'} {rawMs != null ? `(raw scan ${rawMs}ms)` : ''}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowTableView(!showTableView)}
            style={{
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer'
            }}
            aria-label="Toggle text table view"
          >
            {showTableView ? 'Chart View' : 'Table View'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--muted)' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '3px', background: 'var(--violet)' }}></span>
            <span>Retention ({selectedCohort === 'all' ? 'All' : selectedCohort === '18_24' ? '18–24' : '25–34'})</span>
            {hasAnomaly && (
              <>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(255, 102, 82, 0.2)', border: '1px solid var(--coral)', marginLeft: '8px' }}></span>
                <span style={{ color: 'var(--coral)' }}>Cliff Anomaly</span>
              </>
            )}
          </div>
        </div>
      </div>

      {!showTableView ? (
        /* SVG Chart View */
        <div style={{ position: 'relative' }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            {/* Grid lines */}
            {[40, 60, 80, 100].map((val) => (
              <g key={val}>
                <line x1={padding.left} y1={getY(val)} x2={width - padding.right} y2={getY(val)} stroke="var(--border)" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={getY(val) + 4} fill="var(--muted)" fontSize="10" textAnchor="end" className="tabular-nums">
                  {val}%
                </text>
              </g>
            ))}

            {/* Anomaly Cliff Highlight Region (Rendered only when anomaly exists in data) */}
            {hasAnomaly && (
              <rect
                x={anomalyStartX}
                y={padding.top}
                width={Math.max(4, anomalyEndX - anomalyStartX)}
                height={chartHeight}
                fill="rgba(255, 102, 82, 0.12)"
                stroke="var(--coral)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            )}

            {/* Uncertainty Band */}
            {uncertaintyPath && <path d={uncertaintyPath} fill="rgba(139, 92, 246, 0.1)" />}

            {/* Main Active Line from ClickHouse (broken over nulls) */}
            {lineActivePath && <path d={lineActivePath} fill="none" stroke="var(--violet)" strokeWidth="3" />}

            {/* Data Points */}
            {validData.map((d, idx) => {
              const val = getCohortVal(d);
              if (typeof val !== 'number' || isNaN(val)) return null;
              const cx = getX(d.timeMs);
              const cy = getY(val);
              const isCliff = d.isAnomaly;

              // In dense mode, only render prominent points or anomaly points to keep DOM light
              if (validData.length > 20 && !isCliff && idx % 3 !== 0) return null;

              return (
                <circle
                  key={d.timecode || idx}
                  cx={cx}
                  cy={cy}
                  r={isCliff ? 4.5 : 3}
                  fill={isCliff ? 'var(--coral)' : 'var(--violet)'}
                  stroke="var(--canvas)"
                  strokeWidth="1.5"
                  pointerEvents="none"
                />
              );
            })}

            {/* Insufficient sample notice overlay if cohort has no points */}
            {!hasCohortPoints && (
              <text
                x={width / 2}
                y={height / 2}
                textAnchor="middle"
                fill="var(--muted)"
                fontSize="12"
                fontWeight="600"
              >
                Insufficient sample for selected cohort
              </text>
            )}

            {/* Scrubber Interactivity Overlay */}
            <rect
              x={padding.left}
              y={padding.top}
              width={chartWidth}
              height={chartHeight}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, mouseX / chartWidth));
                const targetTime = ratio * maxTime;
                const closest = validData.reduce((prev, curr) => (Math.abs(curr.timeMs - targetTime) < Math.abs(prev.timeMs - targetTime) ? curr : prev));
                setHoveredPoint(closest);
              }}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, mouseX / chartWidth));
                const targetTime = Math.round(ratio * maxTime);
                if (onTimeSelect) onTimeSelect(targetTime);
              }}
            />

            {/* Active Playhead Line */}
            {currentTimeMs !== undefined && !isNaN(currentTimeMs) && (
              <line
                x1={getX(currentTimeMs)}
                y1={padding.top}
                x2={getX(currentTimeMs)}
                y2={height - padding.bottom}
                stroke="var(--lime)"
                strokeWidth="2"
                pointerEvents="none"
              />
            )}

            {/* Hovered Point Marker */}
            {hoveredPoint && typeof getCohortVal(hoveredPoint) === 'number' && !isNaN(getCohortVal(hoveredPoint)!) && (
              <g pointerEvents="none">
                <line
                  x1={getX(hoveredPoint.timeMs)}
                  y1={padding.top}
                  x2={getX(hoveredPoint.timeMs)}
                  y2={height - padding.bottom}
                  stroke="rgba(255,255,255,0.4)"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={getX(hoveredPoint.timeMs)}
                  cy={getY(getCohortVal(hoveredPoint)!)}
                  r={6}
                  fill="var(--lime)"
                  stroke="var(--canvas)"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Hover Tooltip Card */}
          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                top: `${getCohortVal(hoveredPoint) !== null ? getY(getCohortVal(hoveredPoint)!) - 40 : padding.top}px`,
                left: `${getX(hoveredPoint.timeMs)}px`,
                transform: 'translate(-50%, -100%)',
                backgroundColor: 'var(--surface-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 10,
                whiteSpace: 'nowrap'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }} className="tabular-nums">
                {hoveredPoint.timecode}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: hoveredPoint.isAnomaly ? 'var(--coral)' : 'var(--text)' }} className="tabular-nums">
                {getCohortVal(hoveredPoint) !== null ? `${getCohortVal(hoveredPoint)}%` : 'Insufficient Sample'}
                {hoveredPoint.isAnomaly && <span style={{ fontSize: '11px', marginLeft: '4px' }}>CLIFF</span>}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Accessible Table View */
        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', color: 'var(--text)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                <th style={{ padding: '6px 8px' }}>Timecode</th>
                <th style={{ padding: '6px 8px' }}>All Cohorts</th>
                <th style={{ padding: '6px 8px' }}>18–24</th>
                <th style={{ padding: '6px 8px' }}>25–34</th>
                <th style={{ padding: '6px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {validData.map((d) => (
                <tr
                  key={d.timecode}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: d.isAnomaly ? 'rgba(255, 102, 82, 0.08)' : 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => onTimeSelect && onTimeSelect(d.timeMs)}
                >
                  <td style={{ padding: '6px 8px', fontWeight: 600 }} className="tabular-nums">{d.timecode}</td>
                  <td style={{ padding: '6px 8px', color: 'var(--violet)' }} className="tabular-nums">{d.allCohort !== null ? `${d.allCohort}%` : '—'}</td>
                  <td style={{ padding: '6px 8px' }} className="tabular-nums">{d.cohort18_24 !== null ? `${d.cohort18_24}%` : '—'}</td>
                  <td style={{ padding: '6px 8px' }} className="tabular-nums">{d.cohort25_34 !== null ? `${d.cohort25_34}%` : '—'}</td>
                  <td style={{ padding: '6px 8px' }}>
                    {d.isAnomaly ? (
                      <span style={{ color: 'var(--coral)', fontWeight: 700 }}>CLIFF ANOMALY</span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
