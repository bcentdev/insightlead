import { githubService } from '@/modules/github/infrastructure/services/github.service';
import { jiraService } from '@/modules/jira/infrastructure/services/jira.service';
import { initializeJiraConfig } from '@/modules/jira/infrastructure/services/jira-config.service';

// Types for real metrics
export type PeerMetrics = {
  readonly pullRequests: number;
  readonly codeReviews: number;
  readonly storiesCompleted: number;
  readonly comments: number;
  readonly lastActive: Date;
};

export type TeamMetrics = {
  readonly githubMetrics: Map<string, Partial<PeerMetrics>>;
  readonly jiraMetrics: Map<string, Partial<PeerMetrics>>;
  readonly timestamp: number;
};

// Cache to avoid repeated API calls - now caches team-wide metrics
const teamMetricsCache = new Map<string, TeamMetrics>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const isValidCacheEntry = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Fetch metrics for entire team with single API calls
export const fetchTeamMetrics = async (
  githubUsernames: string[],
  jiraUsernames: string[],
  teamJiraProject?: string
): Promise<TeamMetrics> => {
  const cacheKey = `team-${githubUsernames.join(',')}-${jiraUsernames.join(',')}-${teamJiraProject || 'no-project'}`;
  
  // Check cache first
  const cached = teamMetricsCache.get(cacheKey);
  if (cached && isValidCacheEntry(cached.timestamp)) {
    return cached;
  }

  try {
    const [githubMetrics, jiraMetrics] = await Promise.allSettled([
      fetchTeamGitHubMetrics(githubUsernames),
      fetchTeamJiraMetrics(jiraUsernames, teamJiraProject)
    ]);

    const teamMetrics: TeamMetrics = {
      githubMetrics: githubMetrics.status === 'fulfilled' ? githubMetrics.value : new Map(),
      jiraMetrics: jiraMetrics.status === 'fulfilled' ? jiraMetrics.value : new Map(),
      timestamp: Date.now()
    };

    // Cache the result
    teamMetricsCache.set(cacheKey, teamMetrics);
    
    return teamMetrics;
  } catch (error) {
    console.error('Error fetching team metrics:', error);
    return {
      githubMetrics: new Map(),
      jiraMetrics: new Map(),
      timestamp: Date.now()
    };
  }
};

// Get individual peer metrics from team metrics
export const getPeerMetricsFromTeam = (
  teamMetrics: TeamMetrics,
  githubUsername?: string,
  jiraUsername?: string
): PeerMetrics => {
  const defaultMetrics: PeerMetrics = {
    pullRequests: 0,
    codeReviews: 0,
    storiesCompleted: 0,
    comments: 0,
    lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  };

  const githubData = githubUsername ? teamMetrics.githubMetrics.get(githubUsername) : null;
  const jiraData = jiraUsername ? teamMetrics.jiraMetrics.get(jiraUsername) : null;

  return {
    pullRequests: githubData?.pullRequests || 0,
    codeReviews: githubData?.codeReviews || 0,
    comments: githubData?.comments || 0,
    storiesCompleted: jiraData?.storiesCompleted || 0,
    lastActive: githubData?.lastActive || defaultMetrics.lastActive
  };
};

