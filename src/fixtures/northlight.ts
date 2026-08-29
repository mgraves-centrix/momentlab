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
  forecastEngagement: string;
  forecastCompletion: string;
  forecastConfusion: string;
  evidenceIds: string[];
  status: 'PROPOSED' | 'APPROVED' | 'LAUNCHED' | 'EVALUATED';
  isSimulated: boolean;
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

export const NORTHLIGHT_PROJECT: Project = {
  id: "proj_northlight_01",
  name: "Northlight",
  description: "Feature psychological thriller — Scene 12 edit optimization",
  sceneCount: 4,
  totalRespondents: 4732,
  status: "ACTIVE",
  lastActivity: "2026-08-04T01:30:00Z"
};

export const NORTHLIGHT_TIMELINE: TimelineDataPoint[] = [
  { timecode: "00:00", timeMs: 0, allCohort: 85, cohort18_24: 88, cohort25_34: 82, uncertaintyUpper: 88, uncertaintyLower: 82, sampleSize: 4732 },
  { timecode: "00:10", timeMs: 10000, allCohort: 84, cohort18_24: 86, cohort25_34: 82, uncertaintyUpper: 87, uncertaintyLower: 81, sampleSize: 4730 },
  { timecode: "00:20", timeMs: 20000, allCohort: 81, cohort18_24: 85, cohort25_34: 77, uncertaintyUpper: 84, uncertaintyLower: 78, sampleSize: 4725 },
  { timecode: "00:30", timeMs: 30000, allCohort: 78, cohort18_24: 82, cohort25_34: 74, uncertaintyUpper: 81, uncertaintyLower: 75, sampleSize: 4710 },
  { timecode: "00:33", timeMs: 33000, allCohort: 75, cohort18_24: 80, cohort25_34: 70, uncertaintyUpper: 78, uncertaintyLower: 72, sampleSize: 4700, isAnomaly: true },
  { timecode: "00:37", timeMs: 37000, allCohort: 50, cohort18_24: 48, cohort25_34: 52, uncertaintyUpper: 54, uncertaintyLower: 46, sampleSize: 4680, isAnomaly: true }, // -28% cliff
  { timecode: "00:41", timeMs: 41000, allCohort: 53, cohort18_24: 50, cohort25_34: 56, uncertaintyUpper: 57, uncertaintyLower: 49, sampleSize: 4650, isAnomaly: true },
  { timecode: "00:50", timeMs: 50000, allCohort: 62, cohort18_24: 60, cohort25_34: 64, uncertaintyUpper: 66, uncertaintyLower: 58, sampleSize: 4620 },
  { timecode: "01:00", timeMs: 60000, allCohort: 70, cohort18_24: 68, cohort25_34: 72, uncertaintyUpper: 74, uncertaintyLower: 66, sampleSize: 4600 }
];

export const NORTHLIGHT_EVIDENCE: EvidenceRecord[] = [
  {
    id: "ev_01",
    queryRunId: "qr_ch_883912",
    timestamp: "2026-08-04T01:32:00Z",
    sampleSize: 4732,
    observedEffect: "-28.4% engagement retention drop",
    uncertainty: "95% CI [-31.1%, -25.7%]",
    timeRange: "00:33 - 00:41",
    sqlQuery: "SELECT quantilesExactWeighted(0.5, retention_score, weight) FROM audience_events WHERE scene_id = 'sc_12' AND time_ms BETWEEN 33000 AND 41000",
    description: "Sharp response cliff detected across both 18-24 and 25-34 age demographics during shadow reveal delay."
  },
  {
    id: "ev_02",
    queryRunId: "qr_ch_883915",
    timestamp: "2026-08-04T01:33:12Z",
    sampleSize: 4732,
    observedEffect: "+42% spike in 'Confused' explicit reactions",
    uncertainty: "95% CI [+38.0%, +46.0%]",
    timeRange: "00:35 - 00:39",
    sqlQuery: "SELECT countIf(reaction = 'CONFUSED') FROM reaction_events WHERE time_ms BETWEEN 35000 AND 39000",
    description: "Audience friction peaks at 00:37 where character motivation is obscured."
  }
];

export const NORTHLIGHT_HYPOTHESIS: Hypothesis = {
  id: "hyp_23a",
  experimentId: "exp_23a",
  proposedChange: "MOVE REVEAL 6S EARLIER",
  rationale: "Aligning the shadow reveal keyframe to 00:37 eliminates narrative confusion and restores viewer engagement momentum.",
  confidenceScore: 91,
  forecastEngagement: "+18%",
  forecastCompletion: "+9%",
  forecastConfusion: "-4%",
  evidenceIds: ["ev_01", "ev_02"],
  status: "PROPOSED",
  isSimulated: true
};

export const NORTHLIGHT_MCP_ACTIVITIES: McpActivity[] = [
  {
    id: "mcp_act_01",
    timestamp: "2026-08-04T01:32:00Z",
    toolName: "mcp_clickhouse_query",
    durationMs: 42,
    rowCount: 4732,
    queryPurpose: "Aggregate second-by-second audience retention series for Scene 12",
    status: "SUCCESS"
  },
  {
    id: "mcp_act_02",
    timestamp: "2026-08-04T01:33:12Z",
    toolName: "mcp_clickhouse_query",
    durationMs: 28,
    rowCount: 312,
    queryPurpose: "Query explicit reaction breakdown around timecode 00:37",
    status: "SUCCESS"
  }
];
