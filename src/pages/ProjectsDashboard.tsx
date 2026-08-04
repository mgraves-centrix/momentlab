import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Users, Play, Plus, ChevronRight } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { NewProjectModal } from '../components/NewProjectModal';
import { fetchProjects, Project } from '../api/client';

export const ProjectsDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects().then((data) => {
      setProjects(data);
    });
  }, []);

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '4px' }}>
              Project Dashboard
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Active film projects and audience screening experiments
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              backgroundColor: 'var(--violet)',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            <span>NEW PROJECT</span>
          </button>
        </div>

        {/* Projects List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                backgroundColor: 'var(--surface-1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Film size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                      {project.name}
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {project.description}
                    </p>
                  </div>
                </div>

                <span className="badge badge-connected">
                  {project.status}
                </span>
              </div>

              {/* Metrics Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', backgroundColor: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Consented Respondents</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }} className="tabular-nums">
                    <Users size={18} color="var(--violet)" />
                    <span>{project.totalRespondents?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Active Scenes</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }} className="tabular-nums">
                    {project.sceneCount || 1} Scenes
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Active Experiment</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--coral)' }}>
                    Experiment 23A
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link
                  to={`/projects/${project.id}/experiments/exp_23a/finding`}
                  style={{
                    backgroundColor: 'var(--violet)',
                    color: '#fff',
                    textDecoration: 'none',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>OPEN EXPERIMENT WORKSPACE</span>
                  <ChevronRight size={16} />
                </Link>

                <Link
                  to="/screen/demo_token_123"
                  style={{
                    backgroundColor: 'var(--surface-3)',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <Play size={16} color="var(--lime)" />
                  <span>TEST AUDIENCE SCREENING PLAYER</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </AppShell>
  );
};
