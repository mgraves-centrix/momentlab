import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, ChevronDown, Bell, Settings } from 'lucide-react';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { useMobile } from '../hooks/useMobile';

interface AppShellProps {
  children: React.ReactNode;
  projectId?: string;
  experimentId?: string;
  mcpStatus?: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  projectId = 'proj_northlight_01',
  experimentId = 'exp_23a'
}) => {
  const location = useLocation();
  const isMobile = useMobile();
  const isScreening = location.pathname.startsWith('/screen');

  const mainNavItems = [
    { label: 'PROJECTS', path: '/projects' },
    { label: 'IDEA LAB', path: '#' },
    { label: 'EXPERIMENTS', path: `/projects/${projectId}/experiments/${experimentId}/finding` },
    { label: 'AUDIENCES', path: `/screen/demo_token_123` },
    { label: 'INSIGHTS', path: `#` },
    { label: 'ASSETS', path: `/admin/demo` }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--canvas)', color: 'var(--text)' }}>
      {/* Global Desktop Header matching Reference 01 */}
      {!isScreening && (
        <header
          style={{
            height: '64px',
            backgroundColor: '#0c1115',
            borderBottom: '1px solid #1c262e',
            padding: isMobile ? '0 16px' : '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}
        >
          {/* Left: Brand & Project Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
            <Link to="/projects" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#fff' }}>
              {!isMobile && (
                <div style={{ width: '30px', height: '30px', borderRadius: '4px', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Film size={18} />
                </div>
              )}
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: isMobile ? '16px' : '18px', letterSpacing: '0.04em' }}>
                MOMENT<span style={{ color: '#8b5cf6' }}>LAB</span>
              </span>
            </Link>

            {/* Project Dropdown Selector Pill */}
            <button
              style={{
                backgroundColor: '#161e25',
                border: '1px solid #283540',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#c4a7ff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                letterSpacing: '0.05em'
              }}
            >
              <span>{isMobile ? 'NORTHLIGHT' : 'PROJECT NORTHLIGHT'}</span>
              <ChevronDown size={14} color="#8d979f" />
            </button>
          </div>

          {/* Center: Main Navigation Tabs */}
          {!isMobile && (
            <nav style={{ display: 'flex', gap: '24px' }} aria-label="Global header navigation">
              {mainNavItems.map((item) => {
                const isActive = item.label === 'EXPERIMENTS' 
                  ? location.pathname.includes('/experiments/')
                  : item.label === 'PROJECTS' 
                    ? location.pathname === '/projects' 
                    : location.pathname === item.path && item.path !== '#';
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    style={{
                      position: 'relative',
                      padding: '20px 0',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textDecoration: 'none',
                      color: isActive ? '#ffffff' : '#8d979f',
                      transition: 'color 0.15s ease'
                    }}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          backgroundColor: '#8b5cf6',
                          borderRadius: '2px 2px 0 0'
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right: Agents Pill, Notifications & User Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
            {!isMobile && (
              <div
                style={{
                  backgroundColor: '#111b15',
                  border: '1px solid #1f3a28',
                  borderRadius: '14px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#58c94b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  letterSpacing: '0.04em'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#58c94b', boxShadow: '0 0 6px #58c94b' }} />
                <span>AGENTS ONLINE</span>
                <span style={{ backgroundColor: '#1d4825', color: '#58c94b', padding: '1px 5px', borderRadius: '10px', fontSize: '10px' }}>4</span>
              </div>
            )}

            {/* Notification Bell */}
            <button style={{ color: '#8d979f', display: 'flex', alignItems: 'center', padding: '4px', position: 'relative' }}>
              <Bell size={18} />
              {isMobile && (
                <span style={{ position: 'absolute', top: '2px', right: '4px', width: '6px', height: '6px', backgroundColor: '#58c94b', borderRadius: '50%', border: '1px solid #0c1115' }} />
              )}
            </button>

            {!isMobile && (
              <>
                <button style={{ color: '#8d979f', display: 'flex', alignItems: 'center', padding: '4px' }}>
                  <Settings size={18} />
                </button>

                {/* User Avatar NS */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#202b35',
                    border: '1px solid #334352',
                    color: '#f1f3f2',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  NS
                </div>
              </>
            )}
          </div>
        </header>
      )}

      {/* Secondary Navigation for Experiments */}
      {!isMobile && !isScreening && location.pathname.includes('/experiments/') && (
        <div style={{ backgroundColor: '#090a0c', borderBottom: '1px solid #1c262e', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
          <nav style={{ display: 'flex', gap: '32px' }}>
            {[
              { label: 'Finding', path: `/projects/${projectId}/experiments/${experimentId}/finding` },
              { label: 'Evidence', path: `/projects/${projectId}/experiments/${experimentId}/evidence` },
              { label: 'Hypothesis', path: `/projects/${projectId}/experiments/${experimentId}/hypothesis` },
              { label: 'A/B Test', path: `/projects/${projectId}/experiments/${experimentId}/test` },
              { label: 'Results', path: `/projects/${projectId}/experiments/${experimentId}/results` }
            ].map(tab => {
              const isTabActive = location.pathname.includes(tab.path);
              return (
                <Link
                  key={tab.label}
                  to={tab.path}
                  style={{
                    padding: '16px 0',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isTabActive ? '#8b5cf6' : '#8d979f',
                    textDecoration: 'none',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {tab.label}
                  {isTabActive && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: '#8b5cf6', borderRadius: '2px 2px 0 0' }} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: isMobile && !isScreening ? 'var(--nav-mobile-height)' : 0 }}>
        {children}
      </main>

      {/* Mobile Navigation */}
      {!isScreening && (
        <div style={{ display: isMobile ? 'block' : 'none' }}>
          <MobileBottomNavigation projectId={projectId} experimentId={experimentId} />
        </div>
      )}
    </div>
  );
};
