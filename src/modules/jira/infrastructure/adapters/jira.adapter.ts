import { JiraPort, JiraMetricsData, JiraIssue, JiraWorklog, JiraSprint, JiraTimeMetrics } from '@/modules/jira/application/ports/jira.port';
import { Metric, createMetric, METRIC_SOURCES, METRIC_TYPES } from '@/shared/domain/metric.entity';
import { JiraClient } from './jira-client';

export class JiraAdapter implements JiraPort {
  constructor(private jiraClient: JiraClient) {}

  async fetchMetrics(username: string, dateFrom?: Date, dateTo?: Date): Promise<Metric[]> {
    try {
      const userData = await this.fetchUserData(username, dateFrom, dateTo);
      const metrics: Metric[] = [];

      // Process issues metrics
      metrics.push(...this.createIssueMetrics(username, userData.issues));
      
      // Process worklog metrics
      metrics.push(...this.createWorklogMetrics(username, userData.worklogs));
      
      // Process time-based metrics
      const timeMetrics = await this.calculateTimeMetrics(username, dateFrom, dateTo);
      metrics.push(...this.createTimeMetrics(username, timeMetrics, dateFrom || new Date()));

      return metrics;
    } catch (error) {
      console.error('Error fetching Jira metrics:', error);
      throw new Error(`Failed to fetch Jira metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async fetchUserData(username: string, dateFrom?: Date, dateTo?: Date): Promise<JiraMetricsData> {
    // Build date range conditions for JQL
    const dateConditions: string[] = [];
    if (dateFrom) {
      dateConditions.push(`created >= "${this.jiraClient.formatDateForJQL(dateFrom)}"`);
    }
    if (dateTo) {
      dateConditions.push(`created <= "${this.jiraClient.formatDateForJQL(dateTo)}"`);
    }

    const dateFilter = dateConditions.length > 0 ? ` AND ${dateConditions.join(' AND ')}` : '';

    // Fetch issues assigned to user
    const assignedJQL = `assignee = "${username}"${dateFilter} ORDER BY created DESC`;
    const assignedResponse = await this.jiraClient.searchIssues(assignedJQL, 0, 100, ['changelog']);

    // Fetch issues created by user
    const createdJQL = `reporter = "${username}"${dateFilter} ORDER BY created DESC`;
    const createdResponse = await this.jiraClient.searchIssues(createdJQL, 0, 100, ['changelog']);

    // Combine and deduplicate issues
    const allIssues = [...assignedResponse.issues, ...createdResponse.issues];
    const uniqueIssues = allIssues.filter((issue, index, self) => 
      index === self.findIndex(i => i.id === issue.id)
    );

    const issues: JiraIssue[] = uniqueIssues.map(issue => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      issueType: issue.fields.issuetype.name,
      status: issue.fields.status.name,
      priority: issue.fields.priority?.name || 'None',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      reporter: issue.fields.reporter?.displayName || 'Unknown',
      created: new Date(issue.fields.created),
      updated: new Date(issue.fields.updated),
      resolved: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : undefined,
      storyPoints: issue.fields.customfield_10016 || undefined, // Story points field (may vary)
      project: issue.fields.project.name,
      url: `${this.jiraClient['baseUrl']}/browse/${issue.key}`
    }));

    // Fetch worklogs for each issue
    const worklogs: JiraWorklog[] = [];
    for (const issue of issues) {
      try {
        const worklogResponse = await this.jiraClient.getIssueWorklogs(issue.key);
        const issueWorklogs = worklogResponse.worklogs
          .filter((worklog: any) => worklog.author.displayName === username)
          .map((worklog: any) => ({
            id: worklog.id,
            issueId: issue.id,
            timeSpent: worklog.timeSpentSeconds,
            started: new Date(worklog.started),
            author: worklog.author.displayName,
            description: worklog.comment?.content?.[0]?.content?.[0]?.text || worklog.comment
          }));
        worklogs.push(...issueWorklogs);
      } catch (error) {
        console.warn(`Error fetching worklogs for issue ${issue.key}:`, error);
      }
    }

    // Fetch sprints (if using Agile)
    const sprints: JiraSprint[] = [];
    try {
      // This is a simplified approach - in practice, you'd need to identify relevant boards
      // For now, we'll leave sprints empty or implement board discovery
    } catch (error) {
      console.warn('Error fetching sprints:', error);
    }

    return {
      issues,
      worklogs,
      sprints
    };
  }

  async calculateTimeMetrics(username: string, dateFrom?: Date, dateTo?: Date): Promise<JiraTimeMetrics> {
    const userData = await this.fetchUserData(username, dateFrom, dateTo);
    const completedIssues = userData.issues.filter(issue => issue.resolved);

    if (completedIssues.length === 0) {
      return {
        cycleTime: 0,
        leadTime: 0,
        issueCount: userData.issues.length,
        completedIssueCount: 0,
        storyPointsCompleted: 0
      };
    }

    // Calculate cycle time (from in progress to done) - simplified as resolution time for now
    const cycleTimes = completedIssues.map(issue => {
      if (issue.resolved) {
        return issue.resolved.getTime() - issue.created.getTime();
      }
      return 0;
    }).filter(time => time > 0);

    // Calculate lead time (from creation to completion)
    const leadTimes = completedIssues.map(issue => {
      if (issue.resolved) {
        return issue.resolved.getTime() - issue.created.getTime();
      }
      return 0;
    }).filter(time => time > 0);

    const averageCycleTime = cycleTimes.length > 0 
      ? cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    const averageLeadTime = leadTimes.length > 0
      ? leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    const storyPointsCompleted = completedIssues.reduce((sum, issue) => sum + (issue.storyPoints || 0), 0);

    return {
      cycleTime: averageCycleTime,
      leadTime: averageLeadTime,
      issueCount: userData.issues.length,
      completedIssueCount: completedIssues.length,
      storyPointsCompleted
    };
  }

  async validateUsername(username: string): Promise<boolean> {
    try {
      const users = await this.jiraClient.searchUsers(username);
      return users.some((user: any) => user.displayName === username || user.emailAddress === username);
    } catch {
      return false;
    }
  }

  async getUserProfile(username: string) {
    try {
      const users = await this.jiraClient.searchUsers(username);
      return users.find((user: any) => user.displayName === username || user.emailAddress === username) || null;
    } catch {
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    return this.jiraClient.testConnection();
  }

  async getIssuesAssignedToUser(username: string, dateFrom?: Date, dateTo?: Date): Promise<JiraIssue[]> {
    const userData = await this.fetchUserData(username, dateFrom, dateTo);
    return userData.issues.filter(issue => issue.assignee === username);
  }

  async getIssuesCreatedByUser(username: string, dateFrom?: Date, dateTo?: Date): Promise<JiraIssue[]> {
    const userData = await this.fetchUserData(username, dateFrom, dateTo);
    return userData.issues.filter(issue => issue.reporter === username);
  }

  private createIssueMetrics(peerId: string, issues: JiraIssue[]): Metric[] {
    const metrics: Metric[] = [];
    const groupedByDate = this.groupByDate(issues, issue => issue.created);

    Object.entries(groupedByDate).forEach(([date, issueList]) => {
      const timestamp = new Date(date);

      // Count issues by type
      const stories = issueList.filter(issue => issue.issueType === 'Story');
      const bugs = issueList.filter(issue => issue.issueType === 'Bug');
      const tasks = issueList.filter(issue => issue.issueType === 'Task');
      // Group issues by type and resolution status

      if (stories.length > 0) {
        metrics.push(createMetric({
          peerId,
          source: METRIC_SOURCES.JIRA,
          type: METRIC_TYPES.STORIES_COMPLETED,
          value: stories.filter(s => s.resolved).length,
          timestamp,
          metadata: {
            total_stories: stories.length,
            story_points: stories.reduce((sum, story) => sum + (story.storyPoints || 0), 0)
          }
        }));
      }

      if (bugs.length > 0) {
        metrics.push(createMetric({
          peerId,
          source: METRIC_SOURCES.JIRA,
          type: METRIC_TYPES.BUGS_FIXED,
          value: bugs.filter(b => b.resolved).length,
          timestamp,
          metadata: {
            total_bugs: bugs.length
          }
        }));
      }

      if (tasks.length > 0) {
        metrics.push(createMetric({
          peerId,
          source: METRIC_SOURCES.JIRA,
          type: METRIC_TYPES.TASKS_COMPLETED,
          value: tasks.filter(t => t.resolved).length,
          timestamp,
          metadata: {
            total_tasks: tasks.length
          }
        }));
      }
    });

    return metrics;
  }

  private createWorklogMetrics(peerId: string, worklogs: JiraWorklog[]): Metric[] {
    // Group worklogs by date and create time-based metrics
    const groupedByDate = this.groupByDate(worklogs, worklog => worklog.started);
    const metrics: Metric[] = [];

    Object.entries(groupedByDate).forEach(([date, worklogList]) => {
      const timestamp = new Date(date);
      const totalTimeSpent = worklogList.reduce((sum, worklog) => sum + worklog.timeSpent, 0);

      if (totalTimeSpent > 0) {
        // Convert seconds to hours
        const hoursSpent = totalTimeSpent / 3600;

        metrics.push(createMetric({
          peerId,
          source: METRIC_SOURCES.JIRA,
          type: METRIC_TYPES.CYCLE_TIME, // Using as time tracking metric
          value: hoursSpent,
          timestamp,
          metadata: {
            worklogs_count: worklogList.length,
            issues_worked_on: new Set(worklogList.map(w => w.issueId)).size
          }
        }));
      }
    });

    return metrics;
  }

  private createTimeMetrics(peerId: string, timeMetrics: JiraTimeMetrics, timestamp: Date): Metric[] {
    const metrics: Metric[] = [];

    if (timeMetrics.cycleTime > 0) {
      metrics.push(createMetric({
        peerId,
        source: METRIC_SOURCES.JIRA,
        type: METRIC_TYPES.CYCLE_TIME,
        value: timeMetrics.cycleTime,
        timestamp,
        metadata: {
          unit: 'days',
          completed_issues: timeMetrics.completedIssueCount
        }
      }));
    }

    if (timeMetrics.leadTime > 0) {
      metrics.push(createMetric({
        peerId,
        source: METRIC_SOURCES.JIRA,
        type: METRIC_TYPES.LEAD_TIME,
        value: timeMetrics.leadTime,
        timestamp,
        metadata: {
          unit: 'days',
          completed_issues: timeMetrics.completedIssueCount
        }
      }));
    }

    return metrics;
  }

  private groupByDate<T>(items: T[], dateExtractor: (item: T) => Date): Record<string, T[]> {
    return items.reduce((groups, item) => {
      const date = dateExtractor(item).toISOString().split('T')[0]; // YYYY-MM-DD format
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}