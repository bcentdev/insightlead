import { useState, useEffect, useCallback, useMemo } from 'react';
import { jiraService } from '@/modules/jira/infrastructure/services/jira.service';
import { initializeJiraConfig } from '@/modules/jira/infrastructure/services/jira-config.service';
import { getCachedJiraMetrics, cacheJiraMetrics, getPendingJiraRequest, setPendingJiraRequest } from '@/modules/jira/ui/services/metrics-cache.service';

// Types using functional programming approach
type JiraIssueType = 'Bug' | 'Story' | 'Task' | 'Spike' | 'Epic' | string;
type JiraIssueStatus = 'To Do' | 'In Progress' | 'Done' | 'Closed' | string;
type JiraIssuePriority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest' | string;

type JiraMetrics = {
  readonly totalIssues: number;
  readonly storiesCompleted: number;
  readonly bugsFixed: number;
  readonly tasksCompleted: number;
  readonly spikesCompleted: number;
  readonly storyPoints: number;
  readonly avgCycleTime: number;
  readonly avgLeadTime: number;
  readonly issuesByType: readonly IssueTypeCount[];
  readonly issuesByStatus: readonly IssueStatusCount[];
  readonly issuesByPriority: readonly IssuePriorityCount[];
  readonly topContributors: readonly JiraContributor[];
  readonly velocityTrend: readonly VelocityPoint[];
};

type IssueTypeCount = {
  readonly type: JiraIssueType;
  readonly count: number;
  readonly completed: number;
};

type IssueStatusCount = {
  readonly status: JiraIssueStatus;
  readonly count: number;
};

type IssuePriorityCount = {
  readonly priority: JiraIssuePriority;
  readonly count: number;
};

type JiraContributor = {
  readonly assignee: string;
  readonly displayName: string;
  readonly issuesCompleted: number;
  readonly storyPoints: number;
  readonly avgCycleTime: number;
};

type VelocityPoint = {
  readonly date: string;
  readonly completed: number;
  readonly storyPoints: number;
};

type UseJiraMetricsResult = {
  readonly metrics: JiraMetrics | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

// Pure functions
const calculateCycleTime = (createdAt: string, resolvedAt?: string): number => {
  if (!resolvedAt) return 0;
  
  const created = new Date(createdAt);
  const resolved = new Date(resolvedAt);
  const diffInHours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
  return diffInHours / 24; // Return in days
};

const getStoryPoints = (issue: any): number => {
  // Try different ways to extract story points from Jira
  let points = 0;
  
  // Common custom field IDs for story points in Jira
  const storyPointFields = [
    'customfield_10016', // Common in Jira Cloud
    'customfield_10002', // Another common one
    'customfield_10004', // Alternative
    'customfield_10014', // Alternative
    'customfield_10020', // Another possibility
    'customfield_10026', // Another possibility
    'storyPoints' // Direct field if available
  ];
  
  // Check if we have access to fields
  const fields = issue.fields || issue.customFields || issue;
  
  for (const fieldName of storyPointFields) {
    if (fields[fieldName] !== undefined && fields[fieldName] !== null) {
      const fieldValue = fields[fieldName];
      // Handle both numeric values and strings
      points = typeof fieldValue === 'number' ? fieldValue : (Number(fieldValue) || 0);
      if (points > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Story points found for', issue.key, ':', {
            field: fieldName,
            value: fieldValue,
            points: points
          });
        }
        break; // Use the first non-zero value found
      }
    }
  }

  if (process.env.NODE_ENV === 'development' && issue.key) {
    const customFields = fields ? Object.keys(fields).filter(k => k.includes('customfield')) : [];
    console.log('🔍 Story points search for', issue.key, ':', {
      availableCustomFields: customFields,
      searchedFields: storyPointFields.map(f => ({ [f]: fields?.[f] })),
      calculatedPoints: points
    });
  }
  
  return points;
};

