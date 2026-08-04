export interface Project {
  id: string;
  name: string;
  description: string;
  sceneCount: number;
  totalRespondents: number;
  status: 'ACTIVE' | 'ARCHIVED';
  lastActivity: string;
  scenes?: SceneMetadata[];
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
  status: 'PROPOSED' | 'APPROVED' | 'LAUNCHED' | 'EVALUATED';
  isSimulated: boolean;
}

const API_BASE = '/api/v1';

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return await res.json();
  } catch (err) {
    console.warn('Backend API offline, utilizing fallback project data:', err);
    return [{
      id: "proj_northlight_01",
      name: "Northlight",
      description: "Feature psychological thriller — Scene 12 edit optimization",
      sceneCount: 4,
      totalRespondents: 4732,
      status: "ACTIVE",
      lastActivity: "2026-08-04T01:30:00Z"
    }];
  }
}

export async function fetchSceneTimeline(sceneId: string = 'sc_12'): Promise<TimelineDataPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/scenes/${sceneId}/timeline`);
    if (!res.ok) throw new Error('Failed to fetch scene timeline');
    return await res.json();
  } catch (err) {
    console.warn('Backend API offline, utilizing fallback timeline series:', err);
    return [
      { timecode: "00:00", timeMs: 0, allCohort: 85, cohort18_24: 88, cohort25_34: 82, uncertaintyUpper: 88, uncertaintyLower: 82, sampleSize: 4732 },
      { timecode: "00:10", timeMs: 10000, allCohort: 84, cohort18_24: 86, cohort25_34: 82, uncertaintyUpper: 87, uncertaintyLower: 81, sampleSize: 4730 },
      { timecode: "00:20", timeMs: 20000, allCohort: 81, cohort18_24: 85, cohort25_34: 77, uncertaintyUpper: 84, uncertaintyLower: 78, sampleSize: 4725 },
      { timecode: "00:30", timeMs: 30000, allCohort: 78, cohort18_24: 82, cohort25_34: 74, uncertaintyUpper: 81, uncertaintyLower: 75, sampleSize: 4710 },
      { timecode: "00:33", timeMs: 33000, allCohort: 75, cohort18_24: 80, cohort25_34: 70, uncertaintyUpper: 78, uncertaintyLower: 72, sampleSize: 4700, isAnomaly: true },
      { timecode: "00:37", timeMs: 37000, allCohort: 50, cohort18_24: 48, cohort25_34: 52, uncertaintyUpper: 54, uncertaintyLower: 46, sampleSize: 4680, isAnomaly: true },
      { timecode: "00:41", timeMs: 41000, allCohort: 53, cohort18_24: 50, cohort25_34: 56, uncertaintyUpper: 57, uncertaintyLower: 49, sampleSize: 4650, isAnomaly: true },
      { timecode: "00:50", timeMs: 50000, allCohort: 62, cohort18_24: 60, cohort25_34: 64, uncertaintyUpper: 66, uncertaintyLower: 58, sampleSize: 4620 },
      { timecode: "01:00", timeMs: 60000, allCohort: 70, cohort18_24: 68, cohort25_34: 72, uncertaintyUpper: 74, uncertaintyLower: 66, sampleSize: 4600 }
    ];
  }
}

export async function approveHypothesis(hypothesisId: string): Promise<Hypothesis> {
  const res = await fetch(`${API_BASE}/hypotheses/${hypothesisId}/approve`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to approve hypothesis');
  return await res.json();
}
