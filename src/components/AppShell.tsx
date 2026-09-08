import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Film, ChevronDown, Bell, Settings, Check, X, Info } from 'lucide-react';
import { MobileBottomNavigation } from './MobileBottomNavigation';
import { useMobile } from '../hooks/useMobile';
import { fetchRecentQueries, fetchHealth, HealthStatus } from '../api/client';
import { QueryModal } from './QueryModal';

function formatRelativeTime(isoString: string): string {
  if (!isoString) return 'just now';
  const t = new Date(isoString).getTime();
  if (isNaN(t)) return 'just now';
  const diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 0 || diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function formatQueryPreview(query: string, maxLength: number = 52): string {
  if (!query) return '';
  const collapsed = query.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= maxLength) return collapsed;
  return collapsed.slice(0, maxLength) + '...';
}

interface AppShellProps {
  children: React.ReactNode;
  projectId?: string;
  experimentId?: string;
  mcpStatus?: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
}

const AVAILABLE_PROJECTS = [
  { id: 'proj_northlight_01', name: 'PROJECT NORTHLIGHT', expId: 'exp_23a', badge: 'ACTIVE' },
  { id: 'proj_echoes_02', name: 'PROJECT ECHOES', expId: 'exp_01b', badge: 'ACTIVE' },
  { id: 'proj_below_03', name: 'PROJECT BELOW THE SURFACE', expId: 'exp_01c', badge: 'DRAFT' }
];

