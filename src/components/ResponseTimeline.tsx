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
  const [showTableView, setShowTableView] = useState(false);

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

  // Build all 3 lines for cohorts
  const lineAll = data.map((d) => `${getX(d.timeMs)},${getY(d.allCohort)}`).join(' L ');
  const line1824 = data.map((d) => `${getX(d.timeMs)},${getY(d.cohort18_24)}`).join(' L ');
  const line2534 = data.map((d) => `${getX(d.timeMs)},${getY(d.cohort25_34)}`).join(' L ');

  // Build uncertainty band polygon (only for 'all' to keep it clean)
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
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Audience Response Timeline</h3>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0 0' }}>Synchronized retention rate (%) across scene timeline</p>
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
            <span>Retention</span>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(255, 102, 82, 0.2)', border: '1px solid var(--coral)', marginLeft: '8px' }}></span>
            <span style={{ color: 'var(--coral)' }}>Cliff Anomaly</span>
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
            <path d={uncertaintyPath} fill="rgba(139, 92, 246, 0.1)" />

            {/* Grid Lines */}
            {[40, 60, 80, 100].map((tick) => (
              <line key={tick} x1={padding.left} y1={getY(tick)} x2={width - padding.right} y2={getY(tick)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
            ))}

            {/* Data Lines */}
            <path d={`M ${line1824}`} fill="none" stroke="rgba(139, 92, 246, 0.4)" strokeWidth="2" strokeDasharray="2 2" />
            <path d={`M ${line2534}`} fill="none" stroke="rgba(183, 227, 61, 0.4)" strokeWidth="2" strokeDasharray="4 4" />
            <path d={`M ${lineAll}`} fill="none" stroke="var(--violet)" strokeWidth="3" />

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
                  pointerEvents="none"
                />
              );
            })}

            {/* Hover Targets for easier interaction */}
            {data.map((d, i) => {
              const prevTime = i > 0 ? data[i - 1].timeMs : d.timeMs;
              const nextTime = i < data.length - 1 ? data[i + 1].timeMs : d.timeMs;
              
              const startX = i === 0 ? padding.left : getX((prevTime + d.timeMs) / 2);
              const endX = i === data.length - 1 ? width - padding.right : getX((d.timeMs + nextTime) / 2);

              return (
                <rect
                  key={`target-${d.timecode}`}
                  x={startX}
                  y={padding.top}
                  width={endX - startX}
                  height={chartHeight}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onTimeSelect && onTimeSelect(d.timeMs)}
                />
              );
            })}

            {/* Hover Cursor Line */}
            {hoveredPoint && hoveredPoint.timeMs !== currentTimeMs && (
              <line
                x1={getX(hoveredPoint.timeMs)}
                y1={padding.top}
                x2={getX(hoveredPoint.timeMs)}
                y2={height - padding.bottom}
                stroke="var(--muted)"
                strokeDasharray="2 2"
                strokeWidth="1"
                pointerEvents="none"
              />
            )}

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
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '12px'
              }}
            >
              <div>
                <span style={{ color: 'var(--muted)' }}>Time: </span>
                <strong className="tabular-nums" style={{ color: 'var(--text)' }}>{(hoveredPoint || activePoint)?.timecode}</strong>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div>
                  <span style={{ color: 'var(--muted)' }}>All: </span>
                  <strong className="tabular-nums" style={{ color: (hoveredPoint || activePoint)?.isAnomaly ? 'var(--coral)' : 'var(--violet)' }}>
                    {(hoveredPoint || activePoint)?.allCohort}%
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>18-24: </span>
                  <strong className="tabular-nums" style={{ color: 'rgba(139, 92, 246, 0.8)' }}>
                    {(hoveredPoint || activePoint)?.cohort18_24}%
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>25-34: </span>
                  <strong className="tabular-nums" style={{ color: 'rgba(183, 227, 61, 0.8)' }}>
                    {(hoveredPoint || activePoint)?.cohort25_34}%
                  </strong>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--muted)' }}>Sample Size: </span>
                <strong className="tabular-nums" style={{ color: 'var(--text)' }}>{(hoveredPoint || activePoint)?.sampleSize.toLocaleString()}</strong>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Accessible Textual Data Table View */
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: 'var(--text)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--muted)' }}>
                <th style={{ padding: '8px' }}>Timecode</th>
                <th style={{ padding: '8px' }}>All Cohort</th>
                <th style={{ padding: '8px' }}>18–24 Cohort</th>
                <th style={{ padding: '8px' }}>25–34 Cohort</th>
                <th style={{ padding: '8px' }}>Anomaly Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr
                  key={d.timecode}
                  onClick={() => onTimeSelect && onTimeSelect(d.timeMs)}
                  style={{
                    borderBottom: '1px solid var(--surface-2)',
                    backgroundColor: Math.abs(d.timeMs - currentTimeMs) < 2000 ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ padding: '8px', fontWeight: 700 }} className="tabular-nums">{d.timecode}</td>
                  <td style={{ padding: '8px' }} className="tabular-nums">{d.allCohort}%</td>
                  <td style={{ padding: '8px' }} className="tabular-nums">{d.cohort18_24}%</td>
                  <td style={{ padding: '8px' }} className="tabular-nums">{d.cohort25_34}%</td>
                  <td style={{ padding: '8px' }}>
                    {d.isAnomaly ? <span style={{ color: 'var(--coral)', fontWeight: 700 }}>CLIFF (−28%)</span> : <span style={{ color: 'var(--muted)' }}>Normal</span>}
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
