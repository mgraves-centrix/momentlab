import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, User, ShieldCheck, Activity } from 'lucide-react';
import { MobileBottomNavigation } from './MobileBottomNavigation';

interface AppShellProps {
  children: React.ReactNode;
  projectId?: string;
  experimentId?: string;
  mcpStatus?: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  projectId = 'proj_northlight_01',
  experimentId = 'exp_23a',
  mcpStatus = 'CONNECTED'
}) => {
  const location = useLocation();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;
  const isScreening = location.pathname.startsWith('/screen');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Global Header */}
      {!isScreening && (
        <header
          style={{
            height: 'var(--header-desktop-height)',
            backgroundColor: 'var(--surface-1)',
            borderBottom: '1px solid var(--border)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'var(--text)' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Film size={20} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>
                MOMENT<span style={{ color: 'var(--violet)' }}>LAB</span>
              </span>
            </Link>
            <span style={{ color: 'var(--border)', fontSize: '18px' }}>|</span>
            <span style={{ color: 'var(--muted)', fontSize: '13px', fontWeight: 500 }}>
              Northlight · Scene 12
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* MCP Status Indicator */}
            <div
              className={`badge ${
                mcpStatus === 'CONNECTED'
                  ? 'badge-connected'
                  : mcpStatus === 'CONNECTING'
                  ? 'badge-simulated'
                  : 'badge-disconnected'
              }`}
              title="ClickHouse MCP Transport Status"
            >
              <Activity size={12} />
              <span>MCP {mcpStatus}</span>
            </div>

            {/* Privacy Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '12px' }}>
              <ShieldCheck size={14} color="var(--success)" />
              <span>Aggregated Consent Only</span>
            </div>

            {/* User Profile */}
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
              <User size={16} />
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: isMobile && !isScreening ? 'var(--nav-mobile-height)' : 0 }}>
        {children}
      </main>

      {/* Sticky Four-Item Mobile Navigation */}
      {!isScreening && (
        <div style={{ display: isMobile ? 'block' : 'none' }}>
          <MobileBottomNavigation projectId={projectId} experimentId={experimentId} />
        </div>
      )}
    </div>
  );
};
