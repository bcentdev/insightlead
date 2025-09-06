// Jira Proxy Service for handling CORS issues in development
import type { JiraConfig, JiraProject, JiraIssue } from './jira-client';

type ProxyConfig = {
  readonly baseUrl: string;
  readonly email: string;
  readonly apiToken: string;
};

// Development-only proxy functions
const makeProxyRequest = async (
  endpoint: string,
  config: ProxyConfig,
  options: RequestInit = {}
): Promise<Response> => {
  const proxyUrl = `/api/jira${endpoint}`;
  
  const response = await fetch(proxyUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Jira-Token': config.apiToken,
      'X-Jira-Email': config.email,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`Jira proxy request failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
};

const fetchProjectsViaProxy = async (config: ProxyConfig): Promise<readonly JiraProject[]> => {
  try {
    const response = await makeProxyRequest('/rest/api/3/project', config);
    const data = await response.json() as readonly any[];
    
    return data.map(project => ({
      id: project.id,
      key: project.key,
      name: project.name,
      avatarUrls: project.avatarUrls || undefined,
      projectTypeKey: project.projectTypeKey || undefined,
      description: project.description || undefined
    }));
  } catch (error) {
    console.error('Failed to fetch projects via proxy:', error);
    throw error;
  }
};

const searchIssuesViaProxy = async (
  config: ProxyConfig,
  jql: string,
  maxResults: number = 50
): Promise<{ issues: readonly JiraIssue[], total: number }> => {
  try {
    const searchParams = new URLSearchParams({
      jql,
      maxResults: maxResults.toString(),
      fields: [
        'id',
        'key',
        'summary',
        'description',
        'status',
        'issuetype',
        'priority',
        'assignee',
        'reporter',
        'created',
        'updated',
        'resolutiondate',
        'project',
        'labels'
      ].join(',')
    });
    
    const response = await makeProxyRequest(`/rest/api/3/search?${searchParams}`, config);
    const data = await response.json() as any;
    
    return {
      issues: data.issues.map(transformIssue),
      total: data.total
    };
  } catch (error) {
    console.error('Failed to search issues via proxy:', error);
    throw error;
  }
};

const testConnectionViaProxy = async (config: ProxyConfig): Promise<boolean> => {
  try {
    await makeProxyRequest('/rest/api/3/myself', config);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

// Transform functions (same as in jira-client.ts)
const transformIssue = (rawIssue: any): JiraIssue => ({
  id: rawIssue.id,
  key: rawIssue.key,
  summary: rawIssue.fields.summary,
  description: rawIssue.fields.description?.content?.[0]?.content?.[0]?.text || null,
  status: rawIssue.fields.status.name,
  issueType: rawIssue.fields.issuetype.name,
  priority: rawIssue.fields.priority?.name || 'None',
  assignee: rawIssue.fields.assignee ? transformUser(rawIssue.fields.assignee) : null,
  reporter: rawIssue.fields.reporter ? transformUser(rawIssue.fields.reporter) : null,
  created: rawIssue.fields.created,
  updated: rawIssue.fields.updated,
  resolved: rawIssue.fields.resolutiondate,
  project: {
    id: rawIssue.fields.project.id,
    key: rawIssue.fields.project.key,
    name: rawIssue.fields.project.name
  },
  labels: rawIssue.fields.labels || []
});

const transformUser = (rawUser: any) => ({
  accountId: rawUser.accountId,
  displayName: rawUser.displayName,
  emailAddress: rawUser.emailAddress || '',
  avatarUrls: {
    '48x48': rawUser.avatarUrls?.['48x48'] || '',
    '24x24': rawUser.avatarUrls?.['24x24'] || '',
    '16x16': rawUser.avatarUrls?.['16x16'] || '',
    '32x32': rawUser.avatarUrls?.['32x32'] || ''
  }
});

// Fallback service for when proxy fails
// JQL escape function (same as in jira-client.ts)
const escapeJqlValue = (value: string): string => {
  // If the value contains special characters, wrap it in quotes and escape internal quotes
  if (/[@\s"'<>=!~()[\]{}+\-*/%&|^]/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
};

export const createJiraProxyService = (config: JiraConfig) => ({
  fetchProjects: () => fetchProjectsViaProxy(config),
  searchIssues: (jql: string, maxResults?: number) => searchIssuesViaProxy(config, jql, maxResults),
  testConnection: () => testConnectionViaProxy(config),
  fetchUserIssues: async (projectKey: string, assigneeId: string, daysBack: number = 30) => {
    const escapedProject = escapeJqlValue(projectKey);
    const escapedAssignee = escapeJqlValue(assigneeId);
    
    const jql = [
      `project = ${escapedProject}`,
      `AND assignee WAS ${escapedAssignee} DURING (-${daysBack}d, now())`,
      `AND updated >= -${daysBack}d`,
      `AND issuetype IN (Bug, standardIssueTypes(), Spike)`,
      'ORDER BY updated DESC'
    ].join(' ');
    
    console.log('🔍 JQL Query built (proxy):', jql);
    console.log('📧 Original assignee:', assigneeId, '→ Escaped:', escapedAssignee);
    
    const result = await searchIssuesViaProxy(config, jql);
    return result.issues;
  }
});

export type { ProxyConfig };