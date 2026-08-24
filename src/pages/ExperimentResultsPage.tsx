import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '../components/AppShell';
import { 
  Download, ChevronRight, Sparkles, Calendar, Info, AlertTriangle, Play, Pause 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Bar, Cell } from 'recharts';

interface HoverInfo {
  x: number;
  y: number;
  text: string;
}

const VideoPlayerWithTimeline: React.FC<{ 
  src: string; 
  poster?: string;
  revealTime: number; 
  simulatedDuration: number;
  highlightColor?: string; 
}> = ({ src, poster = "/northlight_thumb.png", revealTime, simulatedDuration, highlightColor }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) videoRef.current.pause();
      else videoRef.current.play();
      setPlaying(!playing);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgressPercent((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && videoRef.current.duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
      setProgressPercent(pos * 100);
    }
  };

  const currentSimulatedTime = (progressPercent / 100) * simulatedDuration;
  const revealPercent = (revealTime / simulatedDuration) * 100;

  // Generate 40 segments for the bar
  const segments = Array.from({ length: 40 });

  return (
    <div style={{ position: 'relative', height: '160px', backgroundColor: '#000', borderRadius: '4px', border: '1px solid #1c2630', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video 
          ref={videoRef} 
          src={src} 
          poster={poster}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          playsInline 
          loop
          muted
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setPlaying(false)}
        />
        <button onClick={togglePlay} style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', zIndex: 20 }}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        
        {/* Playhead */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${progressPercent}%`, width: '1px', backgroundColor: '#fff', zIndex: 15, transform: 'translateX(-50%)', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#000', border: '1px solid #333', padding: '2px 4px', fontSize: '9px', borderRadius: '2px', color: '#fff' }}>
            {formatTime(currentSimulatedTime)}
          </div>
          <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '7px', height: '7px', backgroundColor: '#fff', borderRadius: '50%' }}></div>
        </div>
        
        {/* Reveal Marker (Static) */}
        {revealPercent <= 100 && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${revealPercent}%`, width: '1px', backgroundColor: highlightColor || '#8d979f', zIndex: 10, transform: 'translateX(-50%)', pointerEvents: 'none', opacity: highlightColor ? 1 : 0.6 }}>
             <div style={{ position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)', backgroundColor: highlightColor || '#000', color: highlightColor ? '#000' : '#fff', border: highlightColor ? 'none' : '1px solid #333', padding: '2px 4px', fontSize: '9px', borderRadius: '2px', fontWeight: 700 }}>
              {formatTime(revealTime)}
            </div>
             <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '7px', height: '7px', backgroundColor: highlightColor || '#8d979f', borderRadius: '50%' }}></div>
          </div>
        )}
        
        <div style={{ position: 'absolute', bottom: '8px', right: '8px', fontSize: '9px', color: '#8d979f', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 4px', zIndex: 10, pointerEvents: 'none' }}>
          {formatTime(simulatedDuration)}
        </div>
      </div>

      {/* Segmented Timeline */}
      <div onClick={handleSeek} style={{ height: '14px', display: 'flex', gap: '2px', backgroundColor: '#000', padding: '2px 4px', cursor: 'pointer', position: 'relative' }}>
        {segments.map((_, i) => {
          const segPercentStart = (i / segments.length) * 100;
          const isBeforeReveal = segPercentStart < revealPercent;
          const isPlayed = segPercentStart <= progressPercent;
          let color = '#333';
          if (highlightColor && isBeforeReveal) {
            color = highlightColor;
          } else if (i % 3 === 0) {
            color = '#555';
          }
          return <div key={i} style={{ flex: 1, backgroundColor: color, opacity: isPlayed ? 1 : 0.4 }}></div>;
        })}
      </div>
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#1c2630', padding: '8px', border: '1px solid #283540', borderRadius: '4px', fontSize: '11px', color: '#fff' }}>
        <div style={{ marginBottom: '4px', color: '#8d979f' }}>{label}</div>
        <div style={{ color: '#9f7aea' }}>Cut A (Control): {payload[0].value}%</div>
        <div style={{ color: '#6b46c1' }}>Cut B (Variant): {payload[1].value}%</div>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#1c2630', padding: '8px', border: '1px solid #283540', borderRadius: '4px', fontSize: '11px', color: '#fff' }}>
        <div style={{ marginBottom: '4px', color: '#8d979f' }}>Lift Bucket: {label}</div>
        <div style={{ color: '#b7e33d' }}>Distribution: {payload[0].value}</div>
      </div>
    );
  }
  return null;
};

import { useMobile } from '../hooks/useMobile';

