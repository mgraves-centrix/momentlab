import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, ChevronDown, Bell, Settings, Check, X, Info } from 'lucide-react';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { useMobile } from '../hooks/useMobile';

interface AppShellProps {
  children: React.ReactNode;
  projectId?: string;
  experimentId?: string;
  mcpStatus?: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
}

const AVAILABLE_PROJECTS = [
  { id: 'proj_northlight_01', name: 'PROJECT NORTHLIGHT', expId: 'exp_23a', badge: 'ACTIVE' },
  { id: 'proj_echoes_02', name: 'PROJECT ECHOES', expId: 'exp_echoes_01', badge: 'ACTIVE' },
  { id: 'proj_below_03', name: 'PROJECT BELOW THE SURFACE', expId: 'exp_below_01', badge: 'DRAFT' }
];

export const AppShell: React.FC<AppShellProps> = ({
  children,
  projectId = 'proj_northlight_01',
  experimentId = 'exp_23a'
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const isScreening = location.pathname.startsWith('/screen');

  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const projectMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProjectMenuOpen(false);
        setIsNotifOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentProject = AVAILABLE_PROJECTS.find(p => p.id === projectId) || AVAILABLE_PROJECTS[0];

  const handleSelectProject = (proj: typeof AVAILABLE_PROJECTS[0]) => {
    setIsProjectMenuOpen(false);
    navigate(`/projects/${proj.id}/experiments/${proj.expId}/finding`);
  };

  const mainNavItems = [
    { label: 'PROJECTS', path: '/projects' },
    { label: 'EXPERIMENTS', path: `/projects/${projectId}/experiments/${experimentId}/finding` },
    { label: 'AUDIENCES', path: `/screen/demo_token_123` },
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
            <div ref={projectMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                aria-expanded={isProjectMenuOpen}
                aria-label="Select Project Menu"
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
                  letterSpacing: '0.05em',
                  cursor: 'pointer'
                }}
              >
                <span>{isMobile ? currentProject.name.replace('PROJECT ', '') : currentProject.name}</span>
                <ChevronDown size={14} color="#8d979f" style={{ transform: isProjectMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {/* Dropdown Menu */}
              {isProjectMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '260px',
                    backgroundColor: '#0f171e',
                    border: '1px solid #283540',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    padding: '8px 0',
                    zIndex: 200
                  }}
                >
                  <div style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 700, color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #1c262e' }}>
                    Switch Active Project
                  </div>
                  {AVAILABLE_PROJECTS.map(proj => {
                    const isSelected = proj.id === projectId;
                    return (
                      <div
                        key={proj.id}
                        onClick={() => handleSelectProject(proj)}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: isSelected ? '#1c2632' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? '#ffffff' : '#d0d7de' }}>
                            {proj.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '2px' }}>
                            ID: {proj.id}
                          </div>
                        </div>
                        {isSelected && <Check size={16} color="#8b5cf6" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                aria-label="View System Notifications"
                style={{ color: '#8d979f', display: 'flex', alignItems: 'center', padding: '6px', position: 'relative', cursor: 'pointer' }}
              >
                <Bell size={18} />
                <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', backgroundColor: '#58c94b', borderRadius: '50%', border: '1px solid #0c1115' }} />
              </button>

              {isNotifOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '300px',
                    backgroundColor: '#0f171e',
                    border: '1px solid #283540',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    padding: '12px',
                    zIndex: 200
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #1c262e' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>System Alerts & Activity</span>
                    <button onClick={() => setIsNotifOpen(false)} aria-label="Close notifications" style={{ color: '#8d979f', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ padding: '8px', backgroundColor: '#162029', borderRadius: '4px', fontSize: '11px', color: '#c4a7ff', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <Info size={14} color="#8b5cf6" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong>Cut B Anomaly Detected</strong>
                        <div style={{ color: '#8d979f', fontSize: '11px', marginTop: '2px' }}>Pacing cliff at 00:37 (-18.1% drop). Analysis ready.</div>
                      </div>
                    </div>

                    <div style={{ padding: '8px', backgroundColor: '#162029', borderRadius: '4px', fontSize: '11px', color: '#58c94b', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <Check size={14} color="#58c94b" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <strong>ClickHouse MV Sync Verified</strong>
                        <div style={{ color: '#8d979f', fontSize: '11px', marginTop: '2px' }}>35,240 respondents synced across 4 nodes.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isMobile && (
              <>
                <button
                  onClick={() => navigate('/admin/demo')}
                  aria-label="System Settings and Admin"
                  style={{ color: '#8d979f', display: 'flex', alignItems: 'center', padding: '6px', cursor: 'pointer' }}
                >
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