const isIssueCompleted = (status: string): boolean => {
  const completedStatuses = ['done', 'closed', 'resolved', 'complete'];
  return completedStatuses.includes(status.toLowerCase());
};

const calculateJiraMetrics = (issues: readonly any[]): JiraMetrics => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Jira Metrics Calculation: Starting with', issues.length, 'issues');
    if (issues.length > 0) {
      console.log('🔍 Sample issue structure:', issues[0]);
      console.log('🔍 All issue statuses:', issues.map(i => i.status));
      console.log('🔍 All issue types:', issues.map(i => i.issueType || i.type));
    }
  }
  
  if (issues.length === 0) {
    return {
      totalIssues: 0,
      storiesCompleted: 0,
      bugsFixed: 0,
      tasksCompleted: 0,
      spikesCompleted: 0,
      storyPoints: 0,
      avgCycleTime: 0,
      avgLeadTime: 0,
      issuesByType: [],
      issuesByStatus: [],
      issuesByPriority: [],
      topContributors: [],
      velocityTrend: []
    };
  }

  const totalIssues = issues.length;
  const completedIssues = issues.filter(issue => {
    const isCompleted = isIssueCompleted(issue.status || '');
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Issue', issue.key, '- Status:', issue.status, '- Completed:', isCompleted);
    }
    return isCompleted;
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Total issues:', totalIssues, '- Completed issues:', completedIssues.length);
  }
  
  // Count by type
  const typeStats = issues.reduce((acc, issue) => {
    // Try different ways to get the issue type
    const type = issue.issueType || issue.type || issue.fields?.issuetype?.name || 'Task';
    const status = issue.status || issue.fields?.status?.name || 'Unknown';
    const isCompleted = isIssueCompleted(status);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Issue type extraction for', issue.key, ':', {
        rawType: issue.issueType,
        fieldsType: issue.fields?.issuetype?.name,
        finalType: type,
        status,
        isCompleted
      });
    }
    
    const existing = acc[type] || { count: 0, completed: 0 };
    return {
      ...acc,
      [type]: {
        count: existing.count + 1,
        completed: existing.completed + (isCompleted ? 1 : 0)
      }
    };
  }, {} as Record<string, { count: number; completed: number }>);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Type stats:', typeStats);
  }

  const issuesByType = Object.entries(typeStats).map(([type, stats]) => ({
    type,
    count: stats.count,
    completed: stats.completed
  }));

  // Count by status
  const statusStats = issues.reduce((acc, issue) => {
    const status = issue.status || issue.fields?.status?.name || 'Unknown';
    const existing = acc[status] || 0;
    return { ...acc, [status]: existing + 1 };
  }, {} as Record<string, number>);

  const issuesByStatus = Object.entries(statusStats).map(([status, count]) => ({
    status,
    count
  }));

  // Count by priority
  const priorityStats = issues.reduce((acc, issue) => {
    const priority = issue.priority || issue.fields?.priority?.name || 'Medium';
    const existing = acc[priority] || 0;
    return { ...acc, [priority]: existing + 1 };
  }, {} as Record<string, number>);

  const issuesByPriority = Object.entries(priorityStats).map(([priority, count]) => ({
    priority,
    count
  }));

  // Calculate specific type counts
  const storiesCompleted = typeStats['Story']?.completed || 0;
  const bugsFixed = typeStats['Bug']?.completed || 0;
  const tasksCompleted = typeStats['Task']?.completed || 0;
  const spikesCompleted = typeStats['Spike']?.completed || 0;

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Calculated counts:', {
      storiesCompleted,
      bugsFixed,
      tasksCompleted,
      spikesCompleted
    });
  }

  // Calculate story points
  const storyPoints = completedIssues.reduce((sum, issue) => {
    const points = getStoryPoints(issue);
    if (process.env.NODE_ENV === 'development' && points > 0) {
      console.log('🔍 Issue', issue.key, 'has', points, 'story points');
    }
    return sum + points;
  }, 0);

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Total story points:', storyPoints);
  }

  // Calculate cycle times
  const completedIssuesWithTimes = completedIssues.filter(issue => 
    issue.createdAt && issue.resolvedAt
  );
  
  const avgCycleTime = completedIssuesWithTimes.length > 0
    ? completedIssuesWithTimes.reduce((sum, issue) => {
        return sum + calculateCycleTime(issue.createdAt, issue.resolvedAt);
      }, 0) / completedIssuesWithTimes.length
    : 0;

  const avgLeadTime = avgCycleTime; // For now, same as cycle time

  // Calculate top contributors
  const contributorStats = issues.reduce((acc, issue) => {
    // Get assignee info from multiple possible sources
    let assignee = 'unassigned';
    let displayName = 'Unassigned';
    
    // Try different ways to get assignee information
    if (issue.assignee) {
      assignee = issue.assignee.accountId || issue.assignee.displayName || 'unassigned';
      displayName = issue.assignee.displayName || assignee;
    } else if (issue.assigneeDisplayName) {
      assignee = issue.assigneeDisplayName;
      displayName = issue.assigneeDisplayName;
    } else if (issue.fields?.assignee) {
      assignee = issue.fields.assignee.accountId || issue.fields.assignee.displayName || 'unassigned';
      displayName = issue.fields.assignee.displayName || assignee;
    }
    
    // Get status from multiple sources
    const status = issue.status || issue.fields?.status?.name || 'Unknown';
    const isCompleted = isIssueCompleted(status);
    const points = isCompleted ? getStoryPoints(issue) : 0;
    const cycleTime = isCompleted && issue.createdAt && issue.resolvedAt 
      ? calculateCycleTime(issue.createdAt, issue.resolvedAt) 
      : 0;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Processing contributor for', issue.key, ':', {
        rawAssignee: issue.assignee,
        fieldsAssignee: issue.fields?.assignee,
        assigneeDisplayName: issue.assigneeDisplayName,
        finalAssigneeId: assignee,
        finalDisplayName: displayName,
        isCompleted,
        points,
        cycleTime,
        status: status,
        type: issue.issueType || issue.type || issue.fields?.issuetype?.name
      });
    }

    const existing = acc[assignee] || { 
      displayName, 
      issuesCompleted: 0, 
      storyPoints: 0, 
      totalCycleTime: 0, 
      completedCount: 0 
    };
    
    return {
      ...acc,
      [assignee]: {
        displayName,
        issuesCompleted: existing.issuesCompleted + (isCompleted ? 1 : 0),
        storyPoints: existing.storyPoints + points,
        totalCycleTime: existing.totalCycleTime + cycleTime,
        completedCount: existing.completedCount + (isCompleted && cycleTime > 0 ? 1 : 0)
      }
    };
  }, {} as Record<string, any>);

  const topContributors = Object.entries(contributorStats)
    .map(([assignee, stats]) => ({
      assignee,
      displayName: stats.displayName,
      issuesCompleted: stats.issuesCompleted,
      storyPoints: stats.storyPoints,
      avgCycleTime: stats.completedCount > 0 ? stats.totalCycleTime / stats.completedCount : 0
    }))
    .sort((a, b) => b.issuesCompleted - a.issuesCompleted)
    .slice(0, 10);

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Final contributor stats:', contributorStats);
    console.log('🔍 Top contributors:', topContributors);
  }

  // Calculate velocity trend (simplified - by day)
  const velocityByDay = completedIssues.reduce((acc, issue) => {
    if (!issue.resolvedAt) return acc;
    
    const date = new Date(issue.resolvedAt).toISOString().split('T')[0];
    const points = getStoryPoints(issue);
    
    const existing = acc[date] || { completed: 0, storyPoints: 0 };
    return {
      ...acc,
      [date]: {
        completed: existing.completed + 1,
        storyPoints: existing.storyPoints + points
      }
    };
  }, {} as Record<string, { completed: number; storyPoints: number }>);

  const velocityTrend = Object.entries(velocityByDay)
    .map(([date, stats]) => ({
      date,
      completed: stats.completed,
      storyPoints: stats.storyPoints
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14); // Last 14 days

  const finalMetrics = {
    totalIssues,
    storiesCompleted,
    bugsFixed,
    tasksCompleted,
    spikesCompleted,
    storyPoints,
    avgCycleTime,
    avgLeadTime,
    issuesByType,
    issuesByStatus,
    issuesByPriority,
    topContributors,
    velocityTrend
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Final calculated metrics:', finalMetrics);
  }

  return finalMetrics;
};

export const useJiraMetrics = (
  projectKey: string,
  assigneeIds: readonly string[],
  days: number = 30
): UseJiraMetricsResult => {
  const [metrics, setMetrics] = useState<JiraMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memorize assigneeIds to prevent unnecessary re-renders and add throttling
  const stableAssigneeIds = useMemo(() => assigneeIds, [JSON.stringify(assigneeIds)]);
  
  // Only allow fetching every 2 seconds to prevent spam
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const FETCH_THROTTLE_MS = 2000;

  const fetchMetrics = useCallback(async () => {
    const now = Date.now();
    
    // Throttle: prevent excessive API calls
    if (now - lastFetchTime < FETCH_THROTTLE_MS) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 Jira Metrics Hook: Throttled, skipping fetch');
      }
      return;
    }
    
    if (!projectKey || stableAssigneeIds.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 Jira Metrics Hook: Missing project key or assignee IDs, skipping fetch');
        console.log('🐛 Jira Metrics Hook: Project key:', projectKey);
        console.log('🐛 Jira Metrics Hook: Assignee IDs:', stableAssigneeIds);
      }
      setMetrics(null);
      return;
    }
    
    setLastFetchTime(now);

    // Verificar cache primero
    const cachedData = getCachedJiraMetrics(projectKey, stableAssigneeIds, days);
    if (cachedData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 Jira Metrics Hook: Using cached data for:', projectKey, stableAssigneeIds);
      }
      setMetrics(cachedData);
      return;
    }

    // Verificar si hay una solicitud pendiente para los mismos datos
    const pendingRequest = getPendingJiraRequest(projectKey, stableAssigneeIds, days);
    if (pendingRequest) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 Jira Metrics Hook: Waiting for pending request for:', projectKey, stableAssigneeIds);
      }
      setIsLoading(true);
      try {
        const result = await pendingRequest;
        setMetrics(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Jira metrics';
        setError(errorMessage);
        setMetrics(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await initializeJiraConfig();
      
      if (!jiraService.isConfigured()) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🐛 Jira Metrics Hook: Jira service not configured');
        }
        setError('Jira service not configured');
        setMetrics(null);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 Jira Metrics Hook: Fetching NEW data for project:', projectKey);
        console.log('🐛 Jira Metrics Hook: Assignee IDs:', stableAssigneeIds);
        console.log('🐛 Jira Metrics Hook: Days:', days);
      }

      // Crear y registrar la promesa para evitar duplicados
      const fetchPromise = jiraService.fetchTeamIssues(projectKey, [...stableAssigneeIds], days)
        .then(issues => {
          const calculatedMetrics = calculateJiraMetrics(issues);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🐛 Jira Metrics Hook: Issues received and cached:', {
              issuesLength: issues.length,
              calculatedMetrics: calculatedMetrics
            });
          }
          
          return calculatedMetrics;
        });
      
      setPendingJiraRequest(projectKey, stableAssigneeIds, days, fetchPromise);
      const calculatedMetrics = await fetchPromise;
      
      // Guardar en cache
      cacheJiraMetrics(projectKey, stableAssigneeIds, days, calculatedMetrics);
      setMetrics(calculatedMetrics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Jira metrics';
      if (process.env.NODE_ENV === 'development') {
        console.error('🐛 Jira Metrics Hook: Error fetching metrics:', errorMessage);
      }
      setError(errorMessage);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectKey, stableAssigneeIds, days]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics
  };
};