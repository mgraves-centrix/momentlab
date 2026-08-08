import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Star, ChevronRight, ChevronDown, LayoutGrid, List, ArrowRight, FlaskConical, MoreHorizontal, Loader2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { NewProjectModal } from '../components/NewProjectModal';
import { fetchProjects, Project } from '../api/client';

export const ProjectsDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects().then(data => {
      setProjects(data);
      setIsLoading(false);
    });
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '28px 32px' }}>
        
        {/* Page Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              PROJECTS
            </h1>
            <p style={{ fontSize: '13px', color: '#8d979f' }}>
              Manage your film projects, experiments, and audience insights.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              backgroundColor: '#b7e33d',
              color: '#080b0e',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              letterSpacing: '0.04em'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>NEW PROJECT</span>
          </button>
        </div>

        {/* Sub-bar Filter & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px', color: '#8d979f' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 600, color: '#f1f3f2' }}>{projects.length} PROJECTS</span>
            <span style={{ color: '#283540' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <span>Sort: <strong>Recently Updated</strong></span>
              <ChevronDown size={14} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>View:</span>
            <div style={{ display: 'flex', backgroundColor: '#11171c', border: '1px solid #202a31', borderRadius: '4px', padding: '2px' }}>
              <button style={{ padding: '4px 6px', borderRadius: '4px', backgroundColor: '#1f2a33', color: '#fff', border: 'none' }}>
                <LayoutGrid size={14} />
              </button>
              <button style={{ padding: '4px 6px', borderRadius: '4px', backgroundColor: 'transparent', color: '#8d979f', border: 'none' }}>
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Grid (~68% / ~32%) */}
        <div style={{ display: 'grid', gridTemplateColumns: '67% 31%', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Project Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 className="spin" color="#8d979f" size={24} />
              </div>
            ) : projects.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#8d979f', backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px' }}>
                <p>No projects found. Create one to get started.</p>
              </div>
            ) : (
              projects.map(project => (
                <div key={project.project_id} style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', height: '124px', backgroundColor: '#162029' }}>
                      <img
                        src={project.thumbnail_url || "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80"}
                        alt="Thumbnail"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{ position: 'absolute', bottom: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.04em' }}>
                        PROJECT MEDIA
                      </span>
                    </div>

                    {/* Details & Metrics */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                              {project.title}
                            </h2>
                            <Star size={14} color="#8d979f" style={{ cursor: 'pointer' }} />
                          </div>
                          <span style={{ backgroundColor: 'rgba(88, 201, 75, 0.15)', color: '#58c94b', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '3px', border: '1px solid rgba(88, 201, 75, 0.3)' }}>
                            {project.status || 'ACTIVE'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '2px' }}>
                          {project.description || 'Feature Film Project'}
                        </div>
                      </div>

                      {/* 3 Metric Columns */}
                      <div style={{ display: 'grid', gridTemplateColumns: '70px 110px 1fr', gap: '16px', backgroundColor: '#131b22', padding: '10px 14px', borderRadius: '6px', border: '1px solid #1c2630', marginTop: '12px' }}>
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }} className="tabular-nums">{project.sceneCount || 0}</div>
                          <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cuts</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }} className="tabular-nums">{project.totalRespondents || 0}</div>
                          <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Respondents</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latest Finding</div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#8d979f', marginTop: '2px' }}>
                            No findings yet
                          </div>
                        </div>
                      </div>

                      {/* Status Banner & Action Button */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#c4a7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FlaskConical size={14} />
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#c4a7ff', letterSpacing: '0.04em' }}>ANALYSIS PENDING</div>
                            <div style={{ fontSize: '10px', color: '#8d979f' }}>Waiting for completion</div>
                          </div>
                        </div>

                        <Link
                          to={`/projects/${project.project_id}/experiments/exp_23a/finding`}
                          style={{
                            backgroundColor: '#b7e33d',
                            color: '#080b0e',
                            textDecoration: 'none',
                            padding: '8px 14px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>OPEN EXPERIMENT</span>
                          <ChevronRight size={14} strokeWidth={2.5} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Row */}
                  <div style={{ borderTop: '1px solid #1a232b', padding: '10px 20px', backgroundColor: '#090e12', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#8d979f' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#202b35', color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AD</div>
                        <span>{project.owner_id || 'Admin'} <span style={{ color: '#5b6670' }}>Owner</span></span>
                      </div>
                      <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span>SCREENING PROGRESS</span>
                      <div style={{ width: '120px', height: '6px', backgroundColor: '#172027', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '0%', height: '100%', backgroundColor: '#8b5cf6' }} />
                      </div>
                      <span style={{ color: '#fff', fontWeight: 600 }}>0%</span>
                      <MoreHorizontal size={14} color="#8d979f" style={{ marginLeft: '8px', cursor: 'pointer' }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT COLUMN: Widgets matching Reference 01 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Widget 1: ACTIVE EXPERIMENTS */}
            <div style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                    ACTIVE EXPERIMENTS
                  </h3>
                  <span style={{ backgroundColor: '#1b2630', color: '#8d979f', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>1</span>
                </div>
                <ArrowRight size={14} color="#8d979f" style={{ cursor: 'pointer' }} />
              </div>

              {/* Experiment Card */}
              <div style={{ backgroundColor: '#121a21', border: '1px solid #202b35', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <img src="/northlight_thumb.png" alt="Experiment thumbnail" style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>NORTHLIGHT A/B TEST</span>
                      <span style={{ backgroundColor: 'rgba(88, 201, 75, 0.15)', color: '#58c94b', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>ACTIVE</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#c4a7ff', marginTop: '2px' }}>Move reveal 6s earlier</div>
                    <div style={{ fontSize: '10px', color: '#8d979f', marginTop: '2px' }}>Started May 19, 2025 · 2 Variants · 4,732 Respondents</div>
                  </div>
                </div>

                {/* 3 Metric Boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#090e12', padding: '8px', borderRadius: '4px', border: '1px solid #1c2630' }}>
                    <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase' }}>ENGAGEMENT LIFT</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#58c94b', marginTop: '2px' }} className="tabular-nums">+18%</div>
                  </div>

                  <div style={{ backgroundColor: '#090e12', padding: '8px', borderRadius: '4px', border: '1px solid #1c2630' }}>
                    <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase' }}>COMPLETION LIFT</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#58c94b', marginTop: '2px' }} className="tabular-nums">+9%</div>
                  </div>

                  <div style={{ backgroundColor: '#090e12', padding: '8px', borderRadius: '4px', border: '1px solid #1c2630' }}>
                    <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase' }}>CONFIDENCE</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#58c94b', marginTop: '2px' }} className="tabular-nums">91%</div>
                  </div>
                </div>

                {/* Mini Retention Curves Graph */}
                <div style={{ height: '70px', position: 'relative', width: '100%' }}>
                  <svg width="100%" height="100%" viewBox="0 0 300 70" preserveAspectRatio="none">
                    {/* Variant A Control (dashed purple) */}
                    <path d="M 0 25 Q 75 20, 100 45 T 200 50 T 300 55" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3 3" />
                    {/* Variant B Move earlier (solid violet) */}
                    <path d="M 0 25 Q 75 18, 100 22 T 200 20 T 300 22" fill="none" stroke="#c4a7ff" strokeWidth="2" />
                    {/* All Respondents (gray dashed) */}
                    <path d="M 0 30 Q 75 25, 100 40 T 200 42 T 300 45" fill="none" stroke="#5b6670" strokeWidth="1" strokeDasharray="2 2" />
                    {/* Red Marker Line at 00:37 */}
                    <line x1="100" y1="0" x2="100" y2="70" stroke="#ff6652" strokeWidth="1.5" strokeDasharray="2 2" />
                  </svg>
                  <span style={{ position: 'absolute', top: '2px', left: '104px', backgroundColor: '#ff6652', color: '#fff', fontSize: '8px', fontWeight: 700, padding: '1px 3px', borderRadius: '2px' }}>
                    00:37
                  </span>
                </div>

                {/* Graph Legend */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8d979f', marginTop: '8px' }}>
                  <span style={{ color: '#8b5cf6' }}>-- Variant A (Control)</span>
                  <span style={{ color: '#c4a7ff' }}>— Variant B (Move earlier)</span>
                  <span style={{ color: '#5b6670' }}>--- All Respondents</span>
                </div>
              </div>
            </div>

            {/* Widget 2: RECENT AGENT RUNS */}
            <div style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                  RECENT AGENT RUNS
                </h3>
                <span style={{ fontSize: '11px', color: '#8d979f', cursor: 'pointer' }}>View all</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
                {[
                  { time: '10:42:11', query: 'SELECT engagement_over_time ...', duration: '4.2s' },
                  { time: '10:42:08', query: 'SELECT cohort_breakdown ...', duration: '3.1s' },
                  { time: '10:42:03', query: 'SELECT scene_metrics ...', duration: '2.7s' },
                  { time: '10:41:58', query: 'SELECT experiment_history ...', duration: '1.9s' },
                  { time: '10:41:32', query: 'SELECT audience_segments ...', duration: '2.3s' }
                ].map((run, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace', color: '#8d979f' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#58c94b' }} />
                      <span style={{ color: '#5b6670' }}>{run.time}</span>
                      <span style={{ color: '#c4a7ff' }}>{run.query}</span>
                    </div>
                    <span>{run.duration}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3: CLICKHOUSE MCP */}
            <div style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                  CLICKHOUSE MCP
                </h3>
                <span style={{ backgroundColor: 'rgba(88, 201, 75, 0.15)', color: '#58c94b', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', border: '1px solid rgba(88, 201, 75, 0.3)' }}>
                  CONNECTED
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#8d979f', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>DATA SOURCE</span>
                  <strong style={{ color: '#ffffff' }}>ClickHouse Cloud</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>REGION</span>
                  <strong style={{ color: '#ffffff' }}>us-east-1</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>LAST SYNC</span>
                  <strong style={{ color: '#ffffff' }}>May 19, 2025, 10:41 AM</strong>
                </div>
              </div>

              <button
                style={{
                  width: '100%',
                  backgroundColor: '#121a21',
                  color: '#ffffff',
                  border: '1px solid #202b35',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.04em'
                }}
              >
                VIEW ALL QUERIES
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={(proj) => {
          setProjects([proj, ...projects]);
        }}
      />
    </AppShell>
  );
};