export const AppShell: React.FC<AppShellProps> = ({
  children,
  projectId,
  experimentId = 'exp_23a'
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ projectId?: string; experimentId?: string }>();
  const isMobile = useMobile();
  const isScreening = location.pathname.startsWith('/screen');

  const activeProjectId = projectId || params.projectId || 'proj_northlight_01';
  const activeExperimentId = params.experimentId || experimentId;

  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAgentsOpen, setIsAgentsOpen] = useState(false);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [queries, setQueries] = useState<any[]>([]);
  const [isDegraded, setIsDegraded] = useState(false);

  const projectMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const agentsRef = useRef<HTMLDivElement>(null);

  const loadAgentData = async () => {
    try {
      const [healthRes, queriesRes] = await Promise.allSettled([
        fetchHealth(),
        fetchRecentQueries()
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value && healthRes.value.status === 'HEALTHY') {
        setHealth(healthRes.value);
        setIsDegraded(false);
      } else {
        setHealth(healthRes.status === 'fulfilled' ? healthRes.value : null);
        setIsDegraded(true);
      }

      if (queriesRes.status === 'fulfilled' && Array.isArray(queriesRes.value)) {
        setQueries(queriesRes.value);
      } else {
        setQueries([]);
      }
    } catch (_) {
      setIsDegraded(true);
      setQueries([]);
    }
  };

  useEffect(() => {
    loadAgentData();
    const interval = setInterval(() => {
      fetchRecentQueries()
        .then((res) => {
          if (Array.isArray(res)) {
            setQueries(res);
          }
        })
        .catch(() => {
          setIsDegraded(true);
        });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click or Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProjectMenuOpen(false);
        setIsNotifOpen(false);
        setIsAgentsOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (agentsRef.current && !agentsRef.current.contains(e.target as Node)) {
        setIsAgentsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleAgents = () => {
    const nextState = !isAgentsOpen;
    setIsAgentsOpen(nextState);
    if (nextState) {
      setIsNotifOpen(false);
      setIsProjectMenuOpen(false);
      loadAgentData();
    }
  };

  const handleToggleNotif = () => {
    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);
    if (nextState) {
      setIsAgentsOpen(false);
      setIsProjectMenuOpen(false);
    }
  };

  const handleToggleProjectMenu = () => {
    const nextState = !isProjectMenuOpen;
    setIsProjectMenuOpen(nextState);
    if (nextState) {
      setIsAgentsOpen(false);
      setIsNotifOpen(false);
    }
  };

  const currentProject = AVAILABLE_PROJECTS.find(p => p.id === activeProjectId) || AVAILABLE_PROJECTS[0];

  const handleSelectProject = (proj: typeof AVAILABLE_PROJECTS[0]) => {
    setIsProjectMenuOpen(false);
    navigate(`/projects/${proj.id}/experiments/${proj.expId}/finding`);
  };

  const mainNavItems = [
    { label: 'PROJECTS', path: '/projects' },
    { label: 'EXPERIMENTS', path: `/projects/${activeProjectId}/experiments/${activeExperimentId}/finding` },
    { label: 'AUDIENCES', path: `/screen/demo_token_123` },
    { label: 'ASSETS', path: `/admin/demo` }
  ];

  const FIFTEEN_MINS_MS = 15 * 60 * 1000;
  const now = Date.now();
  const recentRunCount = queries.filter((q) => {
    if (!q || !q.timestamp) return false;
    const t = new Date(q.timestamp).getTime();
    if (isNaN(t)) return false;
    const age = now - t;
    return age >= 0 && age <= FIFTEEN_MINS_MS;
  }).length;

  const isHealthy = !isDegraded && health?.status === 'HEALTHY';

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
                onClick={handleToggleProjectMenu}
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
                    const isSelected = proj.id === activeProjectId;
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
              <div ref={agentsRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={handleToggleAgents}
                  aria-haspopup="dialog"
                  aria-expanded={isAgentsOpen}
                  aria-label="View Agents Status and Recent Runs"
                  style={{
                    backgroundColor: isHealthy ? '#111b15' : '#1b1811',
                    border: `1px solid ${isHealthy ? '#1f3a28' : '#3a301f'}`,
                    borderRadius: '14px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isHealthy ? '#58c94b' : '#c9a24b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    letterSpacing: '0.04em',
                    cursor: 'pointer'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: isHealthy ? '#58c94b' : '#c9a24b',
                      boxShadow: `0 0 6px ${isHealthy ? '#58c94b' : '#c9a24b'}`
                    }}
                  />
                  <span>{isHealthy ? 'AGENTS ONLINE' : 'AGENT DEGRADED'}</span>
                  {recentRunCount > 0 ? (
                    <span
                      style={{
                        backgroundColor: isHealthy ? '#1d4825' : '#453518',
                        color: isHealthy ? '#58c94b' : '#c9a24b',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      {recentRunCount}
                    </span>
                  ) : (
                    <span
                      style={{
                        backgroundColor: isHealthy ? '#162219' : '#262016',
                        color: '#8d979f',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 500
                      }}
                    >
                      idle
                    </span>
                  )}
                </button>

                {isAgentsOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '360px',
                      backgroundColor: '#0f171e',
                      border: '1px solid #283540',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      padding: '14px',
                      zIndex: 200
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid #1c262e'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                          MomentLab Agent
                        </div>
                        <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '2px' }}>
                          Google ADK - Gemini 2.5 Pro - ClickHouse MCP
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: isHealthy ? '#58c94b' : '#c9a24b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: isHealthy ? '#58c94b' : '#c9a24b'
                            }}
                          />
                          {isHealthy ? 'Online' : 'Degraded'}
                        </span>
                        {health?.database_host && (
                          <div style={{ fontSize: '10px', color: '#627280', marginTop: '2px' }}>
                            {health.database_host}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#8d979f',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '8px'
                      }}
                    >
                      Recent runs - last 15 min: {recentRunCount}
                    </div>

                    {queries.length === 0 ? (
                      <div
                        style={{
                          padding: '12px 8px',
                          fontSize: '11px',
                          color: '#8d979f',
                          lineHeight: 1.4
                        }}
                      >
                        No agent activity yet. The agent runs on demand when you generate a hypothesis or analysis.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                        {queries.slice(0, 8).map((q: any, idx: number) => {
                          const timeStr = formatRelativeTime(q.timestamp);
                          const queryPreview = formatQueryPreview(q.query, 52);
                          return (
                            <button
                              key={q.query_id || idx}
                              onClick={() => {
                                setSelectedQueryId(q.query_id);
                                setIsAgentsOpen(false);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                backgroundColor: '#162029',
                                border: '1px solid #1c262e',
                                borderRadius: '6px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s, border-color 0.15s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1e2c38';
                                e.currentTarget.style.borderColor = '#283540';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#162029';
                                e.currentTarget.style.borderColor = '#1c262e';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: '#8d979f' }}>
                                <span style={{ color: '#c4a7ff', fontWeight: 600 }}>{timeStr}</span>
                                <span>
                                  {q.rows !== undefined ? `${q.rows} rows` : ''}
                                  {q.rows !== undefined && q.duration_ms !== undefined ? ' - ' : ''}
                                  {q.duration_ms !== undefined ? `${q.duration_ms}ms` : ''}
                                </span>
                              </div>
                              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#d0d7de', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {queryPreview}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: '10px',
                        color: '#627280',
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid #1c262e',
                        textAlign: 'center'
                      }}
                    >
                      Every agent query is traced in ClickHouse.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={handleToggleNotif}
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
              { label: 'Finding', path: `/projects/${activeProjectId}/experiments/${activeExperimentId}/finding` },
              { label: 'Evidence', path: `/projects/${activeProjectId}/experiments/${activeExperimentId}/evidence` },
              { label: 'Hypothesis', path: `/projects/${activeProjectId}/experiments/${activeExperimentId}/hypothesis` },
              { label: 'A/B Test', path: `/projects/${activeProjectId}/experiments/${activeExperimentId}/test` },
              { label: 'Results', path: `/projects/${activeProjectId}/experiments/${activeExperimentId}/results` }
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
          <MobileBottomNavigation projectId={activeProjectId} experimentId={activeExperimentId} />
        </div>
      )}

      {/* ClickHouse Query Provenance Modal */}
      <QueryModal queryId={selectedQueryId} onClose={() => setSelectedQueryId(null)} />
    </div>
  );
};
