export interface Project {
  id: string;
  name: string;
  description: string;
  sceneCount: number;
  totalRespondents: number;
  status: 'ACTIVE' | 'ARCHIVED';
  lastActivity: string;
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

export interface EvidenceRecord {
  id: string;
  queryRunId: string;
  timestamp: string;
  sampleSize: number;
  observedEffect: string;
  uncertainty: string;
  timeRange: string;
  sqlQuery: string;
  description: string;
}

export interface Hypothesis {
  id: string;
  experimentId: string;
  proposedChange: string;
  rationale: string;
  confidenceScore: number;
  forecastEngagement?: string;
  forecastCompletion?: string;
  forecastConfusion?: string;
  evidenceIds: string[];
  status: 'PROPOSED' | 'APPROVED' | 'LAUNCHED' | 'EVALUATED' | 'REVISION_REQUESTED' | 'DISCARDED' | 'UNGROUNDED';
  isSimulated: boolean;
  grounded?: boolean;
  successfulDataQueryCount?: number;
  retentionDrop?: string;
  detectedMoment?: string;
  detectedMomentMs?: number;
  anomalyWindow?: string;
  evidenceRecords?: any[];
  trace?: {
    runId?: string;
    totalDurationMs?: number;
    steps?: Array<{ name: string; status: string; durationMs: number }>;
  };
}

export interface McpActivity {
  id: string;
  timestamp: string;
  toolName: string;
  durationMs: number;
  rowCount: number;
  queryPurpose: string;
  status: 'SUCCESS' | 'EXECUTING' | 'ERROR';
}
