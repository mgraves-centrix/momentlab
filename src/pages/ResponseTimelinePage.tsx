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
import { fetchExperimentTimeline, fetchExperimentHypothesis, fetchExperimentSummary, fetchRecentQueries, fetchProject, Project, TimelineDataPoint, Hypothesis, ExperimentSummary, generateHypothesis } from '../api/client';
import { useMobile } from '../hooks/useMobile';

import { StatePanel } from '../components/StatePanel';

export const ResponseTimelinePage: React.FC = () => {
  const { projectId, experimentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedCohort = (searchParams.get('cohort') as 'all' | '18_24' | '25_34') || 'all';
  const selectedWindow = (searchParams.get('window') as TimeWindow) || '30s';
  const selectedTimeMs = parseInt(searchParams.get('media_time_ms') || '37000', 10);

  const [projectData, setProjectData] = React.useState<Project | null>(null);
  const [timelineData, setTimelineData] = React.useState<TimelineDataPoint[]>([]);
  const [timelineError, setTimelineError] = React.useState<string | null>(null);
  const [hypothesisData, setHypothesisData] = React.useState<Hypothesis | null>(null);
  const [summaryData, setSummaryData] = React.useState<ExperimentSummary | null>(null);
  const [activities, setActivities] = React.useState<any[]>([]);
  const [mcpStatus, setMcpStatus] = React.useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTING');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setMcpStatus('CONNECTING');

    if (projectId) {
      fetchProject(projectId).then(data => {
        if (isMounted) setProjectData(data);
      }).catch(console.error);
    }
    if (projectId && experimentId) {
      Promise.all([
        fetchExperimentTimeline(projectId, experimentId, selectedCohort).then(data => {
          if (isMounted) {
            setTimelineData(data);
            setTimelineError(null);
          }
        }).catch((err) => {
          if (isMounted) {
            setTimelineData([]);
            setTimelineError(err.message || 'Telemetry database unavailable');
          }
        }),
        fetchExperimentHypothesis(projectId, experimentId).then(data => {
          if (isMounted) setHypothesisData(data);
        }).catch(() => {
          if (isMounted) setHypothesisData(null);
        }),
        fetchExperimentSummary(projectId, experimentId).then(data => {
          if (isMounted) setSummaryData(data);
        }).catch(() => {
          if (isMounted) setSummaryData(null);
        }),
        fetchRecentQueries().then(queries => {
          if (isMounted) {
            setActivities(queries.map((q: any, i: number) => ({
              id: `q_${i}`,
              toolName: 'ClickHouse Query',
              durationMs: q.duration_ms,
              rowCount: q.rows,
              queryPurpose: q.query
            })));
            setMcpStatus('CONNECTED');
          }
        }).catch(err => {
          console.error('Failed to fetch MCP recent queries:', err);
          if (isMounted) setMcpStatus('DISCONNECTED');
        })
      ]).finally(() => {
        if (isMounted) setIsLoading(false);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [projectId, experimentId, selectedCohort]);

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

  const isInsufficientSample = Boolean(
    summaryData?.status === 'INSUFFICIENT_SAMPLE' || 
    (summaryData !== null && summaryData.total_respondents < 100) ||
    (!isLoading && !summaryData && !hypothesisData && timelineData.length === 0)
  );

  const totalRespondents = summaryData?.total_respondents ?? 0;
  const detectedMoment = summaryData?.detected_moment ?? (hypothesisData as any)?.detectedMoment ?? '—';
  const retentionDrop = summaryData?.retention_drop ?? (hypothesisData as any)?.retentionDrop ?? '—';
  const confidence = summaryData?.confidence ?? hypothesisData?.confidenceScore ?? 0;

  return (
    <AppShell>
      <div style={{ padding: isMobile ? '0' : '24px', maxWidth: '1600px', width: '100%', boxSizing: 'border-box', margin: '0 auto', backgroundColor: isMobile ? '#050a0e' : 'transparent', minHeight: isMobile ? '100vh' : 'auto' }}>
        
        {isLoading ? (
          <div style={{ padding: '40px 16px' }}>
            <StatePanel type="loading" />
          </div>
        ) : isInsufficientSample ? (
          <div style={{ padding: isMobile ? '16px' : '40px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  Response Finding — {projectData?.title || 'Film Project'}
                </h1>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0 0' }}>
                  Scene Evaluation · Status: {projectData?.status || 'DRAFT'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-simulated">Synthetic Footage</span>
                <span className="badge badge-connected">ClickHouse MCP Connected</span>
              </div>
            </div>

            <StatePanel 
              type="insufficient_sample" 
              message={totalRespondents > 0 
                ? `Observed ${totalRespondents} respondents (< 100 threshold). Minimum 100 consented completions required before anomaly detection activates.` 
                : 'No screening data collected for this project yet (0 respondents). Minimum 100 consented completions required before anomaly detection activates.'} 
            />

            {projectData?.video_url && (
              <div style={{ marginTop: '16px' }}>
                <MediaPlayer
                  initialVideoUrl={projectData.video_url}
                  posterUrl={projectData.thumbnail_url}
                  initialTimecodeMs={selectedTimeMs}
                  onTimeUpdate={(t) => updateQueryParams({ media_time_ms: t })}
                  sceneTitle={projectData.title}
                />
              </div>
            )}
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em' }}>
                <span>SCENE 12</span>
                <span style={{ color: '#5b6670' }}>•</span>
                <span>INT. APARTMENT – NIGHT</span>
              </div>
            </div>

            <div style={{ margin: '0 -16px' }}>
              <MediaPlayer
                initialVideoUrl={projectData?.video_url}
                posterUrl={projectData?.thumbnail_url}
                initialTimecodeMs={selectedTimeMs}
                onTimeUpdate={(t) => updateQueryParams({ media_time_ms: t })}
                sceneTitle={projectData?.title ? `${projectData.title} · Scene Evaluation` : '12 · INT. APARTMENT – NIGHT'}
              />
            </div>

            <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', padding: '16px' }}>
              <div style={{ height: '200px', margin: '0 -8px' }}>
                <ResponseTimeline
                  data={timelineData}
                  currentTimeMs={selectedTimeMs}
                  onTimeSelect={(t) => updateQueryParams({ media_time_ms: t })}
                  selectedCohort={selectedCohort}
                  error={timelineError}
                />
              </div>
            </div>

            <button
              onClick={handleGenerateHypothesis}
              disabled={isGenerating}
              style={{
                backgroundColor: isGenerating ? '#1c2630' : '#b7e33d',
                color: '#050a0e',
                border: 'none',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                letterSpacing: '0.04em',
                boxShadow: '0 4px 12px rgba(183, 227, 61, 0.2)'
              }}
            >
              <span>{isGenerating ? 'ANALYZING TELEMETRY...' : 'INVESTIGATE & GENERATE HYPOTHESIS'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#050a0e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  Response Finding — {projectData?.title || 'Film Project'}
                </h1>
                <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '4px 0 0 0' }}>
                  {projectData?.project_id === 'proj_northlight_01' ? 'Int. Apartment – Night · 00:37 Anomaly Detected' : `${projectData?.title || 'Film'} · Scene Screening Evaluation`}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-simulated">Synthetic Footage</span>
                <span className="badge badge-connected">ClickHouse MCP Connected</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: 'var(--surface-1)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Screening Sample Size</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                  {totalRespondents.toLocaleString()} <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 400 }}>respondents</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detected Moment</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--violet-soft)', fontFamily: 'monospace' }}>
                  {detectedMoment}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Retention Drop</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--coral)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                  {retentionDrop}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>
                  vs 00:00–00:10 baseline
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calibrated Confidence</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--lime)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                  {confidence}%
                </div>
              </div>
            </div>

            <div className="finding-layout-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                <MediaPlayer
                  initialVideoUrl={projectData?.video_url}
                  posterUrl={projectData?.thumbnail_url}
                  initialTimecodeMs={selectedTimeMs}
                  onTimeUpdate={(t) => updateQueryParams({ media_time_ms: t })}
                  sceneTitle={projectData?.title ? `${projectData.title} · ${projectData.project_id === 'proj_northlight_01' ? '12 · INT. APARTMENT – NIGHT' : 'Scene Evaluation'}` : '12 · INT. APARTMENT – NIGHT'}
                />

                <SceneFilmstrip
                  currentTimeMs={selectedTimeMs}
                  onTimeSelect={(t) => updateQueryParams({ media_time_ms: t })}
                  durationMs={65000}
                />

                {summaryData?.anomaly_window && summaryData?.retention_drop && (
                  <AnomalyCallout
                    label="RESPONSE CLIFF"
                    effect={summaryData.retention_drop}
                    timeRange={summaryData.anomaly_window}
                    isSelected={selectedTimeMs === (summaryData.detected_moment_ms || 37000)}
                    onClick={() => updateQueryParams({ media_time_ms: summaryData.detected_moment_ms || 37000 })}
                  />
                )}

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
                    <span style={{ color: 'var(--muted)' }}>Experiment ID:</span><span>{experimentId?.toUpperCase() || '—'}</span>
                    <span style={{ color: 'var(--muted)' }}>Scene:</span><span>12</span>
                    <span style={{ color: 'var(--muted)' }}>Cut:</span><span>Original (Cut A)</span>
                    <span style={{ color: 'var(--muted)' }}>Status:</span><span style={{ color: 'var(--lime)' }}>Active</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
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
                        {c === 'all' ? (totalRespondents > 0 ? `All (${totalRespondents.toLocaleString()})` : 'All') : c === '18_24' ? '18–24' : '25–34'}
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
                  error={timelineError}
                />

                <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 12px 0' }}>Proposed Experiment / Edit Comparison</h3>
                  <CutComparison 
                    controlRevealMs={43000} 
                    variantRevealMs={37000} 
                    hypothesis={hypothesisData?.proposedChange}
                    controlPoster={projectData?.thumbnail_url || "/frames/cut_a_control.png"}
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

              <div className="finding-col-rail" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                <McpActivityPanel activities={activities} status={mcpStatus} />
                
                {hypothesisData && (
                  <HypothesisCard
                    hypothesis={hypothesisData}
                    onApproveClick={() => navigate(`/projects/${projectId}/experiments/${experimentId}/test`)}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
};
