import { formatTimecodeMs } from '../utils/format';

export interface Project {
  project_id: string;
  title: string;
  description?: string;
  owner_id: string;
  created_at: string;
  video_url?: string;
  thumbnail_url?: string;
  
  // Computed / live properties from backend
  sceneCount?: number;
  scene_count?: number;
  totalRespondents?: number;
  total_respondents?: number;
  status?: string;
  latestFinding?: string;
  latest_finding?: string;
  screeningProgress?: number;
  screening_progress?: number;
  analysisStatus?: string;
  analysis_status?: string;
}

export interface ExperimentSummary {
  status?: string;
  total_respondents: number;
  detected_moment?: string | null;
  detected_moment_ms?: number | null;
  retention_drop?: string | null;
  anomaly_window?: string | null;
  confidence?: number | null;
  message?: string | null;
}

export interface SceneMetadata {
  id: string;
  name: string;
  timecode_start: string;
  timecode_end: string;
  video_url: string;
  poster_url?: string;
}

export interface TimelineDataPoint {
  timecode: string;
  timeMs: number;
  allCohort: number;
  cohort18_24: number;
  cohort25_34: number;
  uncertaintyUpper: number;
  uncertaintyLower: number;
  sampleSize: number;
  isAnomaly?: boolean;
}

export interface Hypothesis {
  id: string;
  experimentId: string;
  proposedChange: string;
  rationale: string;
  confidenceScore: number;
  forecastEngagement: string;
  forecastCompletion: string;
  forecastConfusion: string;
  evidenceIds: string[];
  evidenceRecords: {
    id: string;
    timestamp: string;
    metric: string;
    segment: string;
    window: string;
    effectSize: string;
    significance: string;
    sourceQueryRunId: string;
  }[];
  trace: {
    runId: string;
    totalDurationMs: number;
    steps: {
      name: string;
      status: string;
      durationMs: number;
    }[];
  };
  status: 'PROPOSED' | 'APPROVED' | 'LAUNCHED' | 'EVALUATED';
  isSimulated: boolean;
}

const API_BASE = '/api/v1';

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return await res.json();
}

export async function fetchProject(projectId: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`);
  if (!res.ok) throw new Error(`Failed to fetch project ${projectId}`);
  return await res.json();
}

export async function fetchRecentQueries(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/telemetry/queries`);
  if (!res.ok) throw new Error('Failed to fetch queries');
  return await res.json();
}

export async function fetchExperimentSummary(projectId: string, experimentId: string): Promise<ExperimentSummary> {
  const res = await fetch(`${API_BASE}/telemetry/summary?project_id=${projectId}&experiment_id=${experimentId}`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return await res.json();
}

export async function fetchExperimentTimeline(projectId: string, experimentId: string, cohort: string = 'all'): Promise<TimelineDataPoint[]> {
  const url = `${API_BASE}/telemetry/timeline?project_id=${projectId}&experiment_id=${experimentId}${cohort && cohort !== 'all' ? `&cohort=${cohort}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch experiment timeline');
  const data = await res.json();
  if (data.length > 0) {
    return data.map((d: any) => {
      const allVal = d.all_cohort !== undefined ? Math.round(d.all_cohort) : (d.avg_value > 1.0 ? Math.round(d.avg_value) : Math.round(d.avg_value * 100));
      const c18Val = d.cohort_18_24 !== undefined ? Math.round(d.cohort_18_24) : allVal;
      const c25Val = d.cohort_25_34 !== undefined ? Math.round(d.cohort_25_34) : allVal;
      
      const uncUpper = d.uncertainty_upper !== undefined ? Math.round(d.uncertainty_upper) : Math.min(100, allVal + 4);
      const uncLower = d.uncertainty_lower !== undefined ? Math.round(d.uncertainty_lower) : Math.max(0, allVal - 4);
      
      return {
        timecode: formatTimecodeMs(d.media_time_ms),
        timeMs: d.media_time_ms,
        allCohort: allVal,
        cohort18_24: c18Val,
        cohort25_34: c25Val,
        uncertaintyUpper: uncUpper,
        uncertaintyLower: uncLower,
        sampleSize: d.total_events || d.sample_size || 0,
        isAnomaly: Boolean(d.is_anomaly)
      };
    });
  } else {
    return [];
  }
}

export async function fetchExperimentHypothesis(projectId: string, experimentId: string): Promise<Hypothesis> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/hypothesis`);
  if (!res.ok) throw new Error('Failed to fetch hypothesis');
  const data = await res.json();
  return data.hypothesis || data;
}

export async function approveHypothesis(projectId: string, experimentId: string): Promise<Hypothesis> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('reviewer_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/test/approve`, {
    method: 'POST',
    headers
  });
  if (!res.ok) throw new Error('Failed to approve hypothesis');
  return await res.json();
}

export async function generateHypothesis(projectId: string, experimentId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/generate-hypothesis`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to generate hypothesis');
  const data = await res.json();
  return data.hypothesis || data;
}

export async function requestRevisionHypothesis(projectId: string, experimentId: string, notes?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/hypothesis/request-revision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: notes || 'Tighten cut window' })
  });
  if (!res.ok) throw new Error('Failed to request revision');
  return await res.json();
}

export async function discardHypothesis(projectId: string, experimentId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/hypothesis/discard`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to discard hypothesis');
  return await res.json();
}


