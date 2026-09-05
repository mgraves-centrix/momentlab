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
  allCohort: number | null;
  cohort18_24: number | null;
  cohort25_34: number | null;
  uncertaintyUpper: number | null;
  uncertaintyLower: number | null;
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
  status: 'PROPOSED' | 'APPROVED' | 'LAUNCHED' | 'EVALUATED' | 'REVISION_REQUESTED' | 'DISCARDED' | 'UNGROUNDED';
  isSimulated: boolean;
  grounded?: boolean;
  successfulDataQueryCount?: number;
  retentionDrop?: string;
  detectedMoment?: string;
  anomalyWindow?: string;
}

const API_BASE = '/api/v1';

export interface HealthStatus {
  status: string;
  git_sha: string;
  database_connected: boolean;
  database_host: string;
  database_version: string;
  server_version: string;
  buffered_events: number;
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch('/health');
  if (!res.ok) throw new Error('Failed to fetch health');
  return await res.json();
}

export async function fetchExperimentResults(projectId: string, experimentId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/results`);
  if (!res.ok) throw new Error('Failed to fetch experiment results');
  return await res.json();
}

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

export async function fetchExperimentTimeline(
  projectId: string,
  experimentId: string,
  cohort: string = 'all'
): Promise<TimelineDataPoint[] & { mvDurationMs?: number; rawDurationMs?: number }> {
  const url = `${API_BASE}/telemetry/timeline?project_id=${projectId}&experiment_id=${experimentId}${cohort && cohort !== 'all' ? `&cohort=${cohort}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    let errorDetail = `Failed to fetch experiment timeline (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch (_) {}
    throw new Error(errorDetail);
  }
  const mvMsStr = res.headers.get('X-MV-Duration-Ms');
  const rawMsStr = res.headers.get('X-Raw-Duration-Ms');
  const mvDurationMs = mvMsStr ? parseInt(mvMsStr, 10) : undefined;
  const rawDurationMs = rawMsStr ? parseInt(rawMsStr, 10) : undefined;

  const data = await res.json();
  if (data.length > 0) {
    const pts: any = data.map((d: any) => {
      const allVal = (d.all_cohort !== null && d.all_cohort !== undefined)
        ? Math.round(d.all_cohort)
        : (d.avg_value !== null && d.avg_value !== undefined ? (d.avg_value > 1.0 ? Math.round(d.avg_value) : Math.round(d.avg_value * 100)) : null);
      const c18Val = (d.cohort_18_24 !== null && d.cohort_18_24 !== undefined) ? Math.round(d.cohort_18_24) : null;
      const c25Val = (d.cohort_25_34 !== null && d.cohort_25_34 !== undefined) ? Math.round(d.cohort_25_34) : null;
      
      const uncUpper = (d.uncertainty_upper !== null && d.uncertainty_upper !== undefined) ? Math.round(d.uncertainty_upper) : null;
      const uncLower = (d.uncertainty_lower !== null && d.uncertainty_lower !== undefined) ? Math.round(d.uncertainty_lower) : null;
      
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
    if (mvDurationMs !== undefined) pts.mvDurationMs = mvDurationMs;
    if (rawDurationMs !== undefined) pts.rawDurationMs = rawDurationMs;
    return pts;
  } else {
    const emptyPts: any = [];
    if (mvDurationMs !== undefined) emptyPts.mvDurationMs = mvDurationMs;
    if (rawDurationMs !== undefined) emptyPts.rawDurationMs = rawDurationMs;
    return emptyPts;
  }
}

export async function fetchExperimentHypothesis(projectId: string, experimentId: string): Promise<Hypothesis> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/hypothesis`);
  if (!res.ok) throw new Error('Failed to fetch hypothesis');
  const data = await res.json();
  return data.hypothesis || data;
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('reviewer_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function approveHypothesis(projectId: string, experimentId: string): Promise<Hypothesis> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/test/approve`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to approve hypothesis');
  return await res.json();
}

export async function generateHypothesis(projectId: string, experimentId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/generate-hypothesis`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to generate hypothesis');
  const data = await res.json();
  return data.hypothesis || data;
}

export async function requestRevisionHypothesis(projectId: string, experimentId: string, notes?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/hypothesis/request-revision`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes: notes || 'Tighten cut window' })
  });
  if (!res.ok) throw new Error('Failed to request revision');
  return await res.json();
}

export async function discardHypothesis(projectId: string, experimentId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/hypothesis/discard`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to discard hypothesis');
  return await res.json();
}
