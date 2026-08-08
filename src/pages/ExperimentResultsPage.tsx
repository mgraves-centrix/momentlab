import React from 'react';
import { AppShell } from '../components/AppShell';
import { 
  Download, ChevronRight, Sparkles, Calendar, Info, AlertTriangle 
} from 'lucide-react';

export const ExperimentResultsPage: React.FC = () => {
  return (
    <AppShell>
      <div style={{ backgroundColor: '#080b0e', minHeight: 'calc(100vh - 64px)', padding: '24px 32px 64px 32px', color: '#f1f3f2', position: 'relative' }}>
        
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
          <span>EXPERIMENTS</span>
          <ChevronRight size={12} color="#8d979f" />
          <span>SCENE 12</span>
          <ChevronRight size={12} color="#8d979f" />
          <span>EXPERIMENT 23A</span>
          <ChevronRight size={12} color="#8d979f" />
          <span style={{ color: '#ffffff' }}>RESULTS</span>
        </div>

        {/* Header Title Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0, textTransform: 'uppercase' }}>
              SCREEN 08 — EXPERIMENT RESULTS
            </h1>
            <div style={{ border: '1px solid #3b2c6e', backgroundColor: 'transparent', color: '#c4a7ff', fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.04em' }}>
              SIMULATED DEMO RESULTS
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{ backgroundColor: 'transparent', border: '1px solid #283540', color: '#8d979f', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              <Download size={16} />
              EXPORT REPORT
            </button>
            <button style={{ backgroundColor: '#b7e33d', border: 'none', color: '#080b0e', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              CREATE FOLLOW-UP
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Top Metrics Row (5 Panels) */}
        <div style={{ display: 'flex', border: '1px solid #1c2630', borderRadius: '6px', backgroundColor: '#0c1115', marginBottom: '16px' }}>
          
          {/* HYPOTHESIS */}
          <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #1c2630' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '12px' }}>
              HYPOTHESIS <Info size={12} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="#c4a7ff" />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                MOVE REVEAL 6S EARLIER
              </span>
            </div>
          </div>

          {/* OUTCOME */}
          <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #1c2630' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '8px' }}>
              OUTCOME <Info size={12} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#b7e33d', textTransform: 'uppercase' }}>
              SUPPORTED
            </div>
            <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '4px' }}>
              Statistically significant lift detected
            </div>
          </div>

          {/* CONFIDENCE */}
          <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #1c2630' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '8px' }}>
              CONFIDENCE <Info size={12} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#b7e33d' }}>
              91%
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#1c2630', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: '91%', height: '100%', backgroundColor: '#b7e33d', borderRadius: '3px' }} />
            </div>
          </div>

          {/* TEST PERIOD */}
          <div style={{ flex: 1, padding: '20px', borderRight: '1px solid #1c2630' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '12px' }}>
              TEST PERIOD <Info size={12} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
              <Calendar size={16} color="#8d979f" />
              May 19–26, 2025
            </div>
            <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '6px' }}>
              7 days
            </div>
          </div>

          {/* SAMPLE SIZES */}
          <div style={{ flex: 1, padding: '20px', display: 'flex' }}>
            <div style={{ flex: 1 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '12px' }}>
                SAMPLE SIZES <Info size={12} />
              </div>
              <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px', textTransform: 'uppercase' }}>CUT A (CONTROL)</div>
              <div style={{ fontSize: '20px', fontWeight: 800 }} className="tabular-nums">2,366</div>
            </div>
            <div style={{ flex: 1, marginTop: '24px' }}>
               <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px', textTransform: 'uppercase' }}>CUT B (VARIANT)</div>
               <div style={{ fontSize: '20px', fontWeight: 800 }} className="tabular-nums">2,366</div>
            </div>
          </div>

        </div>

        {/* Tab Row */}
        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #1c2630', marginBottom: '24px' }}>
          <div style={{ paddingBottom: '12px', borderBottom: '2px solid #b7e33d', color: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}>
            SUPPORTED (1)
          </div>
          <div style={{ paddingBottom: '12px', color: '#8d979f', fontSize: '11px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' }}>
            REJECTED (0)
          </div>
          <div style={{ paddingBottom: '12px', color: '#8d979f', fontSize: '11px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' }}>
            INCONCLUSIVE (0)
          </div>
        </div>

        {/* Main Grid: 40% | 40% | 20% */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 280px', gap: '16px' }}>
          
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* REVEAL COMPARISON */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #1c2630', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                REVEAL COMPARISON
              </div>
              
              <div style={{ padding: '16px', borderBottom: '1px solid #1c2630' }}>
                <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px', textTransform: 'uppercase' }}>CUT A (CONTROL)</div>
                <div style={{ fontSize: '12px', color: '#8d979f', marginBottom: '12px' }}>Original — Reveal at 00:43</div>
                
                {/* Filmstrip A */}
                <div style={{ position: 'relative', height: '80px', backgroundColor: '#000', borderRadius: '4px', overflow: 'hidden', border: '1px solid #1c2630' }}>
                  <img src="/northlight_thumb.png" alt="Cut A" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                  {/* Playhead A */}
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '60%', width: '1px', backgroundColor: '#ffffff', zIndex: 10 }}>
                     <div style={{ position: 'absolute', top: '-6px', left: '-16px', backgroundColor: '#000', border: '1px solid #333', padding: '2px 4px', fontSize: '9px', borderRadius: '2px' }}>00:43</div>
                     <div style={{ position: 'absolute', bottom: 0, left: '-3px', width: '7px', height: '7px', backgroundColor: '#ffffff', borderRadius: '50%' }}></div>
                  </div>
                  <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '9px', color: '#8d979f', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 4px' }}>02:18</div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '12px', display: 'flex', gap: '2px', opacity: 0.6 }}>
                    <div style={{ flex: 1, backgroundColor: '#333' }}></div>
                    <div style={{ flex: 2, backgroundColor: '#555' }}></div>
                    <div style={{ flex: 1, backgroundColor: '#333' }}></div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px', textTransform: 'uppercase' }}>CUT B (VARIANT)</div>
                <div style={{ fontSize: '12px', color: '#b7e33d', marginBottom: '12px' }}>Move reveal 6s earlier — Reveal at 00:37</div>
                
                {/* Filmstrip B */}
                <div style={{ position: 'relative', height: '80px', backgroundColor: '#000', borderRadius: '4px', overflow: 'hidden', border: '1px solid #1c2630' }}>
                  <img src="/northlight_thumb.png" alt="Cut B" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                  {/* Playhead B */}
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', backgroundColor: '#b7e33d', zIndex: 10 }}>
                     <div style={{ position: 'absolute', top: '-6px', left: '-16px', backgroundColor: '#b7e33d', color: '#000', padding: '2px 4px', fontSize: '9px', borderRadius: '2px', fontWeight: 700 }}>00:37</div>
                     <div style={{ position: 'absolute', bottom: 0, left: '-3px', width: '7px', height: '7px', backgroundColor: '#b7e33d', borderRadius: '50%' }}></div>
                  </div>
                  <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '9px', color: '#8d979f', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 4px' }}>02:18</div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '12px', display: 'flex', gap: '2px', opacity: 0.6 }}>
                    <div style={{ flex: 1, backgroundColor: '#333' }}></div>
                    <div style={{ flex: 3, backgroundColor: '#b7e33d', opacity: 0.5 }}></div>
                    <div style={{ flex: 1, backgroundColor: '#333' }}></div>
                  </div>
                </div>
              </div>

            </div>

            {/* COHORT BREAKDOWN */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #1c2630', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                COHORT BREAKDOWN — ENGAGEMENT LIFT <Info size={12} color="#8d979f" />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
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
                  <tr style={{ borderTop: '1px solid #1c2630' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>ALL</td>
                    <td style={{ textAlign: 'center', color: '#8d979f' }}>55%</td>
                    <td style={{ textAlign: 'center', color: '#8d979f' }}>65%</td>
                    <td style={{ textAlign: 'center', color: '#b7e33d', fontWeight: 700 }}>+18%</td>
                    <td style={{ textAlign: 'center', color: '#b7e33d' }}>[+12%, +24%]</td>
                    <td style={{ textAlign: 'center', color: '#b7e33d', fontWeight: 700, paddingRight: '16px' }}>91%</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #1c2630' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>18–24</td>
                    <td style={{ textAlign: 'center', color: '#8d979f' }}>58%</td>
                    <td style={{ textAlign: 'center', color: '#8d979f' }}>69%</td>
                    <td style={{ textAlign: 'center', color: '#b7e33d', fontWeight: 700 }}>+19%</td>
                    <td style={{ textAlign: 'center', color: '#b7e33d' }}>[+10%, +28%]</td>
                    <td style={{ textAlign: 'center', color: '#b7e33d', fontWeight: 700, paddingRight: '16px' }}>87%</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid #1c2630' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>25–34</td>
                    <td style={{ textAlign: 'center', color: '#8d979f' }}>53%</td>
                    <td style={{ textAlign: 'center', color: '#8d979f' }}>63%</td>
                    <td style={{ textAlign: 'center', color: '#b7e33d', fontWeight: 700 }}>+19%</td>
                    <td style={{ textAlign: 'center', color: '#b7e33d' }}>[+11%, +27%]</td>
                    <td style={{ textAlign: 'center', color: '#b7e33d', fontWeight: 700, paddingRight: '16px' }}>90%</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* MIDDLE COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* ENGAGEMENT OVER TIME */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px', padding: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ENGAGEMENT OVER TIME
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
                  <div style={{ width: '12px', height: '4px', backgroundColor: '#6b46c1', borderRadius: '2px' }}></div>
                  Cut A (Control)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '4px', backgroundColor: '#9f7aea', borderRadius: '2px' }}></div>
                  Cut B (Variant)
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                  <div style={{ border: '1px solid #283540', padding: '2px 8px', borderRadius: '4px' }}>10S</div>
                  <div style={{ border: '1px solid #283540', padding: '2px 8px', borderRadius: '4px' }}>30S</div>
                  <div style={{ border: '1px solid #283540', padding: '2px 8px', borderRadius: '4px' }}>1M</div>
                </div>
              </div>

              {/* Chart SVG Placeholder */}
              <div style={{ position: 'relative', height: '180px', width: '100%', borderBottom: '1px solid #1c2630', borderLeft: '1px solid #1c2630' }}>
                {/* Y-Axis */}
                <div style={{ position: 'absolute', left: '-32px', top: 0, fontSize: '9px', color: '#8d979f' }}>100%</div>
                <div style={{ position: 'absolute', left: '-28px', top: '25%', fontSize: '9px', color: '#8d979f' }}>75%</div>
                <div style={{ position: 'absolute', left: '-28px', top: '50%', fontSize: '9px', color: '#8d979f' }}>50%</div>
                <div style={{ position: 'absolute', left: '-28px', top: '75%', fontSize: '9px', color: '#8d979f' }}>25%</div>
                <div style={{ position: 'absolute', left: '-20px', bottom: '-4px', fontSize: '9px', color: '#8d979f' }}>0%</div>
                
                {/* Dotted lines */}
                <div style={{ position: 'absolute', top: '25%', width: '100%', borderTop: '1px dashed #1c2630' }}></div>
                <div style={{ position: 'absolute', top: '50%', width: '100%', borderTop: '1px dashed #1c2630' }}></div>
                <div style={{ position: 'absolute', top: '75%', width: '100%', borderTop: '1px dashed #1c2630' }}></div>

                {/* SVG Curves (simulated) */}
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <path d="M0,10 Q50,20 100,20 T200,60 T300,70 T400,65" fill="none" stroke="#9f7aea" strokeWidth="2" />
                  <path d="M0,40 Q50,50 100,50 T200,100 T300,90 T400,95" fill="none" stroke="#6b46c1" strokeWidth="2" />
                </svg>

                {/* Vertical Marker */}
                <div style={{ position: 'absolute', left: '45%', top: '-10px', bottom: 0, borderLeft: '1px dashed #ff6652' }}>
                  <div style={{ position: 'absolute', top: '-12px', left: '-14px', backgroundColor: '#ff6652', color: '#000', fontSize: '9px', padding: '2px 4px', borderRadius: '2px', fontWeight: 700 }}>00:37</div>
                </div>
              </div>
              
              {/* X-Axis */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8d979f', marginTop: '8px' }}>
                <span>00:00</span>
                <span>00:20</span>
                <span>00:40</span>
                <span>01:00</span>
                <span>01:20</span>
                <span>01:40</span>
                <span>02:00</span>
                <span>02:18</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#8d979f', marginTop: '24px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(159, 122, 234, 0.2)', border: '1px dashed #9f7aea' }}></div>
                Shaded area represents 95% confidence interval
              </div>
            </div>

            {/* ENGAGEMENT LIFT DISTRIBUTION */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
                ENGAGEMENT LIFT DISTRIBUTION (ALL COHORTS) <Info size={12} color="#8d979f" />
              </div>
              
              <div style={{ position: 'relative', height: '140px', borderBottom: '1px solid #1c2630', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                 {/* SVG Histogram */}
                 <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                    {/* Normal Curve */}
                    <path d="M40,140 Q150,140 200,20 T360,140" fill="none" stroke="#b7e33d" strokeWidth="1" strokeDasharray="4 2" />
                 </svg>
                 
                 {/* Bars (Simplified visual) */}
                 <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100%', paddingBottom: '1px' }}>
                    <div style={{ width: '12px', height: '10%', backgroundColor: '#6b46c1' }}></div>
                    <div style={{ width: '12px', height: '20%', backgroundColor: '#6b46c1' }}></div>
                    <div style={{ width: '12px', height: '40%', backgroundColor: '#6b46c1' }}></div>
                    <div style={{ width: '12px', height: '60%', backgroundColor: '#6b46c1' }}></div>
                    <div style={{ width: '12px', height: '80%', backgroundColor: '#8b5cf6' }}></div>
                    <div style={{ width: '12px', height: '100%', backgroundColor: '#a78bfa' }}></div>
                    <div style={{ width: '12px', height: '90%', backgroundColor: '#8b5cf6' }}></div>
                    <div style={{ width: '12px', height: '50%', backgroundColor: '#6b46c1' }}></div>
                    <div style={{ width: '12px', height: '30%', backgroundColor: '#6b46c1' }}></div>
                    <div style={{ width: '12px', height: '15%', backgroundColor: '#6b46c1' }}></div>
                 </div>

                 {/* 0% Marker */}
                 <div style={{ position: 'absolute', left: '30%', top: 0, bottom: 0, borderLeft: '1px dashed #8d979f' }}></div>
                 {/* +18% Marker */}
                 <div style={{ position: 'absolute', left: '55%', top: 0, bottom: 0, borderLeft: '1px dashed #b7e33d' }}>
                    <div style={{ position: 'absolute', top: '-6px', left: '-14px', backgroundColor: '#b7e33d', color: '#000', fontSize: '9px', padding: '2px 4px', borderRadius: '2px', fontWeight: 700 }}>+18%</div>
                 </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8d979f', marginTop: '8px' }}>
                <span>-40%</span>
                <span>-20%</span>
                <span>0%</span>
                <span>+20%</span>
                <span>+40%</span>
                <span>+60%</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '9px', color: '#8d979f', marginTop: '4px' }}>Engagement Lift</div>

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
                KEY RESULTS <Info size={12} color="#8d979f" />
              </div>

              {/* PRIMARY */}
              <div style={{ marginBottom: '20px', borderBottom: '1px solid #1c2630', paddingBottom: '20px' }}>
                <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '8px' }}>PRIMARY (EFFICACY)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8d979f', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>Engagement Lift <Info size={10} /></div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#b7e33d' }} className="tabular-nums">+18%</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px' }}>95% CI</div>
                    <div style={{ fontSize: '12px', color: '#8d979f' }}>[+12%, +24%]</div>
                  </div>
                </div>
              </div>

              {/* SECONDARY */}
              <div style={{ marginBottom: '20px', borderBottom: '1px solid #1c2630', paddingBottom: '20px' }}>
                <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '8px' }}>SECONDARY (EFFICACY)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8d979f', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>Completion Lift <Info size={10} /></div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#b7e33d' }} className="tabular-nums">+9%</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px' }}>95% CI</div>
                    <div style={{ fontSize: '12px', color: '#8d979f' }}>[+4%, +14%]</div>
                  </div>
                </div>
              </div>

              {/* GUARDRAIL */}
              <div>
                <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '8px' }}>GUARDRAIL</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8d979f', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>Confused Change <Info size={10} /></div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#ff6652' }} className="tabular-nums">−4%</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: '#8d979f', marginBottom: '4px' }}>95% CI</div>
                    <div style={{ fontSize: '12px', color: '#8d979f' }}>[−8%, 0%]</div>
                  </div>
                </div>
              </div>

            </div>

            {/* EVIDENCE & QUERIES */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
                EVIDENCE & QUERIES <Info size={12} color="#8d979f" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8d979f' }}>Experiment ID</span>
                  <span style={{ color: '#ffffff' }}>EXP-23A</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8d979f' }}>Analysis ID</span>
                  <span style={{ color: '#ffffff' }}>ANL-23A-RESULTS-01</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8d979f' }}>Dataset Snapshot</span>
                  <span style={{ color: '#ffffff' }}>SNAP-2025-05-26T23:59:59Z</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8d979f' }}>Query Bundle ID</span>
                  <span style={{ color: '#ffffff', display: 'flex', gap: '4px', alignItems: 'center' }}>QRY-23A-001 <Download size={10} /></span>
                </div>
              </div>
            </div>

            {/* CLICKHOUSE MCP */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '6px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  CLICKHOUSE MCP <Info size={12} color="#8d979f" />
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
