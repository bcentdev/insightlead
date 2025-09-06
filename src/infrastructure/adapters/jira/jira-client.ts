// Types using functional programming approach
type JiraConfig = {
  readonly baseUrl: string;
  readonly email: string;
  readonly apiToken: string;
  readonly cloudId?: string; // Required for GraphQL API
};

type JiraIssue = {
  readonly id: string;
  readonly key: string;
  readonly summary: string;
  readonly description: string | null;
  readonly status: string;
  readonly issueType: string;
  readonly priority: string;
  readonly assignee: JiraUser | null;
  readonly reporter: JiraUser | null;
  readonly created: string;
  readonly updated: string;
  readonly resolved: string | null;
  readonly project: JiraProject;
  readonly labels: readonly string[];
};

type JiraUser = {
  readonly accountId: string;
  readonly displayName: string;
  readonly emailAddress: string;
  readonly avatarUrls: JiraAvatarUrls;
};

type JiraAvatarUrls = {
  readonly '48x48': string;
  readonly '24x24': string;
  readonly '16x16': string;
  readonly '32x32': string;
};

type JiraProject = {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly avatarUrls?: {
    readonly '48x48'?: string;
    readonly '32x32'?: string;
    readonly '24x24'?: string;
    readonly '16x16'?: string;
  };
  readonly projectTypeKey?: string;
  readonly description?: string;
};

type JiraIssueSearchResult = {
  readonly issues: readonly JiraIssue[];
  readonly total: number;
  readonly maxResults: number;
  readonly startAt: number;
};

// Pure functions for JQL query building
const escapeJqlValue = (value: string): string => {
  // If the value contains special characters, wrap it in quotes and escape internal quotes
  if (/[@\s"'<>=!~()[\]{}+\-*/%&|^]/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
};

const buildJqlQuery = (
  projectKey: string,
  assigneeId: string,
  daysBack: number = 30
): string => {
  const dateFilter = `-${daysBack}d`;
  const escapedAssignee = escapeJqlValue(assigneeId);
  const escapedProject = escapeJqlValue(projectKey);
  
  const jql = [
    `project = ${escapedProject}`,
    `AND assignee WAS ${escapedAssignee} DURING (${dateFilter}, now())`,
    `AND updated >= ${dateFilter}`,
    `AND issuetype IN (Bug, standardIssueTypes(), Spike)`,
    'ORDER BY updated DESC'
  ].join(' ');
  
  console.log('🔍 JQL Query built:', jql);
  console.log('📧 Original assignee:', assigneeId, '→ Escaped:', escapedAssignee);
  
  return jql;
};

const buildTeamJqlQuery = (
  projectKey: string,
  assigneeIds: readonly string[],
  daysBack: number = 30
): string => {
  const dateFilter = `-${daysBack}d`;
  const escapedProject = escapeJqlValue(projectKey);
  
  // Crear la condición para múltiples assignees
  const assigneeConditions = assigneeIds
    .map(assigneeId => `assignee WAS ${escapeJqlValue(assigneeId)} DURING (${dateFilter}, now())`)
    .join(' OR ');
  
  const jql = [
    `project = ${escapedProject}`,
    `AND (${assigneeConditions})`,
    `AND updated >= ${dateFilter}`,
    `AND issuetype IN (Bug, standardIssueTypes(), Spike)`,
    'ORDER BY updated DESC'
  ].join(' ');
  
  console.log('🔍 Team JQL Query built:', jql);
  console.log('📧 Assignee IDs:', assigneeIds);
  
  return jql;
};

const buildAuthHeader = (email: string, apiToken: string): string =>
  `Basic ${btoa(`${email}:${apiToken}`)}`;

const buildRequestHeaders = (config: JiraConfig): Record<string, string> => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-Jira-Token': config.apiToken,
  'X-Jira-Email': config.email
});

const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

// GraphQL-like query using Jira REST API with JQL
const buildSearchQuery = (jql: string, maxResults: number = 50): string => {
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
  
  return searchParams.toString();
};

