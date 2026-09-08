import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, Film, HelpCircle, ChevronRight, X } from 'lucide-react';
import { AppShell } from '../components/AppShell';

export const MobileMorePage: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <AppShell>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px 80px 16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#ffffff', marginBottom: '20px', letterSpacing: '-0.02em' }}>
          MORE NAVIGATION & CONTROLS
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <Link
            to="/projects/proj_northlight_01/experiments/exp_23a/results"
            style={{
              backgroundColor: '#0c1115',
              border: '1px solid #1c2630',
              borderRadius: '8px',
              padding: '16px',
              color: '#f1f3f2',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={20} color="#8b5cf6" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>Experiment Outcome & Results</div>
                <div style={{ fontSize: '11px', color: '#8d979f' }}>View statistical lift and completion evidence</div>
              </div>
            </div>
            <ChevronRight size={16} color="#8d979f" />
          </Link>

          <Link
            to="/projects"
            style={{
              backgroundColor: '#0c1115',
              border: '1px solid #1c2630',
              borderRadius: '8px',
              padding: '16px',
              color: '#f1f3f2',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'rgba(183, 227, 61, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Film size={20} color="var(--lime)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>Project Dashboard</div>
                <div style={{ fontSize: '11px', color: '#8d979f' }}>Overview of all active film projects</div>
              </div>
            </div>
            <ChevronRight size={16} color="#8d979f" />
          </Link>

          {/* Help & Workflow Guide */}
          <div
            onClick={() => setShowHelp(true)}
            style={{
              backgroundColor: '#0c1115',
              border: '1px solid #1c2630',
              borderRadius: '8px',
              padding: '16px',
              color: '#f1f3f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'rgba(88, 201, 75, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={20} color="#58c94b" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px' }}>Help & Workflow Guide</div>
                <div style={{ fontSize: '11px', color: '#8d979f' }}>How MomentLab turns audience data into edit decisions</div>
              </div>
            </div>
            <ChevronRight size={16} color="#8d979f" />
          </div>

        </div>

        {/* Help Modal */}
        {showHelp && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 2000 }}>
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #283540', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>MomentLab Workflow Help</h3>
                <button onClick={() => setShowHelp(false)} style={{ background: 'none', border: 'none', color: '#8d979f', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ fontSize: '13px', color: '#8d979f', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: '#fff' }}>1. Finding:</strong> Inspect real second-by-second audience retention and identify response cliffs.
                </p>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: '#fff' }}>2. Evidence:</strong> Examine query-level ClickHouse MCP logs and provenance traces.
                </p>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: '#fff' }}>3. Hypothesis:</strong> Review Gemini ADK falsifiable cut hypotheses.
                </p>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: '#fff' }}>4. Test & Results:</strong> Authorize A/B deployment and evaluate statistically validated lift.
                </p>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                style={{ marginTop: '20px', width: '100%', backgroundColor: 'var(--lime)', color: '#000', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer' }}
              >
                GOT IT
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
};
