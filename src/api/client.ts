export interface Project {
  project_id: string;
  title: string;
  description?: string;
  owner_id: string;
  created_at: string;
  video_url?: string;
  thumbnail_url?: string;
  
  // Computed/Legacy properties used by UI
  sceneCount?: number;
  totalRespondents?: number;
  status?: string;
}

export interface ExperimentSummary {
  total_respondents: number;
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

export async function fetchExperimentTimeline(projectId: string, experimentId: string): Promise<TimelineDataPoint[]> {
  const res = await fetch(`${API_BASE}/telemetry/timeline?project_id=${projectId}&experiment_id=${experimentId}`);
  if (!res.ok) throw new Error('Failed to fetch experiment timeline');
  const data = await res.json();
  if (data.length > 0) {
    return data.map((d: any) => ({
      timecode: `00:${String(Math.floor(d.media_time_ms / 1000)).padStart(2, '0')}`,
      timeMs: d.media_time_ms,
      allCohort: Math.floor(d.avg_value * 100) || 50,
      cohort18_24: Math.floor(d.avg_value * 100) || 50,
      cohort25_34: Math.floor(d.avg_value * 100) || 50,
      uncertaintyUpper: Math.floor(d.avg_value * 100) + 5 || 55,
      uncertaintyLower: Math.floor(d.avg_value * 100) - 5 || 45,
      sampleSize: d.total_events || 0,
      isAnomaly: d.avg_value < 0.6 // Arbitrary anomaly logic
    }));
  } else {
    throw new Error('No live data available');
  }
}

export async function fetchExperimentHypothesis(projectId: string, experimentId: string): Promise<Hypothesis> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/hypothesis`);
  if (!res.ok) throw new Error('Failed to fetch hypothesis');
  const data = await res.json();
  return data.hypothesis || data;
}

export async function approveHypothesis(projectId: string, experimentId: string): Promise<Hypothesis> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/experiments/${experimentId}/test/approve`, {
    method: 'POST'
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