export const ExperimentResultsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'SUPPORTED' | 'REJECTED' | 'INCONCLUSIVE'>('SUPPORTED');
  const isMobile = useMobile();

  const sampleVideoUrl = "/scene12.mp4";

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch('/api/v1/projects/proj_northlight_01/experiments/exp_23a/results');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to fetch results", e);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const handleInfoHover = (e: React.MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverInfo({ x: rect.left, y: rect.top - 10, text });
  };

  const handleInfoLeave = () => setHoverInfo(null);

  const handleExportCSV = () => {
    if (!data) return;
    let csv = "Cohort,Cut A,Cut B,Lift,95% CI,Confidence\n";
    data.cohort_breakdown.forEach((c: any) => {
      csv += `${c.cohort},${c.cut_a}%,${c.cut_b}%,+${c.lift}%,${c.ci},${c.confidence}%\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiment_results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateFollowUp = () => {
    alert("Follow-up Hypothesis Created! (Demo)");
  };

  if (loading) {
    return <AppShell><div style={{ padding: '32px', color: '#fff' }}>Loading results...</div></AppShell>;
  }

  if (!data) {
    return <AppShell><div style={{ padding: '32px', color: '#fff' }}>Failed to load results.</div></AppShell>;
  }

  const {
    hypothesis, outcome, outcome_details, confidence, test_period_start, test_period_end, test_duration_days,
    sample_size_control, sample_size_variant, cohort_breakdown, engagement_over_time, engagement_lift_distribution,
    key_results, metadata
  } = data;

  return (
    <AppShell>
      <div style={{ backgroundColor: '#080b0e', minHeight: 'calc(100vh - 64px)', padding: isMobile ? '16px' : '24px 32px 64px 32px', width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflowX: 'hidden', color: '#f1f3f2', position: 'relative' }}>
        
        {hoverInfo && (
          <div style={{
            position: 'fixed', left: hoverInfo.x, top: hoverInfo.y, transform: 'translate(-50%, -100%)',
            backgroundColor: '#1c2630', padding: '6px 10px', borderRadius: '4px', fontSize: '10px',
            color: '#fff', zIndex: 1000, pointerEvents: 'none', border: '1px solid #283540', whiteSpace: 'nowrap'
          }}>
            {hoverInfo.text}
          </div>
        )}

        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span>EXPERIMENTS</span>
          <ChevronRight size={12} color="#8d979f" />
          <span>SCENE 12</span>
          <ChevronRight size={12} color="#8d979f" />
          <span>EXPERIMENT 23A</span>
          <ChevronRight size={12} color="#8d979f" />
          <span style={{ color: '#ffffff' }}>RESULTS</span>
        </div>

        {/* Header Title Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0, textTransform: 'uppercase' }}>
              SCREEN 08 — EXPERIMENT RESULTS
            </h1>
            <div style={{ border: '1px solid #3b2c6e', backgroundColor: 'transparent', color: '#c4a7ff', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.04em' }}>
              SIMULATED DEMO RESULTS
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={handleExportCSV} style={{ backgroundColor: 'transparent', border: '1px solid #283540', color: '#8d979f', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <Download size={16} />
              EXPORT REPORT
            </button>
            <button onClick={handleCreateFollowUp} style={{ backgroundColor: '#b7e33d', border: 'none', color: '#000', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              CREATE FOLLOW-UP
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Top Metrics Row (5 Panels) */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', border: '1px solid #1c2630', borderRadius: '6px', backgroundColor: '#0c1115', marginBottom: '16px' }}>
          
          {/* HYPOTHESIS */}
          <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #1c2630' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '12px' }}>
              HYPOTHESIS <Info size={12} onMouseEnter={(e) => handleInfoHover(e, "The proposed change being tested")} onMouseLeave={handleInfoLeave} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="#c4a7ff" />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {hypothesis}
              </span>
            </div>
          </div>

          {/* OUTCOME */}
          <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #1c2630' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '8px' }}>
              OUTCOME <Info size={12} onMouseEnter={(e) => handleInfoHover(e, "The overall result of the experiment")} onMouseLeave={handleInfoLeave} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: outcome === 'SUPPORTED' ? '#b7e33d' : '#ff6652', textTransform: 'uppercase' }}>
              {outcome}
            </div>
            <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '4px' }}>
              {outcome_details}
            </div>
          </div>

          {/* CONFIDENCE */}
          <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #1c2630' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '8px' }}>
              CONFIDENCE <Info size={12} onMouseEnter={(e) => handleInfoHover(e, "Statistical confidence level")} onMouseLeave={handleInfoLeave} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#b7e33d' }}>
              {confidence}%
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#1c2630', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${confidence}%`, height: '100%', backgroundColor: '#b7e33d', borderRadius: '3px' }} />
            </div>
          </div>

          {/* TEST PERIOD */}
          <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #1c2630' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '12px' }}>
              TEST PERIOD <Info size={12} onMouseEnter={(e) => handleInfoHover(e, "Dates when the test was active")} onMouseLeave={handleInfoLeave} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
              <Calendar size={16} color="#8d979f" />
              {test_period_start} — {test_period_end}
            </div>
            <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '6px' }}>
              {test_duration_days} days
            </div>
          </div>

          {/* SAMPLE SIZES */}
          <div style={{ flex: 1, padding: '20px', display: 'flex' }}>
            <div style={{ flex: 1 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '12px' }}>
                SAMPLE SIZES <Info size={12} onMouseEnter={(e) => handleInfoHover(e, "Number of subjects in each variant")} onMouseLeave={handleInfoLeave} />
              </div>
              <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px', textTransform: 'uppercase' }}>CUT A (CONTROL)</div>
              <div style={{ fontSize: '20px', fontWeight: 800 }} className="tabular-nums">{sample_size_control.toLocaleString()}</div>
            </div>
            <div style={{ flex: 1, marginTop: '24px' }}>
               <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px', textTransform: 'uppercase' }}>CUT B (VARIANT)</div>
               <div style={{ fontSize: '20px', fontWeight: 800 }} className="tabular-nums">{sample_size_variant.toLocaleString()}</div>
            </div>
          </div>

        </div>

        {/* Tab Row */}
        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #1c2630', marginBottom: '24px' }}>
          <div onClick={() => setActiveTab('SUPPORTED')} style={{ paddingBottom: '12px', borderBottom: activeTab === 'SUPPORTED' ? '2px solid #b7e33d' : 'none', color: activeTab === 'SUPPORTED' ? '#ffffff' : '#8d979f', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}>
            SUPPORTED (1)
          </div>
          <div onClick={() => setActiveTab('REJECTED')} style={{ paddingBottom: '12px', borderBottom: activeTab === 'REJECTED' ? '2px solid #b7e33d' : 'none', color: activeTab === 'REJECTED' ? '#ffffff' : '#8d979f', fontSize: '11px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' }}>
            REJECTED (0)
          </div>
          <div onClick={() => setActiveTab('INCONCLUSIVE')} style={{ paddingBottom: '12px', borderBottom: activeTab === 'INCONCLUSIVE' ? '2px solid #b7e33d' : 'none', color: activeTab === 'INCONCLUSIVE' ? '#ffffff' : '#8d979f', fontSize: '11px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' }}>
            INCONCLUSIVE (0)
          </div>
        </div>

        {activeTab !== 'SUPPORTED' ? (
           <div style={{ padding: '64px', textAlign: 'center', color: '#8d979f' }}>No results for this category.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {/* Main Grid: 40% | 40% | 20% */}
            
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
              
              {/* REVEAL COMPARISON */}
              <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #1c2630', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  REVEAL COMPARISON
                </div>
                
                <div style={{ padding: '16px', borderBottom: '1px solid #1c2630' }}>
                  <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px', textTransform: 'uppercase' }}>CUT A (CONTROL)</div>
                  <div style={{ fontSize: '12px', color: '#8d979f', marginBottom: '12px' }}>Original — Reveal at 00:43</div>
                  
                  <VideoPlayerWithTimeline 
                    src={sampleVideoUrl}
                    poster="/frames/cut_a_control.png"
                    revealTime={43}
                    simulatedDuration={138}
                  />
                </div>

                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px', textTransform: 'uppercase' }}>CUT B (VARIANT)</div>
                  <div style={{ fontSize: '12px', color: '#b7e33d', marginBottom: '12px' }}>{hypothesis || "Move reveal 6s earlier"} — Reveal at 00:37</div>
                  
                  <VideoPlayerWithTimeline 
                    src={sampleVideoUrl}
                    poster="/frames/cut_b_variant.png"
                    revealTime={37}
                    simulatedDuration={138}
                    highlightColor="#b7e33d"
                  />
                </div>
              </div>

              {/* COHORT BREAKDOWN */}
              <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #1c2630', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  COHORT BREAKDOWN — ENGAGEMENT LIFT <Info size={12} color="#8d979f" onMouseEnter={(e) => handleInfoHover(e, "Engagement lift broken down by age cohorts")} onMouseLeave={handleInfoLeave} />
                </div>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '420px', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ color: '#8d979f', fontSize: '10px', textTransform: 'uppercase' }}>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600 }}>COHORT</th>
                        <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>CUT A</th>
                        <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>CUT B</th>
                        <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>LIFT</th>
                        <th style={{ textAlign: 'center', padding: '12px', fontWeight: 600 }}>95% CI</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600 }}>CONFIDENCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohort_breakdown.map((row: any, i: number) => (
                        <tr key={i} style={{ borderTop: '1px solid #1c2630' }}>
                          <td style={{ padding: '16px', fontWeight: 600 }}>{row.cohort}</td>
                          <td style={{ textAlign: 'center', color: '#8d979f' }}>{row.cut_a}%</td>
                          <td style={{ textAlign: 'center', color: '#8d979f' }}>{row.cut_b}%</td>
                          <td style={{ textAlign: 'center', color: '#b7e33d', fontWeight: 700 }}>+{row.lift}%</td>
                          <td style={{ textAlign: 'center', color: '#b7e33d' }}>{row.ci}</td>
                          <td style={{ textAlign: 'center', color: '#b7e33d', fontWeight: 700, paddingRight: '16px' }}>{row.confidence}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* MIDDLE COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* ENGAGEMENT OVER TIME */}
              <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px', padding: '16px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ENGAGEMENT OVER TIME
                    <Info size={12} color="#8d979f" onMouseEnter={(e) => handleInfoHover(e, "Engagement trends across the video duration")} onMouseLeave={handleInfoLeave} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#8d979f' }}>Metric</span>
                    <div style={{ backgroundColor: 'transparent', border: '1px solid #283540', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Engagement <ChevronRight size={10} style={{ transform: 'rotate(90deg)' }} />
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', fontSize: '11px', color: '#8d979f' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '4px', backgroundColor: '#9f7aea', borderRadius: '2px' }}></div>
                    Cut A (Control)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '4px', backgroundColor: '#6b46c1', borderRadius: '2px' }}></div>
                    Cut B (Variant)
                  </div>
                </div>

                <div style={{ width: '100%', height: '220px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagement_over_time} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <XAxis dataKey="time" stroke="#8d979f" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#8d979f" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                      <RechartsTooltip content={<CustomLineTooltip />} />
                      <Line type="monotone" dataKey="cut_a" stroke="#9f7aea" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="cut_b" stroke="#6b46c1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ENGAGEMENT LIFT DISTRIBUTION */}
              <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
                  ENGAGEMENT LIFT DISTRIBUTION (ALL COHORTS) <Info size={12} color="#8d979f" onMouseEnter={(e) => handleInfoHover(e, "Distribution of the engagement lift across viewers")} onMouseLeave={handleInfoLeave} />
                </div>
                
                <div style={{ width: '100%', height: '180px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={engagement_lift_distribution} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <XAxis dataKey="bucket" stroke="#8d979f" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#8d979f" fontSize={10} tickLine={false} axisLine={false} hide />
                      <RechartsTooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                        {engagement_lift_distribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.bucket.startsWith('+') ? '#8b5cf6' : '#6b46c1'} />
                        ))}
                      </Bar>
                      <Line type="monotone" dataKey="value" stroke="#b7e33d" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                
                <div style={{ textAlign: 'center', fontSize: '9px', color: '#8d979f', marginTop: '8px' }}>Engagement Lift</div>

                <div style={{ fontSize: '10px', color: '#8d979f', marginTop: '16px' }}>
                  95% of simulated outcomes fall within the confidence interval.
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* KEY RESULTS */}
              <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '20px' }}>
                  KEY RESULTS <Info size={12} color="#8d979f" onMouseEnter={(e) => handleInfoHover(e, "Summary of primary and secondary metrics")} onMouseLeave={handleInfoLeave} />
                </div>

                {/* PRIMARY */}
                <div style={{ marginBottom: '20px', borderBottom: '1px solid #1c2630', paddingBottom: '20px' }}>
                  <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '8px' }}>PRIMARY (EFFICACY)</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#8d979f', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>{key_results.primary.metric} <Info size={10} onMouseEnter={(e) => handleInfoHover(e, "Primary metric tested")} onMouseLeave={handleInfoLeave} /></div>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: '#b7e33d' }} className="tabular-nums">{key_results.primary.value}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px' }}>95% CI</div>
                      <div style={{ fontSize: '12px', color: '#8d979f' }}>{key_results.primary.ci}</div>
                    </div>
                  </div>
                </div>

                {/* SECONDARY */}
                <div style={{ marginBottom: '20px', borderBottom: '1px solid #1c2630', paddingBottom: '20px' }}>
                  <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '8px' }}>SECONDARY (EFFICACY)</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#8d979f', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>{key_results.secondary.metric} <Info size={10} onMouseEnter={(e) => handleInfoHover(e, "Secondary metric tested")} onMouseLeave={handleInfoLeave} /></div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#b7e33d' }} className="tabular-nums">{key_results.secondary.value}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px' }}>95% CI</div>
                      <div style={{ fontSize: '12px', color: '#8d979f' }}>{key_results.secondary.ci}</div>
                    </div>
                  </div>
                </div>

                {/* GUARDRAIL */}
                <div>
                  <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '8px' }}>GUARDRAIL</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#8d979f', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>{key_results.guardrail.metric} <Info size={10} onMouseEnter={(e) => handleInfoHover(e, "Guardrail metric to ensure no negative impact")} onMouseLeave={handleInfoLeave} /></div>
                      <div style={{ fontSize: '24px', fontWeight: 800, color: '#ff6652' }} className="tabular-nums">{key_results.guardrail.value}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px' }}>95% CI</div>
                      <div style={{ fontSize: '12px', color: '#8d979f' }}>{key_results.guardrail.ci}</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* EVIDENCE & QUERIES */}
              <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
                  EVIDENCE & QUERIES <Info size={12} color="#8d979f" onMouseEnter={(e) => handleInfoHover(e, "Underlying query identifiers and dataset snapshots")} onMouseLeave={handleInfoLeave} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8d979f' }}>Experiment ID</span>
                    <span style={{ color: '#ffffff' }}>EXP-23A</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8d979f' }}>Analysis ID</span>
                    <span style={{ color: '#ffffff' }}>{metadata.analysis_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8d979f' }}>Dataset Snapshot</span>
                    <span style={{ color: '#ffffff' }}>{metadata.dataset_snapshot}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8d979f' }}>Query Bundle ID</span>
                    <span style={{ color: '#ffffff', display: 'flex', gap: '4px', alignItems: 'center' }}>{metadata.query_bundle_id} <Download size={10} style={{ cursor: 'pointer' }} /></span>
                  </div>
                </div>
              </div>

              {/* CLICKHOUSE MCP */}
              <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    CLICKHOUSE MCP <Info size={12} color="#8d979f" onMouseEnter={(e) => handleInfoHover(e, "Real-time DB connection status")} onMouseLeave={handleInfoLeave} />
                  </div>
                  <div style={{ color: '#58c94b', fontSize: '9px', fontWeight: 700, border: '1px solid #58c94b', padding: '2px 6px', borderRadius: '2px' }}>
                    CONNECTED
                  </div>
                </div>
                
                <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '8px' }}>RECENT QUERY TRACE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '10px', color: '#8d979f', marginBottom: '16px', fontFamily: 'monospace' }}>
                  <div style={{ display: 'flex', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b7e33d', marginTop: '3px' }}></div> 10:41:58 SELECT engagement_over_time ... <span style={{ marginLeft: 'auto' }}>4.2s</span></div>
                  <div style={{ display: 'flex', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b7e33d', marginTop: '3px' }}></div> 10:41:45 SELECT cohort_breakdown ... <span style={{ marginLeft: 'auto' }}>3.1s</span></div>
                  <div style={{ display: 'flex', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b7e33d', marginTop: '3px' }}></div> 10:41:32 SELECT metric_lifts ... <span style={{ marginLeft: 'auto' }}>2.7s</span></div>
                  <div style={{ display: 'flex', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b7e33d', marginTop: '3px' }}></div> 10:41:18 SELECT confusion_rate ... <span style={{ marginLeft: 'auto' }}>1.9s</span></div>
                  <div style={{ display: 'flex', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b7e33d', marginTop: '3px' }}></div> 10:41:05 SELECT experiment_metadata ... <span style={{ marginLeft: 'auto' }}>1.2s</span></div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '4px' }}>DATA SOURCE</div>
                    <div style={{ fontSize: '11px', color: '#ffffff' }}>ClickHouse Cloud</div>
                  </div>
                  <button style={{ backgroundColor: 'transparent', border: '1px solid #283540', color: '#8d979f', padding: '6px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
                    VIEW ALL QUERIES
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* Floating Warning Footer */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px', backgroundColor: '#0d1318', borderTop: '1px solid #202b35', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#8d979f' }}>
            <AlertTriangle size={14} color="#f2b84b" />
            <span style={{ color: '#f2b84b', fontWeight: 700 }}>SIMULATED DEMO RESULTS —</span> Not real user data. Results are for demonstration only.
          </div>
          <div style={{ fontSize: '11px', color: '#8d979f' }}>
            Statistical uncertainty is shown. Do not infer causation.
          </div>
        </div>

      </div>
    </AppShell>
  );
};
