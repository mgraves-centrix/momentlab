import React, { useState } from 'react';
import { TimelineDataPoint } from '../fixtures/northlight';

interface ResponseTimelineProps {
  data: TimelineDataPoint[];
  currentTimeMs?: number;
  onTimeSelect?: (timeMs: number) => void;
  selectedCohort?: 'all' | '18_24' | '25_34';
}

export const ResponseTimeline: React.FC<ResponseTimelineProps> = ({
  data,
  currentTimeMs = 37000,
  onTimeSelect,
  selectedCohort = 'all'
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<TimelineDataPoint | null>(null);

  // SVG Chart bounds
  const width = 600;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxTime = Math.max(...data.map((d) => d.timeMs));
  const minScore = 30;
  const maxScore = 100;

  const getX = (timeMs: number) => padding.left + (timeMs / maxTime) * chartWidth;
  const getY = (score: number) => padding.top + chartHeight - ((score - minScore) / (maxScore - minScore)) * chartHeight;

  // Build main retention path
  const linePoints = data.map((d) => {
    const val = selectedCohort === '18_24' ? d.cohort18_24 : selectedCohort === '25_34' ? d.cohort25_34 : d.allCohort;
    return `${getX(d.timeMs)},${getY(val)}`;
  }).join(' L ');

  // Build uncertainty band polygon
  const upperPoints = data.map((d) => `${getX(d.timeMs)},${getY(d.uncertaintyUpper)}`).join(' L ');
  const lowerPoints = data.slice().reverse().map((d) => `${getX(d.timeMs)},${getY(d.uncertaintyLower)}`).join(' L ');
  const uncertaintyPath = `M ${upperPoints} L ${lowerPoints} Z`;

  // Anomaly cliff area (00:33 to 00:41)
  const anomalyStartX = getX(33000);
  const anomalyEndX = getX(41000);

  const activePoint = data.find((d) => Math.abs(d.timeMs - currentTimeMs) < 3000) || data[5];

  return (
    <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Audience Response Timeline</h3>
          <p style={{ fontSize: '11px', color: 'var(--muted)' }}>Synchronized retention rate (%) across scene timeline</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--muted)' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '3px', background: 'var(--violet)' }}></span>
          <span>Retention</span>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(255, 102, 82, 0.2)', border: '1px solid var(--coral)', marginLeft: '8px' }}></span>
          <span style={{ color: 'var(--coral)' }}>Cliff Anomaly</span>
        </div>
      </div>

      {/* SVG Chart */}
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

          {/* Anomaly Cliff Highlight Region */}
          <rect
            x={anomalyStartX}
            y={padding.top}
            width={anomalyEndX - anomalyStartX}
            height={chartHeight}
            fill="rgba(255, 102, 82, 0.12)"
            stroke="var(--coral)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Uncertainty Band */}
          <path d={uncertaintyPath} fill="rgba(139, 92, 246, 0.15)" />

          {/* Retention Line */}
          <path d={`M ${linePoints}`} fill="none" stroke="var(--violet)" strokeWidth="2.5" />

          {/* Data Points */}
          {data.map((d) => {
            const val = selectedCohort === '18_24' ? d.cohort18_24 : selectedCohort === '25_34' ? d.cohort25_34 : d.allCohort;
            const cx = getX(d.timeMs);
            const cy = getY(val);
            const isCliff = d.isAnomaly;

            return (
              <circle
                key={d.timecode}
                cx={cx}
                cy={cy}
                r={isCliff ? 5 : 3.5}
                fill={isCliff ? 'var(--coral)' : 'var(--violet)'}
                stroke="var(--canvas)"
                strokeWidth="1.5"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => onTimeSelect && onTimeSelect(d.timeMs)}
              />
            );
          })}

          {/* Active Time Cursor Line */}
          <line
            x1={getX(currentTimeMs)}
            y1={padding.top}
            x2={getX(currentTimeMs)}
            y2={height - padding.bottom}
            stroke="var(--coral)"
            strokeWidth="2"
          />

          {/* X Axis Time Labels */}
          {data.map((d) => (
            <text key={d.timecode} x={getX(d.timeMs)} y={height - 12} fill="var(--muted)" fontSize="10" textAnchor="middle" className="tabular-nums">
              {d.timecode}
            </text>
          ))}
        </svg>

        {/* Hover / Active Tooltip */}
        {(hoveredPoint || activePoint) && (
          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px'
            }}
          >
            <div>
              <span style={{ color: 'var(--muted)' }}>Timecode: </span>
              <strong className="tabular-nums" style={{ color: 'var(--text)' }}>{(hoveredPoint || activePoint)?.timecode}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Retention Score: </span>
              <strong className="tabular-nums" style={{ color: (hoveredPoint || activePoint)?.isAnomaly ? 'var(--coral)' : 'var(--violet)' }}>
                {(hoveredPoint || activePoint)?.allCohort}%
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--muted)' }}>Sample Size: </span>
              <strong className="tabular-nums" style={{ color: 'var(--text)' }}>{(hoveredPoint || activePoint)?.sampleSize.toLocaleString()} respondents</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
