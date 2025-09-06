// Types using functional programming approach
type JiraGraphQLConfig = {
  readonly baseUrl: string;
  readonly email: string;
  readonly apiToken: string;
  readonly cloudId?: string; // Optional for GraphQL API
};

type JiraIssueGraphQL = {
  readonly id: string;
  readonly key: string;
  readonly summary: string;
  readonly description: string | null;
  readonly status: string;
  readonly issueType: string;
  readonly priority: string;
  readonly assignee: JiraUserGraphQL | null;
  readonly reporter: JiraUserGraphQL | null;
  readonly created: string;
  readonly updated: string;
  readonly resolved: string | null;
  readonly project: JiraProjectGraphQL;
  readonly labels: readonly string[];
  readonly customFields: Record<string, any>;
  // Additional fields for metrics calculation
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly assigneeDisplayName: string | null;
  readonly fields: Record<string, any>;
};

type JiraUserGraphQL = {
  readonly accountId: string;
  readonly displayName: string;
  readonly emailAddress: string;
  readonly avatarUrl: string;
};

type JiraProjectGraphQL = {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly avatarUrl?: string;
};

type GraphQLResponse<T> = {
  readonly data: T;
  readonly errors?: readonly GraphQLError[];
};

type GraphQLError = {
  readonly message: string;
  readonly path?: readonly (string | number)[];
};

// GraphQL queries - Starting with cloud ID discovery
const GET_CLOUD_ID_QUERY = `
  query GetCloudId($hostNames: [String!]!) {
    tenantContexts(hostNames: $hostNames) {
      cloudId
    }
  }
`;

const GET_PROJECTS_QUERY = `
  query GetProjects($cloudId: ID!) {
    jira {
      allJiraProjects(cloudId: $cloudId, first: 50, filter: {}) {
        edges {
          node {
            id
            key
            name
          }
        }
      }
    }
  }
`;

const GET_TEAM_ISSUES_QUERY = `
  query GetTeamIssues($cloudId: ID!, $jql: String!) {
    jira {
      issueSearchStable(
        cloudId: $cloudId,
        issueSearchInput: {
          jql: $jql
        }
      ) {
        edges {
          node {
            id
            key
            summary
          }
        }
        totalCount
      }
    }
  }
`;

const GET_USER_QUERY = `
  query GetUser($cloudId: ID!, $accountId: String!) {
    jira {
      user(cloudId: $cloudId, accountId: $accountId) {
        accountId
        displayName
      }
    }
  }
`;

// Introspection query to discover JiraIssue fields
const INTROSPECTION_QUERY = `
  query IntrospectJiraIssue {
    __type(name: "JiraIssue") {
      name
      fields {
        name
        description
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
      }
    }
  }
`;

// Pure functions for GraphQL operations
const buildAuthHeader = (email: string, apiToken: string): string =>
  `Basic ${btoa(`${email}:${apiToken}`)}`;

const buildRequestHeaders = (config: JiraGraphQLConfig): Record<string, string> => ({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': buildAuthHeader(config.email, config.apiToken),
  'X-ExperimentalApi': 'true'
});

const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

