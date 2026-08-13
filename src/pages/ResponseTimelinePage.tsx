import React from 'react';
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ResponseTimeline } from '../components/ResponseTimeline';
import { MediaPlayer } from '../components/MediaPlayer';
import { AnomalyCallout } from '../components/AnomalyCallout';
import { HypothesisCard } from '../components/HypothesisCard';
import { SceneFilmstrip } from '../components/SceneFilmstrip';
import { TimeWindowSelector, TimeWindow } from '../components/TimeWindowSelector';
import { ConfidenceMeter } from '../components/ConfidenceMeter';
import { CutComparison } from '../components/CutComparison';
import { McpActivityPanel } from '../components/McpActivityPanel';
import { ApprovalGate } from '../components/ApprovalGate';
import { fetchExperimentTimeline, fetchExperimentHypothesis, fetchExperimentSummary, TimelineDataPoint, Hypothesis, ExperimentSummary, generateHypothesis } from '../api/client';
import { useMobile } from '../hooks/useMobile';

export const ResponseTimelinePage: React.FC = () => {
  const { projectId, experimentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedCohort = (searchParams.get('cohort') as 'all' | '18_24' | '25_34') || 'all';
  const selectedWindow = (searchParams.get('window') as TimeWindow) || '30s';
  const selectedTimeMs = parseInt(searchParams.get('media_time_ms') || '37000', 10);

  const [timelineData, setTimelineData] = React.useState<TimelineDataPoint[]>([]);
  const [hypothesisData, setHypothesisData] = React.useState<Hypothesis | null>(null);
  const [summaryData, setSummaryData] = React.useState<ExperimentSummary | null>(null);

  React.useEffect(() => {
    if (projectId && experimentId) {
      fetchExperimentTimeline(projectId, experimentId).then(setTimelineData);
      fetchExperimentHypothesis(projectId, experimentId).then(setHypothesisData);
      fetchExperimentSummary(projectId, experimentId).then(setSummaryData);
    }
  }, [projectId, experimentId]);

  const updateQueryParams = (updates: { cohort?: string; window?: string; media_time_ms?: number }) => {
    const newParams = new URLSearchParams(searchParams);
    if (updates.cohort !== undefined) newParams.set('cohort', updates.cohort);
    if (updates.window !== undefined) newParams.set('window', updates.window);
    if (updates.media_time_ms !== undefined) newParams.set('media_time_ms', updates.media_time_ms.toString());
    setSearchParams(newParams, { replace: true });
  };
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGenerateHypothesis = async () => {
    if (!projectId || !experimentId) return;
    setIsGenerating(true);
    try {
      await generateHypothesis(projectId, experimentId);
      navigate(`/projects/${projectId}/experiments/${experimentId}/evidence${location.search}`);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  const isMobile = useMobile();

  const totalRespondents = summaryData?.total_respondents || 0;
  const detectedMoment = timelineData.find(d => d.isAnomaly)?.timecode || "--:--";
  
  // Calculate retention drop from peak before anomaly to anomaly minimum
  const anomalyPoints = timelineData.filter(d => d.isAnomaly);
  const minAnomalyValue = anomalyPoints.length > 0 ? Math.min(...anomalyPoints.map(d => d.allCohort)) : 0;
  const maxPreAnomalyValue = timelineData.length > 0 ? Math.max(...timelineData.map(d => d.allCohort)) : 100;
  const retentionDrop = anomalyPoints.length > 0 ? (minAnomalyValue - maxPreAnomalyValue).toFixed(1) + '%' : '0%';
  
  const confidence = hypothesisData?.confidenceScore || 0;

  return (
    <AppShell>
      <div style={{ padding: isMobile ? '0' : '24px', maxWidth: '1600px', margin: '0 auto', backgroundColor: isMobile ? '#050a0e' : 'transparent', minHeight: isMobile ? '100vh' : 'auto' }}>
        
        {isMobile ? (
          /* --- MOBILE LAYOUT (09-mobile-finding.png) --- */
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px' }}>
            
            {/* Mobile Subheader */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em' }}>
                <span>SCENE 12</span>
                <span style={{ color: '#5b6670' }}>•</span>
                <span>INT. APARTMENT – NIGHT</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8d979f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ backgroundColor: '#121a21', border: '1px solid #1c2630', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', color: '#8d979f', fontWeight: 700, letterSpacing: '0.04em' }}>
                  EXPERIMENT 23A
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8d979f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
              </div>
            </div>

            {/* MediaPlayer */}
            <div style={{ margin: '0 -16px' }}>
              <MediaPlayer
                initialTimecodeMs={selectedTimeMs}
                onTimeUpdate={(t) => updateQueryParams({ media_time_ms: t })}
              />
            </div>

            {/* Engagement Graph Card */}
            <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em' }}>ENGAGEMENT OVER TIME</h3>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8d979f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </div>
                <div style={{ display: 'flex', border: '1px solid #16232c', borderRadius: '4px', overflow: 'hidden' }}>
                  <button style={{ backgroundColor: '#2d1b54', color: '#c4a7ff', border: 'none', borderRight: '1px solid #16232c', padding: '4px 8px', fontSize: '10px', fontWeight: 700 }}>10S</button>
                  <button style={{ backgroundColor: 'transparent', color: '#8d979f', border: 'none', borderRight: '1px solid #16232c', padding: '4px 8px', fontSize: '10px', fontWeight: 700 }}>30S</button>
                  <button style={{ backgroundColor: 'transparent', color: '#8d979f', border: 'none', borderRight: '1px solid #16232c', padding: '4px 8px', fontSize: '10px', fontWeight: 700 }}>60S</button>
                  <button style={{ backgroundColor: 'transparent', color: '#8d979f', border: 'none', padding: '4px 8px', fontSize: '10px', fontWeight: 700 }}>ALL</button>
                </div>
              </div>

              {/* Mobile Graph Legend */}
              <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#9aa8b2', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '4px', backgroundColor: '#8b5cf6', borderRadius: '2px' }}/> ALL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '4px', backgroundColor: '#6b46c1', borderRadius: '2px' }}/> 18–24</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '4px', backgroundColor: '#c4a7ff', borderRadius: '2px' }}/> 25–34</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '12px', height: '4px', backgroundColor: '#5b6670', borderRadius: '2px' }}/> 35+</div>
              </div>

              {/* Raw Graph Render (No internal padding, match exact style) */}
              <div style={{ height: '200px', margin: '0 -8px' }}>
                <ResponseTimeline
                  data={timelineData}
                  currentTimeMs={selectedTimeMs}
                  onTimeSelect={(t) => updateQueryParams({ media_time_ms: t })}
                  selectedCohort="all"
                />
              </div>
            </div>

            {/* Response Cliff Card */}
            <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ border: '1px solid #ff654a', borderRadius: '4px', padding: '2px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff654a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff654a', letterSpacing: '0.04em' }}>RESPONSE CLIFF</span>
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#ff654a', fontFamily: 'var(--font-display)', marginBottom: '8px', letterSpacing: '-0.02em' }}>{retentionDrop}</div>
                  <div style={{ fontSize: '12px', color: '#9aa8b2', lineHeight: '1.4', marginBottom: '16px' }}>Significant drop in engagement across all cohorts.</div>
                  <div style={{ fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AFFECTED RANGE</div>
                  <div style={{ fontSize: '14px', color: '#f1f3f2', fontFamily: 'monospace' }}>{detectedMoment}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {/* Mini Sparklines */}
                  <div style={{ height: '60px', width: '100%' }}>
                    <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none">
                       <path d="M 0 10 Q 20 15, 30 15 T 60 40 T 100 45" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="2 2" />
                       <path d="M 0 15 Q 20 20, 30 20 T 60 45 T 100 50" fill="none" stroke="#6b46c1" strokeWidth="1" />
                       <path d="M 0 20 Q 20 25, 30 25 T 60 50 T 100 55" fill="none" stroke="#c4a7ff" strokeWidth="2" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>RESPONDENTS</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f3f2', marginBottom: '12px' }}>{totalRespondents.toLocaleString()}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>CONFIDENCE</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8d979f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#b7e33d' }}>{confidence}%</span>
                    </div>
                    {/* Confidence Meter Bar */}
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#1c2630', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${confidence}%`, height: '100%', backgroundColor: '#b7e33d' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cohort Selector Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <button style={{ backgroundColor: '#1a103c', color: '#f1f3f2', border: '1px solid #8b5cf6', padding: '12px 0', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>ALL</button>
              <button style={{ backgroundColor: '#091218', color: '#9aa8b2', border: '1px solid #16232c', padding: '12px 0', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>18–24</button>
              <button style={{ backgroundColor: '#091218', color: '#9aa8b2', border: '1px solid #16232c', padding: '12px 0', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>25–34</button>
              <button style={{ backgroundColor: '#091218', color: '#9aa8b2', border: '1px solid #16232c', padding: '12px 0', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>35+</button>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleGenerateHypothesis}
              disabled={isGenerating}
              style={{
                backgroundColor: isGenerating ? '#1c2630' : '#b7e33d',
                color: isGenerating ? '#5b6670' : '#050a0e',
                border: 'none',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                letterSpacing: '0.04em'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>
              {isGenerating ? 'GENERATING HYPOTHESIS...' : 'GENERATE HYPOTHESIS'}
            </button>

          </div>
        ) : (
          /* --- DESKTOP LAYOUT (Fallback) --- */
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '20px',
                backgroundColor: 'var(--surface-1)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Respondents</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                  {totalRespondents.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detected Moment</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--coral)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                  {detectedMoment}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Retention Drop</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--coral)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                  {retentionDrop}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calibrated Confidence</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--lime)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                  {confidence}%
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '31% 46% 23%',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <MediaPlayer
                  initialTimecodeMs={selectedTimeMs}
                  onTimeUpdate={(t) => updateQueryParams({ media_time_ms: t })}
                  sceneTitle="12 · INT. APARTMENT – NIGHT"
                />

                <SceneFilmstrip
                  currentTimeMs={selectedTimeMs}
                  onTimeSelect={(t) => updateQueryParams({ media_time_ms: t })}
                />

                <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Scene Notes</div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                    <p style={{ margin: '0 0 8px 0' }}><strong>Context:</strong> Shadow entity revealed behind protagonist.</p>
                    <p style={{ margin: 0 }}><strong>Director's Intent:</strong> Build tension slowly before jump scare.</p>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Experiment Info</div>
                  <div style={{ fontSize: '12px', color: 'var(--text)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <span style={{ color: 'var(--muted)' }}>Experiment ID:</span><span>EXP_23A</span>
                    <span style={{ color: 'var(--muted)' }}>Scene:</span><span>12</span>
                    <span style={{ color: 'var(--muted)' }}>Cut:</span><span>Original (Cut A)</span>
                    <span style={{ color: 'var(--muted)' }}>Status:</span><span style={{ color: 'var(--lime)' }}>Active</span>
                  </div>
                </div>

                <AnomalyCallout
                  label="RESPONSE CLIFF"
                  effect="−28%"
                  timeRange="00:33–00:41"
                  isSelected={selectedTimeMs === 37000}
                  onClick={() => updateQueryParams({ media_time_ms: 37000 })}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--surface-1)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Cohort:</span>
                    {(['all', '18_24', '25_34'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => updateQueryParams({ cohort: c })}
                        style={{
                          backgroundColor: selectedCohort === c ? 'var(--violet)' : 'transparent',
                          color: selectedCohort === c ? '#fff' : 'var(--muted)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: 'none'
                        }}
                      >
                        {c === 'all' ? `All (${totalRespondents.toLocaleString()})` : c === '18_24' ? '18–24' : '25–34'}
                      </button>
                    ))}
                  </div>

                  <TimeWindowSelector
                    selectedWindow={selectedWindow}
                    onWindowChange={(w) => updateQueryParams({ window: w })}
                  />
                </div>

                <ResponseTimeline
                  data={timelineData}
                  currentTimeMs={selectedTimeMs}
                  onTimeSelect={(t) => updateQueryParams({ media_time_ms: t })}
                  selectedCohort={selectedCohort}
                />

                <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 12px 0' }}>Proposed Experiment / Edit Comparison</h3>
                  <CutComparison 
                    controlRevealMs={43000} 
                    variantRevealMs={37000} 
                    hypothesis={hypothesisData?.proposedChange}
                  />
                </div>

                <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 12px 0' }}>Expected Impact</h3>
                  <ConfidenceMeter
                    confidencePercent={confidence}
                    sampleSize={totalRespondents}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <McpActivityPanel activities={[]} />
                
                {hypothesisData && (
                  <HypothesisCard
                    hypothesis={hypothesisData}
                    onApproveClick={() => navigate(`/projects/${projectId}/experiments/${experimentId}/test`)}
                  />
                )}

                <ApprovalGate 
                  proposedChange="MOVE REVEAL 6S EARLIER"
                  onApproveAndLaunch={(id) => console.log('Approved by', id)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};
