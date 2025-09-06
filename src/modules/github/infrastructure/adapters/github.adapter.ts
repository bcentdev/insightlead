import { GitHubPort, GitHubMetricsData, GitHubPullRequest, GitHubIssue, GitHubCommit, GitHubReview } from '@/modules/github/application/ports/github.port';
import { Metric, createMetric, METRIC_SOURCES, METRIC_TYPES } from '@/shared/domain/metric.entity';
import { GitHubClient } from './github-client';

// Pure function to group items by date
const groupByDate = <T>(items: T[], dateExtractor: (item: T) => Date): Record<string, T[]> => {
  return items.reduce((groups, item) => {
    const date = dateExtractor(item).toISOString().split('T')[0]; // YYYY-MM-DD format
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

// Pure function to create pull request metrics
const createPullRequestMetrics = (peerId: string, pullRequests: GitHubPullRequest[]): Metric[] => {
  const metrics: Metric[] = [];
  const groupedByDate = groupByDate(pullRequests, pr => pr.createdAt);

  Object.entries(groupedByDate).forEach(([date, prs]) => {
    const timestamp = new Date(date);

    // PR created count
    metrics.push(createMetric({
      peerId,
      source: METRIC_SOURCES.GITHUB,
      type: METRIC_TYPES.PULL_REQUESTS_CREATED,
      value: prs.length,
      timestamp,
      metadata: {
        repositories: [...new Set(prs.map(pr => pr.repository))]
      }
    }));

    // PR merged count
    const mergedPrs = prs.filter(pr => pr.state === 'merged');
    if (mergedPrs.length > 0) {
      metrics.push(createMetric({
        peerId,
        source: METRIC_SOURCES.GITHUB,
        type: METRIC_TYPES.PULL_REQUESTS_MERGED,
        value: mergedPrs.length,
        timestamp,
        metadata: {
          repositories: [...new Set(mergedPrs.map(pr => pr.repository))]
        }
      }));
    }

    // Lines added/deleted
    const totalAdditions = prs.reduce((sum, pr) => sum + pr.additions, 0);
    const totalDeletions = prs.reduce((sum, pr) => sum + pr.deletions, 0);

    if (totalAdditions > 0) {
      metrics.push(createMetric({
        peerId,
        source: METRIC_SOURCES.GITHUB,
        type: METRIC_TYPES.LINES_ADDED,
        value: totalAdditions,
        timestamp,
        metadata: { from_pull_requests: true }
      }));
    }

    if (totalDeletions > 0) {
      metrics.push(createMetric({
        peerId,
        source: METRIC_SOURCES.GITHUB,
        type: METRIC_TYPES.LINES_DELETED,
        value: totalDeletions,
        timestamp,
        metadata: { from_pull_requests: true }
      }));
    }
  });

  return metrics;
};

// Pure function to create issue metrics
const createIssueMetrics = (peerId: string, issues: GitHubIssue[]): Metric[] => {
  const metrics: Metric[] = [];
  const groupedByDate = groupByDate(issues, issue => issue.createdAt);

  Object.entries(groupedByDate).forEach(([date, issueList]) => {
    const timestamp = new Date(date);

    // Issues created
    metrics.push(createMetric({
      peerId,
      source: METRIC_SOURCES.GITHUB,
      type: METRIC_TYPES.ISSUES_CREATED,
      value: issueList.length,
      timestamp,
      metadata: {
        repositories: [...new Set(issueList.map(issue => issue.repository))]
      }
    }));

    // Issues resolved
    const resolvedIssues = issueList.filter(issue => issue.state === 'closed');
    if (resolvedIssues.length > 0) {
      metrics.push(createMetric({
        peerId,
        source: METRIC_SOURCES.GITHUB,
        type: METRIC_TYPES.ISSUES_RESOLVED,
        value: resolvedIssues.length,
        timestamp,
        metadata: {
          repositories: [...new Set(resolvedIssues.map(issue => issue.repository))]
        }
      }));
    }
  });

  return metrics;
};

// Pure function to create commit metrics
const createCommitMetrics = (peerId: string, commits: GitHubCommit[]): Metric[] => {
  const metrics: Metric[] = [];
  const groupedByDate = groupByDate(commits, commit => commit.date);

  Object.entries(groupedByDate).forEach(([date, commitList]) => {
    const timestamp = new Date(date);

    // Commit count
    metrics.push(createMetric({
      peerId,
      source: METRIC_SOURCES.GITHUB,
      type: METRIC_TYPES.COMMITS,
      value: commitList.length,
      timestamp,
      metadata: {
        repositories: [...new Set(commitList.map(commit => commit.repository))]
      }
    }));

    // Lines added/deleted from commits
    const totalAdditions = commitList.reduce((sum, commit) => sum + commit.additions, 0);
    const totalDeletions = commitList.reduce((sum, commit) => sum + commit.deletions, 0);

    if (totalAdditions > 0) {
      metrics.push(createMetric({
        peerId,
        source: METRIC_SOURCES.GITHUB,
        type: METRIC_TYPES.LINES_ADDED,
        value: totalAdditions,
        timestamp,
        metadata: { from_commits: true }
      }));
    }

    if (totalDeletions > 0) {
      metrics.push(createMetric({
        peerId,
        source: METRIC_SOURCES.GITHUB,
        type: METRIC_TYPES.LINES_DELETED,
        value: totalDeletions,
        timestamp,
        metadata: { from_commits: true }
      }));
    }
  });

  return metrics;
};

// Pure function to create review metrics
const createReviewMetrics = (peerId: string, reviews: GitHubReview[]): Metric[] => {
  const metrics: Metric[] = [];
  const groupedByDate = groupByDate(reviews, review => review.submittedAt);

  Object.entries(groupedByDate).forEach(([date, reviewList]) => {
    const timestamp = new Date(date);

    metrics.push(createMetric({
      peerId,
      source: METRIC_SOURCES.GITHUB,
      type: METRIC_TYPES.CODE_REVIEWS_GIVEN,
      value: reviewList.length,
      timestamp,
      metadata: {
        repositories: [...new Set(reviewList.map(review => review.repository))],
        approved: reviewList.filter(r => r.state === 'approved').length,
        changes_requested: reviewList.filter(r => r.state === 'changes_requested').length,
        commented: reviewList.filter(r => r.state === 'commented').length
      }
    }));
  });

  return metrics;
};

// Function to fetch and process all user data from GitHub
const fetchUserData = (githubClient: GitHubClient) => async (
  username: string, 
  dateFrom?: Date, 
  dateTo?: Date
): Promise<GitHubMetricsData> => {
  const user = await githubClient.getUser(username);
  if (!user) {
    throw new Error(`GitHub user ${username} not found`);
  }

  const repositories = await githubClient.getUserRepositories(username);
  
  const pullRequests: GitHubPullRequest[] = [];
  const issues: GitHubIssue[] = [];
  const commits: GitHubCommit[] = [];
  const reviews: GitHubReview[] = [];

  // Fetch data from each repository
  for (const repo of repositories.slice(0, 20)) { // Limit to first 20 repos to avoid rate limits
    try {
      // Fetch pull requests
      const prs = await githubClient.getPullRequests(repo.owner.login, repo.name, username, dateFrom, dateTo);
      for (const pr of prs) {
        const prDetails = await githubClient.getPullRequestDetails(repo.owner.login, repo.name, pr.number);
        pullRequests.push({
          id: pr.id,
          title: pr.title,
          state: pr.merged_at ? 'merged' : pr.state as 'open' | 'closed',
          createdAt: new Date(pr.created_at),
          updatedAt: new Date(pr.updated_at),
          mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
          additions: prDetails.additions || 0,
          deletions: prDetails.deletions || 0,
          reviewComments: prDetails.review_comments || 0,
          repository: repo.full_name,
          url: pr.html_url
        });

        // Fetch reviews for this PR
        const prReviews = await githubClient.getReviews(repo.owner.login, repo.name, pr.number);
        reviews.push(...prReviews.map(review => ({
          id: review.id,
          state: review.state as 'approved' | 'changes_requested' | 'commented',
          submittedAt: new Date(review.submitted_at || new Date()),
          pullRequestId: pr.id,
          repository: repo.full_name
        })));
      }

      // Fetch issues
      const repoIssues = await githubClient.getIssues(repo.owner.login, repo.name, username, dateFrom, dateTo);
      issues.push(...repoIssues.map(issue => ({
        id: issue.id,
        title: issue.title,
        state: issue.state as 'open' | 'closed',
        createdAt: new Date(issue.created_at),
        closedAt: issue.closed_at ? new Date(issue.closed_at) : undefined,
        repository: repo.full_name,
        url: issue.html_url
      })));

      // Fetch commits
      const repoCommits = await githubClient.getCommits(repo.owner.login, repo.name, username, dateFrom, dateTo);
      for (const commit of repoCommits) {
        const commitDetails = await githubClient.getCommitDetails(repo.owner.login, repo.name, commit.sha);
        commits.push({
          sha: commit.sha,
          message: commit.commit.message,
          date: new Date(commit.commit.author?.date || commit.commit.committer?.date || ''),
          additions: commitDetails.stats?.additions || 0,
          deletions: commitDetails.stats?.deletions || 0,
          repository: repo.full_name,
          url: commit.html_url
        });
      }
    } catch (error) {
      console.warn(`Error fetching data from repository ${repo.full_name}:`, error);
      // Continue with other repositories
    }
  }

  return {
    pullRequests,
    issues,
    commits,
    reviews
  };
};

// Main function to fetch metrics from GitHub
const fetchMetrics = (githubClient: GitHubClient) => async (
  username: string, 
  dateFrom?: Date, 
  dateTo?: Date
): Promise<Metric[]> => {
  try {
    const userData = await fetchUserData(githubClient)(username, dateFrom, dateTo);
    const metrics: Metric[] = [];

    // Process all metrics using pure functions
    metrics.push(...createPullRequestMetrics(username, userData.pullRequests));
    metrics.push(...createIssueMetrics(username, userData.issues));
    metrics.push(...createCommitMetrics(username, userData.commits));
    metrics.push(...createReviewMetrics(username, userData.reviews));

    return metrics;
  } catch (error) {
    console.error('Error fetching GitHub metrics:', error);
    throw new Error(`Failed to fetch GitHub metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to validate username
const validateUsername = (githubClient: GitHubClient) => async (username: string): Promise<boolean> => {
  try {
    const user = await githubClient.getUser(username);
    return user !== null;
  } catch {
    return false;
  }
};

// Function to get user profile
const getUserProfile = (githubClient: GitHubClient) => async (username: string): Promise<{
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
} | null> => {
  const user = await githubClient.getUser(username);
  if (!user) return null;
  
  return {
    id: user.id,
    login: user.login,
    name: user.name || '',
    email: user.email || '',
    avatar_url: user.avatar_url,
    public_repos: user.public_repos,
    followers: user.followers,
    following: user.following
  };
};

// Function to test connection
const testConnection = (githubClient: GitHubClient) => (): Promise<boolean> => {
  return githubClient.testConnection();
};

// Factory function to create GitHub adapter
export const createGitHubAdapter = (githubClient: GitHubClient): GitHubPort => ({
  fetchMetrics: fetchMetrics(githubClient),
  fetchUserData: fetchUserData(githubClient),
  validateUsername: validateUsername(githubClient),
  getUserProfile: getUserProfile(githubClient),
  testConnection: testConnection(githubClient)
});

// Default export for backwards compatibility
export class GitHubAdapter implements GitHubPort {
  private adapter: GitHubPort;

  constructor(githubClient: GitHubClient) {
    this.adapter = createGitHubAdapter(githubClient);
  }

  async fetchMetrics(username: string, dateFrom?: Date, dateTo?: Date): Promise<Metric[]> {
    return this.adapter.fetchMetrics(username, dateFrom, dateTo);
  }

  async fetchUserData(username: string, dateFrom?: Date, dateTo?: Date): Promise<GitHubMetricsData> {
    return this.adapter.fetchUserData(username, dateFrom, dateTo);
  }

  async validateUsername(username: string): Promise<boolean> {
    return this.adapter.validateUsername(username);
  }

  async getUserProfile(username: string) {
    return this.adapter.getUserProfile(username);
  }

  async testConnection(): Promise<boolean> {
    return this.adapter.testConnection();
  }
}