// API functions using functional composition
const makeRequest = (config: JiraConfig) => async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  // Use proxy in development, direct calls in production
  const isDevelopment = import.meta.env.DEV;
  const baseUrl = isDevelopment ? '/api/jira' : normalizeBaseUrl(config.baseUrl);
  const url = isDevelopment 
    ? `${baseUrl}/rest/api/3${endpoint}`
    : `${baseUrl}/rest/api/3${endpoint}`;
  
  const headers = buildRequestHeaders(config);
  
  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers }
  });
  
  if (!response.ok) {
    throw new Error(`Jira API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
};

const fetchProjects = (config: JiraConfig) => async (): Promise<readonly JiraProject[]> => {
  const request = makeRequest(config);
  const response = await request('/project');
  const data = await response.json() as readonly any[];
  
  return data.map(project => ({
    id: project.id,
    key: project.key,
    name: project.name,
    avatarUrls: project.avatarUrls || undefined,
    projectTypeKey: project.projectTypeKey || undefined,
    description: project.description || undefined
  }));
};

const searchIssues = (config: JiraConfig) => async (
  jql: string,
  maxResults: number = 50
): Promise<JiraIssueSearchResult> => {
  const request = makeRequest(config);
  const queryString = buildSearchQuery(jql, maxResults);
  const response = await request(`/search?${queryString}`);
  const data = await response.json() as any;
  
  return {
    issues: data.issues.map((issue: any) => transformIssue(issue)),
    total: data.total,
    maxResults: data.maxResults,
    startAt: data.startAt
  };
};

const fetchUserIssues = (config: JiraConfig) => async (
  projectKey: string,
  assigneeId: string,
  daysBack: number = 30
): Promise<readonly JiraIssue[]> => {
  const jql = buildJqlQuery(projectKey, assigneeId, daysBack);
  const searchResults = await searchIssues(config)(jql);
  return searchResults.issues;
};

const fetchTeamIssues = (config: JiraConfig) => async (
  projectKey: string,
  assigneeIds: readonly string[],
  daysBack: number = 30
): Promise<readonly JiraIssue[]> => {
  if (assigneeIds.length === 0) {
    return [];
  }
  
  const jql = buildTeamJqlQuery(projectKey, assigneeIds, daysBack);
  const searchResults = await searchIssues(config)(jql);
  return searchResults.issues;
};

const getUser = (config: JiraConfig) => async (accountId: string): Promise<JiraUser | null> => {
  try {
    const request = makeRequest(config);
    const response = await request(`/user?accountId=${accountId}`);
    const userData = await response.json() as any;
    return transformUser(userData);
  } catch {
    return null;
  }
};

const searchUsers = (config: JiraConfig) => async (query: string): Promise<readonly JiraUser[]> => {
  try {
    const request = makeRequest(config);
    const response = await request(`/user/search?query=${encodeURIComponent(query)}`);
    const usersData = await response.json() as readonly any[];
    return usersData.map(transformUser);
  } catch {
    return [];
  }
};

// Transform functions
const transformIssue = (rawIssue: any): JiraIssue => {
  // Los datos vienen con la estructura: { id, key, fields: { ... } }
  const fields = rawIssue.fields;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Raw Jira issue structure:', {
      id: rawIssue.id,
      key: rawIssue.key,
      fieldsKeys: Object.keys(fields),
      status: fields.status,
      issuetype: fields.issuetype,
      assignee: fields.assignee,
      priority: fields.priority,
      created: fields.created,
      resolutiondate: fields.resolutiondate
    });
  }
  
  const transformed: JiraIssue & any = {
    id: rawIssue.id,
    key: rawIssue.key,
    summary: fields.summary,
    description: fields.description?.content?.[0]?.content?.[0]?.text || null,
    status: fields.status?.name || 'Unknown',
    issueType: fields.issuetype?.name || 'Task',
    priority: fields.priority?.name || 'Medium',
    assignee: fields.assignee ? transformUser(fields.assignee) : null,
    reporter: fields.reporter ? transformUser(fields.reporter) : null,
    created: fields.created,
    updated: fields.updated,
    resolved: fields.resolutiondate,
    project: {
      id: fields.project?.id || '',
      key: fields.project?.key || '',
      name: fields.project?.name || ''
    },
    labels: fields.labels || [],
    
    // Campos adicionales necesarios para cálculo de métricas
    createdAt: fields.created,
    resolvedAt: fields.resolutiondate,
    assigneeDisplayName: fields.assignee?.displayName || null,
    
    // Incluir todos los fields para acceso a custom fields de story points
    fields: fields
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Transformed Jira issue:', {
      key: transformed.key,
      status: transformed.status,
      issueType: transformed.issueType,
      priority: transformed.priority,
      created: transformed.created,
      resolved: transformed.resolved,
      assignee: transformed.assignee?.displayName || 'Unassigned',
      assigneeDisplayName: transformed.assigneeDisplayName
    });
  }

  return transformed;
};

const transformUser = (rawUser: any): JiraUser => {
  const user = {
    accountId: rawUser.accountId || '',
    displayName: rawUser.displayName || rawUser.name || 'Unknown User',
    emailAddress: rawUser.emailAddress || rawUser.email || '',
    avatarUrls: {
      '48x48': rawUser.avatarUrls?.['48x48'] || '',
      '24x24': rawUser.avatarUrls?.['24x24'] || '',
      '16x16': rawUser.avatarUrls?.['16x16'] || '',
      '32x32': rawUser.avatarUrls?.['32x32'] || ''
    }
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Transformed user:', {
      accountId: user.accountId,
      displayName: user.displayName,
      emailAddress: user.emailAddress
    });
  }

  return user;
};

// Test connection function
const testConnection = (config: JiraConfig) => async (): Promise<boolean> => {
  try {
    const request = makeRequest(config);
    await request('/myself');
    return true;
  } catch {
    return false;
  }
};

// Helper functions for JQL building (pure functions)
const buildJqlConditions = (conditions: Record<string, any>): string => {
  const jqlParts: string[] = [];

  Object.entries(conditions).forEach(([field, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          const escapedValues = value.map(v => escapeJqlValue(String(v)));
          jqlParts.push(`${field} IN (${escapedValues.join(', ')})`);
        }
      } else if (typeof value === 'string') {
        jqlParts.push(`${field} = ${escapeJqlValue(value)}`);
      } else {
        jqlParts.push(`${field} = ${value}`);
      }
    }
  });

  return jqlParts.join(' AND ');
};

const formatDateForJQL = (date: Date): string =>
  date.toISOString().split('T')[0]; // YYYY-MM-DD format

// Factory function to create Jira client
export const createJiraClient = (config: JiraConfig) => ({
  fetchProjects: fetchProjects(config),
  searchIssues: searchIssues(config),
  fetchUserIssues: fetchUserIssues(config),
  fetchTeamIssues: fetchTeamIssues(config),
  getUser: getUser(config),
  searchUsers: searchUsers(config),
  testConnection: testConnection(config),
  buildJqlConditions,
  formatDateForJQL,
  escapeJqlValue
});

// Backward compatibility - class-based wrapper
export class JiraClient {
  private client: ReturnType<typeof createJiraClient>;

  constructor(config: JiraConfig) {
    this.client = createJiraClient(config);
  }

  async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }

  async getUser(accountId: string) {
    return this.client.getUser(accountId);
  }

  async searchUsers(query: string) {
    return this.client.searchUsers(query);
  }

  async searchIssues(jql: string, startAt = 0, maxResults = 100, expand?: string[]) {
    const result = await this.client.searchIssues(jql, maxResults);
    return {
      ...result,
      startAt,
      expand
    };
  }

  async getProjects() {
    return this.client.fetchProjects();
  }

  buildJQL(conditions: Record<string, any>): string {
    return this.client.buildJqlConditions(conditions);
  }

  formatDateForJQL(date: Date): string {
    return this.client.formatDateForJQL(date);
  }
}

// Export utility functions
export { escapeJqlValue };

// Export types
export type {
  JiraConfig,
  JiraIssue,
  JiraUser,
  JiraProject,
  JiraIssueSearchResult
};