// Fetch GitHub metrics for entire team with single GraphQL call
const fetchTeamGitHubMetrics = async (githubUsernames: string[]): Promise<Map<string, Partial<PeerMetrics>>> => {
  const metricsMap = new Map<string, Partial<PeerMetrics>>();
  
  if (githubUsernames.length === 0) {
    return metricsMap;
  }

  try {
    // Check if GitHub service has token
    if (!githubService.hasToken()) {
      console.warn('GitHub service not configured, skipping team metrics fetch');
      return metricsMap;
    }

    // Use the existing team PR fetch (GraphQL optimized)
    const teamPRData = await githubService.fetchTeamPullRequests(githubUsernames, 30);
    
    // Group PRs by author and calculate metrics
    const prsByAuthor = new Map<string, any[]>();
    teamPRData.pullRequests.forEach(pr => {
      const author = pr.user?.login || pr.author;
      if (author && githubUsernames.includes(author)) {
        if (!prsByAuthor.has(author)) {
          prsByAuthor.set(author, []);
        }
        prsByAuthor.get(author)!.push(pr);
      }
    });

    // Calculate metrics for each team member
    for (const username of githubUsernames) {
      const userPRs = prsByAuthor.get(username) || [];
      const pullRequests = userPRs.length;
      const codeReviews = userPRs.filter(pr => pr.state === 'merged').length;
      
      // Calculate last active from most recent PR
      const lastActive = userPRs.length > 0 
        ? new Date(Math.max(...userPRs.map(pr => new Date(pr.updated_at || pr.created_at).getTime())))
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // For comments, we'd need individual calls, so for now use a reasonable approximation
      const comments = pullRequests * 2; // Rough estimate: 2 comments per PR

      metricsMap.set(username, {
        pullRequests,
        codeReviews,
        comments,
        lastActive
      });
    }

    console.log(`📊 GitHub team metrics fetched for ${githubUsernames.length} members`);
    return metricsMap;
  } catch (error) {
    console.error('Error fetching GitHub team metrics:', error);
    return metricsMap;
  }
};

// Fetch Jira metrics for entire team with single API call
const fetchTeamJiraMetrics = async (jiraUsernames: string[], projectKey?: string): Promise<Map<string, Partial<PeerMetrics>>> => {
  const metricsMap = new Map<string, Partial<PeerMetrics>>();
  
  if (jiraUsernames.length === 0 || !projectKey) {
    return metricsMap;
  }

  try {
    // Initialize Jira config if not already done
    await initializeJiraConfig();

    // Check if Jira service is configured
    if (!jiraService.isConfigured()) {
      console.warn('Jira service not configured, skipping team metrics fetch');
      return metricsMap;
    }

    // Fetch issues for all team members in a single call
    const teamIssues = await jiraService.fetchTeamIssues(projectKey, jiraUsernames, 30);
    
    // Group issues by assignee and calculate metrics
    const issuesByAssignee = new Map<string, any[]>();
    teamIssues.forEach(issue => {
      // Handle assignee being either string or JiraUser object
      const assigneeKey = typeof issue.assignee === 'string' 
        ? issue.assignee 
        : issue.assignee?.accountId || issue.assignee?.emailAddress || '';
      
      if (assigneeKey && jiraUsernames.includes(assigneeKey)) {
        if (!issuesByAssignee.has(assigneeKey)) {
          issuesByAssignee.set(assigneeKey, []);
        }
        issuesByAssignee.get(assigneeKey)!.push(issue);
      }
    });

    // Calculate metrics for each team member
    for (const username of jiraUsernames) {
      const userIssues = issuesByAssignee.get(username) || [];
      
      // Count completed stories (resolved or done status)
      const storiesCompleted = userIssues.filter(issue => 
        issue.status && (
          issue.status.toLowerCase().includes('done') ||
          issue.status.toLowerCase().includes('resolved') ||
          issue.status.toLowerCase().includes('closed')
        )
      ).length;

      metricsMap.set(username, {
        storiesCompleted
      });
    }

    console.log(`📊 Jira team metrics fetched for ${jiraUsernames.length} members in project ${projectKey}`);
    return metricsMap;
  } catch (error) {
    console.error('Error fetching Jira team metrics:', error);
    return metricsMap;
  }
};

// Clear cache function for testing or manual refresh
export const clearMetricsCache = (): void => {
  teamMetricsCache.clear();
};

// Get cache stats for debugging
export const getCacheStats = () => ({
  size: teamMetricsCache.size,
  entries: Array.from(teamMetricsCache.entries()).map(([key, value]) => ({
    key,
    timestamp: value.timestamp,
    age: Date.now() - value.timestamp
  }))
});