// GraphQL request function
const makeGraphQLRequest = (config: JiraGraphQLConfig, experimental: boolean = false) => async <T>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> => {
  const isDevelopment = import.meta.env.DEV;
  
  // Use Atlassian GraphQL API as per documentation
  const url = isDevelopment 
    ? `/gateway/api/graphql`
    : `https://api.atlassian.com/gateway/api/graphql`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  // Add experimental header only when needed
  if (experimental) {
    headers['X-ExperimentalApi'] = 'JiraIssueSearch';
    if (process.env.NODE_ENV === 'development') {
      console.log('🔥 EXPERIMENTAL HEADER ADDED:', headers['X-ExperimentalApi']);
    }
  }

  if (isDevelopment) {
    // For development proxy to Atlassian API
    headers['X-Jira-Token'] = config.apiToken;
    headers['X-Jira-Email'] = config.email;
  } else {
    // For production direct to Atlassian API
    headers['Authorization'] = buildAuthHeader(config.email, config.apiToken);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 GraphQL Headers:', headers);
    console.log('🚀 Experimental flag:', experimental);
    console.log('🚀 Has X-ExperimentalApi header:', 'X-ExperimentalApi' in headers);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Making GraphQL request to:', url);
    console.log('🚀 GraphQL Query:', query.substring(0, 200) + '...');
    console.log('🚀 GraphQL Variables:', variables);
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    if (process.env.NODE_ENV === 'development') {
      console.error('🚀 GraphQL request failed:', response.status, response.statusText, errorText);
    }
    throw new Error(`Jira GraphQL request failed: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json() as GraphQLResponse<T>;
  
  if (result.errors && result.errors.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🚀 GraphQL errors:', result.errors);
    }
    throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
  }
  
  return result.data;
};

// Transform functions for GraphQL responses
const transformGraphQLIssue = (rawIssue: any, assigneeIds: readonly string[] = []): JiraIssueGraphQL => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Raw GraphQL issue structure:', {
      id: rawIssue.id,
      key: rawIssue.key,
      summary: rawIssue.summary
    });
    console.log('🔍 Available assignee IDs for issue', rawIssue.key, ':', assigneeIds);
  }

  // Generate realistic mock data for testing
  const mockTypes = ['Story', 'Bug', 'Task', 'Spike'];
  const mockStatuses = ['Done', 'In Progress', 'To Do', 'Closed'];
  const mockPriorities = ['High', 'Medium', 'Low'];
  
  // Use actual team member assignee IDs when available, otherwise use mock data
  const actualAssignees = assigneeIds.length > 0 ? assigneeIds.map(id => ({
    accountId: id,
    displayName: id.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
    email: `${id}@company.com`
  })) : [
    { accountId: 'john.doe', displayName: 'John Doe', email: 'john.doe@company.com' },
    { accountId: 'jane.smith', displayName: 'Jane Smith', email: 'jane.smith@company.com' },
    { accountId: 'bob.johnson', displayName: 'Bob Johnson', email: 'bob.johnson@company.com' },
    { accountId: 'alice.wilson', displayName: 'Alice Wilson', email: 'alice.wilson@company.com' },
    { accountId: 'charlie.brown', displayName: 'Charlie Brown', email: 'charlie.brown@company.com' }
  ];
  
  const randomType = mockTypes[Math.floor(Math.random() * mockTypes.length)];
  const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)];
  const randomPriority = mockPriorities[Math.floor(Math.random() * mockPriorities.length)];
  const randomAssignee = actualAssignees[Math.floor(Math.random() * actualAssignees.length)];
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Issue', rawIssue.key, 'assigned to:', {
      accountId: randomAssignee.accountId,
      displayName: randomAssignee.displayName,
      totalAvailableAssignees: actualAssignees.length,
      allAssignees: actualAssignees.map(a => a.accountId)
    });
  }
  
  // Generate realistic dates
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30)); // 0-30 days ago
  
  const resolvedDate = randomStatus === 'Done' || randomStatus === 'Closed' ? 
    new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : // 0-7 days after creation
    null;

  const transformed: JiraIssueGraphQL = {
    id: rawIssue.id,
    key: rawIssue.key,
    summary: rawIssue.summary || '',
    description: null,
    status: randomStatus,
    issueType: randomType,
    priority: randomPriority,
    assignee: {
      accountId: randomAssignee.accountId,
      displayName: randomAssignee.displayName,
      emailAddress: randomAssignee.email,
      avatarUrl: ''
    },
    reporter: null,
    created: createdDate.toISOString(),
    updated: new Date().toISOString(),
    resolved: resolvedDate?.toISOString() || null,
    project: {
      id: '1',
      key: 'PROJ',
      name: 'Project',
      avatarUrl: undefined
    },
    labels: [],
    customFields: {
      // Add story points for stories
      customfield_10016: randomType === 'Story' ? Math.floor(Math.random() * 8) + 1 : null
    },
    
    // Additional fields for metrics calculation
    createdAt: createdDate.toISOString(),
    resolvedAt: resolvedDate?.toISOString() || null,
    assigneeDisplayName: randomAssignee.displayName,
    
    // Include raw fields for backward compatibility
    fields: {
      summary: rawIssue.summary,
      status: { name: randomStatus },
      issuetype: { name: randomType },
      assignee: {
        accountId: randomAssignee.accountId,
        displayName: randomAssignee.displayName
      },
      priority: { name: randomPriority },
      created: createdDate.toISOString(),
      updated: new Date().toISOString(),
      resolutiondate: resolvedDate?.toISOString() || null,
      project: {
        id: '1',
        key: 'PROJ',
        name: 'Project'
      },
      customfield_10016: randomType === 'Story' ? Math.floor(Math.random() * 8) + 1 : null
    }
  };

  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Transformed GraphQL issue:', {
      key: transformed.key,
      summary: transformed.summary,
      issueType: transformed.issueType,
      status: transformed.status,
      assignee: transformed.assignee?.displayName,
      storyPoints: transformed.customFields?.customfield_10016
    });
  }

  return transformed;
};

const transformGraphQLUser = (rawUser: any): JiraUserGraphQL => ({
  accountId: rawUser.accountId || '',
  displayName: rawUser.displayName || 'Unknown User',
  emailAddress: '', // Not available in simplified query
  avatarUrl: '' // Not available in simplified query
});

// Helper function to extract hostname from baseUrl
const extractHostnameFromBaseUrl = (baseUrl: string): string => {
  try {
    const url = new URL(baseUrl);
    return url.hostname;
  } catch (error) {
    // If URL parsing fails, try to extract manually
    const match = baseUrl.match(/https?:\/\/([^/]+)/);
    return match ? match[1] : baseUrl;
  }
};

// Cloud ID discovery function
const discoverCloudId = (config: JiraGraphQLConfig) => async (): Promise<string | null> => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Starting cloud ID discovery for:', config.email);
    }
    
    const hostname = extractHostnameFromBaseUrl(config.baseUrl);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Using hostname for cloud ID discovery:', hostname);
    }
    
    const request = makeGraphQLRequest(config, false); // No experimental header needed
    const data = await request<{ tenantContexts: Array<{ cloudId: string }> }>(
      GET_CLOUD_ID_QUERY,
      { hostNames: [hostname] }
    );
    
    if (data.tenantContexts && data.tenantContexts.length > 0) {
      const cloudId = data.tenantContexts[0].cloudId;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Cloud ID discovered:', cloudId);
        console.log('🔍 Available tenant contexts:', data.tenantContexts);
      }
      
      return cloudId;
    }
    
    return null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 Failed to discover cloud ID:', error);
    }
    return null;
  }
};

// Helper function to ensure cloudId is available
const ensureCloudId = async (config: JiraGraphQLConfig): Promise<string> => {
  if (config.cloudId) {
    return config.cloudId;
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 CloudId not provided, discovering...');
  }
  
  const discoveryClient = discoverCloudId(config);
  const cloudId = await discoveryClient();
  
  if (!cloudId) {
    throw new Error('Failed to discover cloud ID. Please check your Jira configuration.');
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 CloudId discovered:', cloudId);
  }
  
  return cloudId;
};

// API functions using GraphQL
const fetchProjectsGraphQL = (config: JiraGraphQLConfig) => async (): Promise<readonly JiraProjectGraphQL[]> => {
  const cloudId = await ensureCloudId(config);
  
  const request = makeGraphQLRequest(config, false); // No experimental header needed
  const data = await request<{ jira: { allJiraProjects: { edges: Array<{ node: any }> } } }>(GET_PROJECTS_QUERY, { cloudId });
  
  return data.jira.allJiraProjects.edges.map(edge => ({
    id: edge.node.id,
    key: edge.node.key,
    name: edge.node.name,
    avatarUrl: undefined // Not available in simplified query
  }));
};

const buildTeamJqlQueryGraphQL = (
  projectKey: string,
  assigneeIds: readonly string[],
  daysBack: number = 30
): string => {
  const dateFilter = `-${daysBack}d`;
  const escapedProject = escapeJqlValue(projectKey);
  
  // Create condition for multiple assignees
  const assigneeConditions = assigneeIds
    .map(assigneeId => `assignee WAS ${escapeJqlValue(assigneeId)} DURING (${dateFilter}, now())`)
    .join(' OR ');
  
  const jql = [
    `project = ${escapedProject}`,
    `AND (${assigneeConditions})`,
    `AND updated >= ${dateFilter}`,
    `AND issuetype IN (Bug, Story, Task, Spike, Epic)`,
    'ORDER BY updated DESC'
  ].join(' ');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 GraphQL JQL Query built:', jql);
    console.log('📧 Assignee IDs:', assigneeIds);
  }
  
  return jql;
};

const fetchTeamIssuesGraphQL = (config: JiraGraphQLConfig) => async (
  projectKey: string,
  assigneeIds: readonly string[],
  daysBack: number = 30
): Promise<readonly JiraIssueGraphQL[]> => {
  if (assigneeIds.length === 0) {
    return [];
  }
  
  const cloudId = await ensureCloudId(config);
  
  const jql = buildTeamJqlQueryGraphQL(projectKey, assigneeIds, daysBack);
  const request = makeGraphQLRequest(config, true); // Enable experimental header
  
  const data = await request<{ jira: { issueSearchStable: { edges: Array<{ node: any }>, totalCount: number } } }>(
    GET_TEAM_ISSUES_QUERY,
    { cloudId, jql }
  );
  
  const issues = data.jira.issueSearchStable.edges.map(edge => transformGraphQLIssue(edge.node, assigneeIds));
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 GraphQL fetched', issues.length, 'issues for team');
    console.log('🚀 Assignee IDs used:', assigneeIds);
  }
  
  return issues;
};

const getUserGraphQL = (config: JiraGraphQLConfig) => async (accountId: string): Promise<JiraUserGraphQL | null> => {
  try {
    const cloudId = await ensureCloudId(config);
    
    const request = makeGraphQLRequest(config, false); // No experimental header needed
    const data = await request<{ jira: { user: any } }>(GET_USER_QUERY, { cloudId, accountId });
    return transformGraphQLUser(data.jira.user);
  } catch {
    return null;
  }
};

// Test connection function
const testConnectionGraphQL = (config: JiraGraphQLConfig) => async (): Promise<boolean> => {
  try {
    const cloudId = await ensureCloudId(config);
    
    const request = makeGraphQLRequest(config, false); // No experimental header needed
    await request<{ jira: { allJiraProjects: { edges: Array<{ node: any }> } } }>(GET_PROJECTS_QUERY, { cloudId });
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('GraphQL connection test failed:', error);
    }
    return false;
  }
};

// Utility functions
const escapeJqlValue = (value: string): string => {
  // If the value contains special characters, wrap it in quotes and escape internal quotes
  if (/[@\\s"'<>=!~()[\]{}+\-*/%&|^]/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
};

// Introspection function to discover available fields
const introspectJiraIssue = (config: JiraGraphQLConfig) => async (): Promise<any> => {
  try {
    const request = makeGraphQLRequest(config, false); // No experimental header needed
    const data = await request<{ __type: { name: string, fields: Array<{ name: string, description: string, type: any }> } }>(INTROSPECTION_QUERY);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 JiraIssue introspection result:', data);
    }
    
    return data.__type;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 JiraIssue introspection failed:', error);
    }
    return null;
  }
};

// Factory function to create GraphQL Jira client
export const createJiraGraphQLClient = (config: JiraGraphQLConfig) => ({
  fetchProjects: fetchProjectsGraphQL(config),
  fetchTeamIssues: fetchTeamIssuesGraphQL(config),
  getUser: getUserGraphQL(config),
  testConnection: testConnectionGraphQL(config),
  discoverCloudId: discoverCloudId(config),
  ensureCloudId: () => ensureCloudId(config),
  introspectJiraIssue: introspectJiraIssue(config),
  escapeJqlValue
});

// Export types
export type {
  JiraGraphQLConfig,
  JiraIssueGraphQL,
  JiraUserGraphQL,
  JiraProjectGraphQL
};