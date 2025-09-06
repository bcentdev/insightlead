import { Metric } from '@/shared/domain/metric.entity';

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  issueType: string;
  status: string;
  priority: string;
  assignee: string;
  reporter: string;
  created: Date;
  updated: Date;
  resolved?: Date;
  storyPoints?: number;
  project: string;
  url: string;
}

export interface JiraWorklog {
  id: string;
  issueId: string;
  timeSpent: number; // in seconds
  started: Date;
  author: string;
  description?: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'future' | 'active' | 'closed';
  startDate?: Date;
  endDate?: Date;
  completeDate?: Date;
  boardId: number;
}

export interface JiraMetricsData {
  issues: JiraIssue[];
  worklogs: JiraWorklog[];
  sprints: JiraSprint[];
}

export interface JiraTimeMetrics {
  cycleTime: number; // Average time from start to completion
  leadTime: number; // Average time from creation to completion
  issueCount: number;
  completedIssueCount: number;
  storyPointsCompleted: number;
}

export interface JiraPort {
  /**
   * Fetch all metrics for a Jira user within a date range
   */
  fetchMetrics(username: string, dateFrom?: Date, dateTo?: Date): Promise<Metric[]>;

  /**
   * Fetch detailed Jira data for a user
   */
  fetchUserData(username: string, dateFrom?: Date, dateTo?: Date): Promise<JiraMetricsData>;

  /**
   * Calculate time-based metrics for a user
   */
  calculateTimeMetrics(username: string, dateFrom?: Date, dateTo?: Date): Promise<JiraTimeMetrics>;

  /**
   * Check if a Jira username exists
   */
  validateUsername(username: string): Promise<boolean>;

  /**
   * Get user profile information
   */
  getUserProfile(username: string): Promise<{
    accountId: string;
    displayName: string;
    emailAddress: string;
    avatarUrls: Record<string, string>;
    active: boolean;
  } | null>;

  /**
   * Test Jira API connection and authentication
   */
  testConnection(): Promise<boolean>;

  /**
   * Get issues assigned to a user
   */
  getIssuesAssignedToUser(username: string, dateFrom?: Date, dateTo?: Date): Promise<JiraIssue[]>;

  /**
   * Get issues created by a user
   */
  getIssuesCreatedByUser(username: string, dateFrom?: Date, dateTo?: Date): Promise<JiraIssue[]>;
}