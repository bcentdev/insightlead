import { v4 as uuidv4 } from 'uuid';

export const METRIC_SOURCES = {
  GITHUB: 'github',
  JIRA: 'jira',
  MANUAL: 'manual'
} as const;

export type MetricSource = typeof METRIC_SOURCES[keyof typeof METRIC_SOURCES];

export const METRIC_TYPES = {
  PULL_REQUESTS_CREATED: 'pull_requests_created',
  PULL_REQUESTS_MERGED: 'pull_requests_merged',
  PULL_REQUESTS_REVIEWED: 'pull_requests_reviewed',
  COMMITS: 'commits',
  LINES_ADDED: 'lines_added',
  LINES_DELETED: 'lines_deleted',
  ISSUES_CREATED: 'issues_created',
  ISSUES_RESOLVED: 'issues_resolved',
  CODE_REVIEWS_GIVEN: 'code_reviews_given',
  STORIES_COMPLETED: 'stories_completed',
  BUGS_FIXED: 'bugs_fixed',
  TASKS_COMPLETED: 'tasks_completed',
  CYCLE_TIME: 'cycle_time',
  LEAD_TIME: 'lead_time',
  TEAM_MEETINGS: 'team_meetings',
  ONE_ON_ONES: 'one_on_ones',
  MENTORING_SESSIONS: 'mentoring_sessions',
  KNOWLEDGE_SHARING: 'knowledge_sharing',
  PROCESS_IMPROVEMENTS: 'process_improvements'
} as const;

export type MetricType = typeof METRIC_TYPES[keyof typeof METRIC_TYPES];

export type MetricData = {
  readonly id: string;
  readonly peerId: string;
  readonly source: MetricSource;
  readonly type: MetricType;
  readonly value: number;
  readonly metadata: Record<string, any>;
  readonly timestamp: Date;
  readonly createdAt: Date;
};

export type CreateMetricProps = {
  id?: string;
  peerId: string;
  source: MetricSource;
  type: MetricType;
  value: number;
  metadata: Record<string, any>;
  timestamp: Date;
  createdAt?: Date;
};

const validateMetricData = (data: MetricData): void => {
  if (!data.peerId.trim()) {
    throw new Error('Metric must be associated with a peer');
  }
  if (data.value < 0) {
    throw new Error('Metric value cannot be negative');
  }
  if (data.timestamp > new Date()) {
    throw new Error('Metric timestamp cannot be in the future');
  }
};

export const createMetric = (props: CreateMetricProps): MetricData => {
  const metricData: MetricData = {
    id: props.id || uuidv4(),
    peerId: props.peerId,
    source: props.source,
    type: props.type,
    value: props.value,
    metadata: props.metadata,
    timestamp: props.timestamp,
    createdAt: props.createdAt || new Date()
  };

  validateMetricData(metricData);
  return metricData;
};

// Type alias for compatibility
export type Metric = MetricData;