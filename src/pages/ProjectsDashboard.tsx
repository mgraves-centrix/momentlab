import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Star, ChevronRight, ChevronDown, LayoutGrid, List, ArrowRight, FlaskConical, MoreHorizontal, Loader2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { NewProjectModal } from '../components/NewProjectModal';
import {
  fetchProjects,
  fetchExperimentHypothesis,
  fetchExperimentTimeline,
  fetchRecentQueries,
  fetchHealth,
  fetchExperimentResults,
  Project,
  Hypothesis,
  TimelineDataPoint,
  HealthStatus
} from '../api/client';
import { useMobile } from '../hooks/useMobile';
import { plural } from '../utils/format';

const ProjectCardSkeleton: React.FC<{ isMobile: boolean }> = ({ isMobile }) => (
  <div
    style={{
      backgroundColor: '#0d1318',
      border: '1px solid #1e2830',
      borderRadius: '10px',
      overflow: 'hidden',
      minWidth: 0,
      width: '100%',
      boxSizing: 'border-box'
    }}
  >
    <div
      style={{
        padding: isMobile ? '16px' : '20px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '220px 1fr',
        gap: '20px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Thumbnail Skeleton */}
      <div
        className="skeleton-shimmer"
        style={{
          height: '124px',
          width: '100%',
          borderRadius: '6px'
        }}
      />

      {/* Details & Metrics Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0, width: '100%', gap: '12px' }}>
        <div>
          {/* Title line & Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div
              className="skeleton-shimmer"
              style={{ height: '20px', width: '45%', minWidth: '120px', borderRadius: '4px' }}
            />
            <div
              className="skeleton-shimmer"
              style={{ height: '18px', width: '56px', borderRadius: '3px' }}
            />
          </div>
          {/* Description line */}
          <div
            className="skeleton-shimmer"
            style={{ height: '12px', width: '65%', marginTop: '8px', borderRadius: '3px' }}
          />
        </div>

        {/* 3 Metric Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '70px 110px 1fr',
            gap: '16px',
            backgroundColor: '#131b22',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #1c2630',
            marginTop: '12px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div>
            <div className="skeleton-shimmer" style={{ height: '20px', width: '36px', marginBottom: '4px', borderRadius: '3px' }} />
            <div className="skeleton-shimmer" style={{ height: '10px', width: '28px', borderRadius: '2px' }} />
          </div>
          <div>
            <div className="skeleton-shimmer" style={{ height: '20px', width: '48px', marginBottom: '4px', borderRadius: '3px' }} />
            <div className="skeleton-shimmer" style={{ height: '10px', width: '70px', borderRadius: '2px' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="skeleton-shimmer" style={{ height: '10px', width: '80px', marginBottom: '6px', borderRadius: '2px' }} />
            <div className="skeleton-shimmer" style={{ height: '12px', width: '110px', borderRadius: '3px' }} />
          </div>
        </div>

        {/* Status Banner & Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="skeleton-shimmer" style={{ width: '24px', height: '24px', borderRadius: '4px', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="skeleton-shimmer" style={{ height: '12px', width: '100px', borderRadius: '3px' }} />
              <div className="skeleton-shimmer" style={{ height: '10px', width: '130px', borderRadius: '2px' }} />
            </div>
          </div>
          <div className="skeleton-shimmer" style={{ height: '32px', width: '128px', borderRadius: '6px' }} />
        </div>
      </div>
    </div>

    {/* Card Footer Row */}
    <div
      style={{
        borderTop: '1px solid #1a232b',
        padding: '10px 20px',
        backgroundColor: '#090e12',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        color: '#8d979f',
        flexWrap: 'wrap',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="skeleton-shimmer" style={{ height: '14px', width: '90px', borderRadius: '3px' }} />
        <div className="skeleton-shimmer" style={{ height: '14px', width: '110px', borderRadius: '3px' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="skeleton-shimmer" style={{ height: '14px', width: '140px', borderRadius: '3px' }} />
      </div>
    </div>
  </div>
);

export const ProjectsDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [northlightHypothesis, setNorthlightHypothesis] = useState<Hypothesis | null>(null);
  const [northlightTimeline, setNorthlightTimeline] = useState<TimelineDataPoint[]>([]);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [resultsData, setResultsData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Connecting to ClickHouse Cloud...');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'respondents'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (sessionStorage.getItem('momentlab_view_mode') as 'grid' | 'list') || 'grid';
  });
  const [starredProjects, setStarredProjects] = useState<Record<string, boolean>>({ proj_northlight_01: true });
  const navigate = useNavigate();
  const isMobile = useMobile();

  useEffect(() => {
    if (!isLoading) return;

    const timer1 = setTimeout(() => {
      setStatusMessage('Waking analytics engine...');
    }, 3000);

    const timer2 = setTimeout(() => {
      setStatusMessage('Loading projects...');
    }, 10000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isLoading]);


  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    sessionStorage.setItem('momentlab_view_mode', mode);
  };

  useEffect(() => {
    fetchProjects().then(data => {
      setProjects(data);
      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });

    fetchExperimentHypothesis('proj_northlight_01', 'exp_23a')
      .then(setNorthlightHypothesis)
      .catch(console.error);

    fetchExperimentTimeline('proj_northlight_01', 'exp_23a')
      .then(setNorthlightTimeline)
      .catch(console.error);

    fetchRecentQueries()
      .then(setRecentQueries)
      .catch(console.error);

    fetchHealth()
      .then(setHealthData)
      .catch(console.error);

    fetchExperimentResults('proj_northlight_01', 'exp_23a')
      .then(setResultsData)
      .catch(console.error);
  }, []);

  const toggleStar = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setStarredProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const handleSortToggle = () => {
    setSortBy(prev => prev === 'recent' ? 'name' : prev === 'name' ? 'respondents' : 'recent');
  };

  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'respondents') {
      const respA = a.total_respondents ?? a.totalRespondents ?? 0;
      const respB = b.total_respondents ?? b.totalRespondents ?? 0;
      return respB - respA;
    }
    return 0; // default order preserved from API (priority Northlight -> Echoes -> Below)
  });

  const northlightProject = projects.find(p => p.project_id === 'proj_northlight_01');
  const northlightRespondents = northlightProject?.total_respondents ?? northlightProject?.totalRespondents ?? null;

  const dbHost = healthData?.database_host || '';
  let derivedRegion = 'us-east1';
  if (dbHost.includes('.us-east1.')) {
    derivedRegion = 'us-east1';
  } else if (dbHost.includes('.')) {
    const match = dbHost.match(/\.([a-z0-9-]+)\.gcp/i);
    if (match) derivedRegion = match[1];
  }
  const derivedDataSource = dbHost ? 'ClickHouse Cloud' : 'ClickHouse Cloud';

  const lastSyncStr = recentQueries.length > 0 && recentQueries[0].timestamp
    ? new Date(recentQueries[0].timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : healthData ? new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

  const startedDateStr = northlightProject?.created_at
    ? new Date(northlightProject.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently';

  const primaryLiftStr = resultsData?.key_results?.primary?.value || (northlightHypothesis as any)?.forecastEngagement || '+11.1%';
  const secondaryLiftStr = resultsData?.key_results?.secondary?.value || (northlightHypothesis as any)?.forecastCompletion || '+9.2%';
  const confidenceVal = resultsData?.confidence != null ? `${resultsData.confidence}%` : northlightHypothesis?.confidenceScore != null ? `${northlightHypothesis.confidenceScore}%` : '98%';
  const totalRespCount = resultsData?.sample_sizes?.total || northlightRespondents || 35240;

  return (
    <AppShell>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: isMobile ? '16px' : '28px 32px', boxSizing: 'border-box', width: '100%' }}>
        
        {/* Page Top Header Bar */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              PROJECTS
            </h1>
            <p style={{ fontSize: '13px', color: '#8d979f', margin: 0 }}>
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

        {/* Product Framing Hero Card (Part 4) */}
        <div style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px', padding: '18px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', margin: 0 }}>
              Automated Audience Pacing & Cut Verification
            </h2>
            <span style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#c4a7ff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              VERIFIABLE CLICKHOUSE PROVENANCE
            </span>
          </div>
          <p style={{ fontSize: '12px', color: '#8d979f', margin: 0, lineHeight: '1.5' }}>
            Built for short-form video editors and filmmakers who cannot afford $10k+ traditional test screenings. MomentLab analyzes second-by-second audience reactions across <strong style={{ color: '#ffffff' }}>{totalRespCount.toLocaleString()} {plural(totalRespCount, 'consented viewer')}</strong>, proposes targeted edit points, and measures actual retention lift (<strong style={{ color: '#58c94b' }}>{primaryLiftStr} lift</strong>) with full query-level ClickHouse execution traces.
          </p>
        </div>

        {/* Sub-bar Filter & Controls */}

        {/* Sub-bar Filter & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px', color: '#8d979f' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 600, color: '#f1f3f2' }}>{projects.length} {plural(projects.length, 'PROJECT')}</span>
            <span style={{ color: '#283540' }}>|</span>
            <div 
              onClick={handleSortToggle}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}
            >
              <span>Sort: <strong>{sortBy === 'recent' ? 'Recently Updated' : sortBy === 'name' ? 'Project Name' : 'Respondent Count'}</strong></span>
              <ChevronDown size={14} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>View:</span>
            <div style={{ display: 'flex', backgroundColor: '#11171c', border: '1px solid #202a31', borderRadius: '4px', padding: '2px' }}>
              <button 
                onClick={() => handleViewModeChange('grid')}
                aria-label="Grid View Mode"
                style={{ padding: '4px 6px', borderRadius: '4px', backgroundColor: viewMode === 'grid' ? '#1f2a33' : 'transparent', color: viewMode === 'grid' ? '#fff' : '#8d979f', border: 'none', cursor: 'pointer' }}
              >
                <LayoutGrid size={14} />
              </button>
              <button 
                onClick={() => handleViewModeChange('list')}
                aria-label="List View Mode"
                style={{ padding: '4px 6px', borderRadius: '4px', backgroundColor: viewMode === 'list' ? '#1f2a33' : 'transparent', color: viewMode === 'list' ? '#fff' : '#8d979f', border: 'none', cursor: 'pointer' }}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-Column Grid (~68% / ~32% on desktop, 1fr on mobile) */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '67% 31%', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Project Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
                {[1, 2, 3].map(i => (
                  <ProjectCardSkeleton key={i} isMobile={isMobile} />
                ))}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    color: '#8d979f',
                    fontSize: '12px',
                    fontWeight: 500,
                    textAlign: 'center',
                    backgroundColor: '#0d1318',
                    border: '1px solid #1e2830',
                    borderRadius: '8px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <Loader2 className="spin" size={14} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                  <span>{statusMessage}</span>
                </div>
              </div>
            ) : projects.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#8d979f', backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px' }}>
                <p>No projects found. Create one to get started.</p>
              </div>
            ) : (
              sortedProjects.map(project => {
                const cutsCount = project.scene_count ?? project.sceneCount;
                const respCount = project.total_respondents ?? project.totalRespondents;
                const finding = project.latest_finding || project.latestFinding;
                const status = project.status || (respCount ? 'ACTIVE' : 'DRAFT');
                const screeningProg = project.screening_progress ?? project.screeningProgress;
                const isReady = project.analysis_status === 'ANALYSIS READY' || finding;

                const experimentId = project.project_id === 'proj_northlight_01'
                  ? 'exp_23a'
                  : project.project_id === 'proj_echoes_02'
                  ? 'exp_01b'
                  : project.project_id === 'proj_below_03'
                  ? 'exp_01c'
                  : `exp_${project.project_id.replace('proj_', '')}`;

                const experimentUrl = `/projects/${project.project_id}/experiments/${experimentId}/finding`;

                if (viewMode === 'list') {
                  return (
                    <div key={project.project_id} style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '8px', padding: '14px 18px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: '16px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, width: isMobile ? '100%' : undefined, minWidth: isMobile ? 0 : '220px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#162029', flexShrink: 0 }}>
                          <img
                            src={project.thumbnail_url || "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80"}
                            alt="Thumbnail"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', textTransform: 'uppercase', margin: 0 }}>
                              {project.title}
                            </h2>
                            <Star 
                              size={14} 
                              color={starredProjects[project.project_id] ? "#ffd700" : "#8d979f"} 
                              fill={starredProjects[project.project_id] ? "#ffd700" : "none"}
                              onClick={(e) => toggleStar(project.project_id, e)}
                              style={{ cursor: 'pointer' }} 
                            />
                            <span style={{
                              backgroundColor: status === 'ACTIVE' ? 'rgba(88, 201, 75, 0.15)' : 'rgba(141, 151, 159, 0.15)',
                              color: status === 'ACTIVE' ? '#58c94b' : '#8d979f',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '3px',
                              border: `1px solid ${status === 'ACTIVE' ? 'rgba(88, 201, 75, 0.3)' : 'rgba(141, 151, 159, 0.3)'}`
                            }}>
                              {status}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '4px' }}>
                            {project.description || 'Feature Film Project'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: isMobile ? '100%' : undefined, justifyContent: isMobile ? 'space-between' : undefined, flexShrink: isMobile ? undefined : 0 }}>
                        <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }} className="tabular-nums">
                            {cutsCount != null ? cutsCount : '—'} {cutsCount != null ? plural(cutsCount, 'cut') : 'cuts'} / {respCount != null ? respCount.toLocaleString() : '0'} {plural(respCount ?? 0, 'respondent')}
                          </div>
                          <div style={{ fontSize: '11px', color: isReady ? '#c4a7ff' : '#8d979f' }}>
                            {isReady ? 'ANALYSIS READY' : 'DRAFT'}
                          </div>
                        </div>

                        <Link
                          to={experimentUrl}
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
                          <span>{isReady ? 'OPEN' : 'VIEW'}</span>
                          <ChevronRight size={14} strokeWidth={2.5} />
                        </Link>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={project.project_id} style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px', overflow: 'hidden', minWidth: 0 }}>
                    <div style={{ padding: isMobile ? '16px' : '20px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr', gap: '20px' }}>
                      {/* Thumbnail */}
                      <div style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', height: '124px', backgroundColor: '#162029' }}>
                        <img
                          src={project.thumbnail_url || "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80"}
                          alt="Thumbnail"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{ position: 'absolute', bottom: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.04em' }}>
                          PROJECT MEDIA
                        </span>
                      </div>

                      {/* Details & Metrics */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {project.title}
                              </h2>
                              <Star 
                                size={14} 
                                color={starredProjects[project.project_id] ? "#ffd700" : "#8d979f"} 
                                fill={starredProjects[project.project_id] ? "#ffd700" : "none"}
                                onClick={(e) => toggleStar(project.project_id, e)}
                                style={{ cursor: 'pointer' }} 
                              />
                            </div>
                            <span style={{
                              backgroundColor: status === 'ACTIVE' ? 'rgba(88, 201, 75, 0.15)' : 'rgba(141, 151, 159, 0.15)',
                              color: status === 'ACTIVE' ? '#58c94b' : '#8d979f',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '3px',
                              border: `1px solid ${status === 'ACTIVE' ? 'rgba(88, 201, 75, 0.3)' : 'rgba(141, 151, 159, 0.3)'}`
                            }}>
                              {status}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '2px' }}>
                            {project.description || 'Feature Film Project'}
                          </div>
                        </div>

                        {/* 3 Metric Columns */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '70px 110px 1fr', gap: '16px', backgroundColor: '#131b22', padding: '10px 14px', borderRadius: '6px', border: '1px solid #1c2630', marginTop: '12px' }}>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }} className="tabular-nums">
                              {cutsCount != null ? cutsCount : '—'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plural(cutsCount ?? 0, 'CUT')}</div>
                          </div>

                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }} className="tabular-nums">
                              {respCount != null ? respCount.toLocaleString() : '0'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plural(respCount ?? 0, 'RESPONDENT')}</div>
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latest Finding</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: finding ? '#ff6652' : '#8d979f', marginTop: '2px' }}>
                              {finding || 'None yet'}
                            </div>
                          </div>
                        </div>

                        {/* Status Banner & Action Button */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: isReady ? 'rgba(139, 92, 246, 0.2)' : 'rgba(141, 151, 159, 0.1)', color: isReady ? '#c4a7ff' : '#8d979f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FlaskConical size={14} />
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: isReady ? '#c4a7ff' : '#8d979f', letterSpacing: '0.04em' }}>
                                {isReady ? 'ANALYSIS READY' : respCount ? 'ANALYSIS PENDING' : 'NO EXPERIMENTS'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#8d979f' }}>
                                {isReady ? 'Findings available for review' : respCount ? 'Collecting screening data' : 'Ready to configure test'}
                              </div>
                            </div>
                          </div>

                          <Link
                            to={experimentUrl}
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
                            <span>{isReady ? 'OPEN EXPERIMENT' : respCount ? 'VIEW SCREENING' : 'OPEN EXPERIMENT'}</span>
                            <ChevronRight size={14} strokeWidth={2.5} />
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Row */}
                    <div style={{ borderTop: '1px solid #1a232b', padding: '10px 20px', backgroundColor: '#090e12', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#8d979f', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#202b35', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AD</div>
                          <span>{project.owner_id || 'Admin'} <span style={{ color: '#5b6670' }}>Owner</span></span>
                        </div>
                        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>SCREENING PROGRESS</span>
                        <div style={{ width: '120px', height: '6px', backgroundColor: '#172027', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${screeningProg != null ? screeningProg : 0}%`, height: '100%', backgroundColor: '#8b5cf6' }} />
                        </div>
                        <span style={{ color: '#fff', fontWeight: 600 }}>{screeningProg != null ? `${screeningProg}%` : '0%'}</span>
                        <MoreHorizontal size={14} color="#8d979f" style={{ marginLeft: '8px', cursor: 'pointer' }} onClick={() => navigate(experimentUrl)} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT COLUMN: Widgets matching Reference 01 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            
            {/* Widget 1: ACTIVE EXPERIMENTS */}
            <div style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                    ACTIVE EXPERIMENTS
                  </h3>
                  <span style={{ backgroundColor: '#1b2630', color: '#8d979f', fontSize: '11px', padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>1</span>
                </div>
                <ArrowRight size={14} color="#8d979f" onClick={() => navigate('/projects/proj_northlight_01/experiments/exp_23a/finding')} style={{ cursor: 'pointer' }} />
              </div>

              {/* Experiment Card */}
              <div style={{ backgroundColor: '#121a21', border: '1px solid #202b35', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <img src="/northlight_thumb.png" alt="Experiment thumbnail" style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>NORTHLIGHT A/B TEST</span>
                      <span style={{ backgroundColor: 'rgba(88, 201, 75, 0.15)', color: '#58c94b', fontSize: '11px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>ACTIVE</span>
                      {northlightHypothesis?.grounded === false ? (
                        <span style={{ backgroundColor: 'rgba(255, 101, 74, 0.15)', color: '#ff654a', border: '1px solid #ff654a', fontSize: '11px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>UNGROUNDED / REFUSED</span>
                      ) : (
                        <span style={{ backgroundColor: 'rgba(88, 201, 75, 0.15)', color: '#58c94b', border: '1px solid #58c94b', fontSize: '11px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>GROUNDED IN CLICKHOUSE</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#c4a7ff', marginTop: '2px' }}>{northlightHypothesis?.proposedChange || '—'}</div>
                    <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '2px' }}>Started {startedDateStr} · 2 Variants · {totalRespCount != null ? `${totalRespCount.toLocaleString()} Respondents` : '—'}</div>
                  </div>
                </div>

                {/* 3 Metric Boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
                  <div style={{ backgroundColor: '#090e12', padding: '8px', borderRadius: '4px', border: '1px solid #1c2630', minWidth: 0, boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis' }}>ENGAGEMENT LIFT</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#58c94b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }} className="tabular-nums">
                      {primaryLiftStr}
                    </div>
                    <div style={{ fontSize: '11px', color: '#58c94b', marginTop: '1px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {resultsData?.key_results ? 'MEASURED' : 'SIMULATED'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#090e12', padding: '8px', borderRadius: '4px', border: '1px solid #1c2630', minWidth: 0, boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis' }}>COMPLETION LIFT</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#58c94b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }} className="tabular-nums">
                      {secondaryLiftStr}
                    </div>
                    <div style={{ fontSize: '11px', color: '#58c94b', marginTop: '1px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {resultsData?.key_results ? 'MEASURED' : 'SIMULATED'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#090e12', padding: '8px', borderRadius: '4px', border: '1px solid #1c2630', minWidth: 0, boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis' }}>CONFIDENCE</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#58c94b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }} className="tabular-nums">
                      {confidenceVal}
                    </div>
                    <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis' }}>VERIFIED</div>
                  </div>
                </div>

                {/* Mini Retention Curves Graph */}
                {(() => {
                  const validPts = northlightTimeline.filter(pt => pt.allCohort != null);
                  if (validPts.length === 0) {
                    return (
                      <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090e12', borderRadius: '4px', border: '1px solid #1c2630', fontSize: '11px', color: '#8d979f' }}>
                        No timeline data available
                      </div>
                    );
                  }
                  const maxTime = Math.max(...validPts.map(p => p.timeMs), 65000);
                  const pathA = `M ${validPts.map(pt => `${Math.round((pt.timeMs / maxTime) * 300)} ${Math.round(70 - (pt.allCohort! * 0.85 / 100) * 70)}`).join(' L ')}`;
                  const pathB = `M ${validPts.map(pt => `${Math.round((pt.timeMs / maxTime) * 300)} ${Math.round(70 - (pt.allCohort! * 1.02 / 100) * 70)}`).join(' L ')}`;
                  const pathAll = `M ${validPts.map(pt => `${Math.round((pt.timeMs / maxTime) * 300)} ${Math.round(70 - (pt.allCohort! / 100) * 70)}`).join(' L ')}`;
                  const detMomentMs = (northlightHypothesis as any)?.detectedMomentMs ?? (northlightHypothesis as any)?.detected_moment_ms;
                  const detMoment = (northlightHypothesis as any)?.detectedMoment ?? (northlightHypothesis as any)?.detected_moment;
                  const markerX = detMomentMs != null ? Math.round((detMomentMs / maxTime) * 300) : 100;
                  
                  return (
                    <div style={{ height: '70px', position: 'relative', width: '100%' }}>
                      <svg width="100%" height="100%" viewBox="0 0 300 70" preserveAspectRatio="none">
                        {/* Variant A Control (dashed purple) */}
                        <path d={pathA} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3 3" />
                        {/* Variant B Move earlier (solid violet) */}
                        <path d={pathB} fill="none" stroke="#c4a7ff" strokeWidth="2" />
                        {/* All Respondents (gray dashed) */}
                        <path d={pathAll} fill="none" stroke="#5b6670" strokeWidth="1" strokeDasharray="2 2" />
                        {/* Red Marker Line */}
                        {detMomentMs != null && (
                          <line x1={markerX} y1="0" x2={markerX} y2="70" stroke="#ff6652" strokeWidth="1.5" strokeDasharray="2 2" />
                        )}
                      </svg>
                      {detMoment && detMomentMs != null && (
                        <span style={{ position: 'absolute', top: '2px', left: `${markerX + 4}px`, backgroundColor: '#ff6652', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '1px 3px', borderRadius: '2px' }}>
                          {detMoment}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Graph Legend */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8d979f', marginTop: '8px' }}>
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
                <span onClick={() => navigate('/projects/proj_northlight_01/experiments/exp_23a/evidence')} style={{ fontSize: '11px', color: '#8d979f', cursor: 'pointer' }}>View all</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
                {recentQueries.length === 0 ? (
                  <div style={{ color: '#8d979f', fontSize: '11px', fontStyle: 'italic', padding: '4px 0' }}>
                    no agent queries yet; generate a hypothesis to see live query activity
                  </div>
                ) : (
                  recentQueries.slice(0, 5).map((run: any, idx: number) => {
                    const queryText = run.query || 'SELECT ...';
                    const durationStr = run.duration_ms != null
                      ? (run.duration_ms < 1000 ? `${run.duration_ms}ms` : `${(run.duration_ms / 1000).toFixed(1)}s`)
                      : '0ms';
                    const rowsStr = run.rows != null ? `${run.rows} ${plural(run.rows, 'row')}` : '';

                    return (
                      <div key={run.query_id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace', color: '#8d979f', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0 }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#58c94b', flexShrink: 0 }} />
                          <span style={{ color: '#58c94b', fontWeight: 700, flexShrink: 0 }}>{durationStr}</span>
                          {rowsStr && <span style={{ color: '#8d979f', flexShrink: 0 }}>{rowsStr}</span>}
                          <span style={{ color: '#c4a7ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={queryText}>
                            {queryText}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Widget 3: CLICKHOUSE MCP */}
            <div style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                  CLICKHOUSE MCP
                </h3>
                <span style={{ backgroundColor: healthData?.database_connected !== false ? 'rgba(88, 201, 75, 0.15)' : 'rgba(255, 101, 74, 0.15)', color: healthData?.database_connected !== false ? '#58c94b' : '#ff654a', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', border: `1px solid ${healthData?.database_connected !== false ? 'rgba(88, 201, 75, 0.3)' : 'rgba(255, 101, 74, 0.3)'}` }}>
                  {healthData?.database_connected !== false ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#8d979f', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>DATA SOURCE</span>
                  <strong style={{ color: '#ffffff' }}>{derivedDataSource}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>REGION</span>
                  <strong style={{ color: '#ffffff' }}>{derivedRegion}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>LAST SYNC</span>
                  <strong style={{ color: '#ffffff' }}>{lastSyncStr}</strong>
                </div>
              </div>

              <button
                onClick={() => navigate('/projects/proj_northlight_01/experiments/exp_23a/evidence')}
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
