import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, Film, Sliders } from 'lucide-react';
import { AppShell } from '../components/AppShell';

export const MobileMorePage: React.FC = () => {
  return (
    <AppShell>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '20px' }}>
          More Navigation & Demo Controls
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            to="/projects/proj_northlight_01/experiments/exp_23a/results"
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              color: 'var(--text)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <BarChart2 size={20} color="var(--violet)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Experiment Outcome & Results</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>View statistical lift and completion evidence</div>
            </div>
          </Link>

          <Link
            to="/projects"
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              color: 'var(--text)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Film size={20} color="var(--lime)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Project Dashboard</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Overview of all active film projects</div>
            </div>
          </Link>

          <Link
            to="/admin/demo"
            style={{
              backgroundColor: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              color: 'var(--text)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Sliders size={20} color="var(--warning)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Demo Controls & Health Board</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Deterministic state fixtures and system status</div>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
};
