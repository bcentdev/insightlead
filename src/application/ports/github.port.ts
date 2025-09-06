import { Metric } from '../../domain/entities/metric.entity';

export interface GitHubPullRequest {
  id: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  additions: number;
  deletions: number;
  reviewComments: number;
  repository: string;
  url: string;
}

export interface GitHubIssue {
  id: number;
  title: string;
  state: 'open' | 'closed';
  createdAt: Date;
  closedAt?: Date;
  repository: string;
  url: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  date: Date;
  additions: number;
  deletions: number;
  repository: string;
  url: string;
}

export interface GitHubReview {
  id: number;
  state: 'approved' | 'changes_requested' | 'commented';
  submittedAt: Date;
  pullRequestId: number;
  repository: string;
}

export interface GitHubMetricsData {
  pullRequests: GitHubPullRequest[];
  issues: GitHubIssue[];
  commits: GitHubCommit[];
  reviews: GitHubReview[];
}

export interface GitHubPort {
  /**
   * Fetch all metrics for a GitHub user within a date range
   */
  fetchMetrics(username: string, dateFrom?: Date, dateTo?: Date): Promise<Metric[]>;

  /**
   * Fetch detailed GitHub data for a user
   */
  fetchUserData(username: string, dateFrom?: Date, dateTo?: Date): Promise<GitHubMetricsData>;

  /**
   * Check if a GitHub username exists
   */
  validateUsername(username: string): Promise<boolean>;

  /**
   * Get user profile information
   */
  getUserProfile(username: string): Promise<{
    id: number;
    login: string;
    name: string;
    email: string;
    avatar_url: string;
    public_repos: number;
    followers: number;
    following: number;
  } | null>;

  /**
   * Test GitHub API connection and authentication
   */
  testConnection(): Promise<boolean>;
}