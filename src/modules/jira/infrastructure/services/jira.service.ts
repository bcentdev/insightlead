import { createJiraGraphQLClient, type JiraGraphQLConfig, type JiraIssueGraphQL, type JiraProjectGraphQL } from '@/modules/jira/infrastructure/adapters/jira-graphql-client';
import { type JiraIssue, type JiraProject } from '@/modules/jira/infrastructure/adapters/jira-client';

// Types using functional programming approach
type JiraServiceConfig = {
  readonly baseUrl: string;
  readonly email: string;
  readonly apiToken: string;
  readonly cloudId?: string; // For GraphQL API
  readonly useGraphQL?: boolean; // Flag to enable GraphQL
};

type JiraServiceState = {
  readonly isConfigured: boolean;
  readonly graphqlClient: ReturnType<typeof createJiraGraphQLClient> | null;
  readonly useGraphQL: boolean;
  readonly discoveredCloudId?: string;
};

// Pure functions
const createInitialState = (): JiraServiceState => ({
  isConfigured: false,
  graphqlClient: null,
  useGraphQL: false,
  discoveredCloudId: undefined
});

// Remove unused function

const isValidGraphQLConfig = (config: Partial<JiraServiceConfig>): config is JiraGraphQLConfig => {
  return !!(config.baseUrl && config.email && config.apiToken);
};

// Service state
let serviceState: JiraServiceState = createInitialState();

// Service functions
const setConfiguration = (config: Partial<JiraServiceConfig>): void => {
  const useGraphQL = isValidGraphQLConfig(config);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Jira Service setConfiguration called with:', {
      hasBaseUrl: !!config.baseUrl,
      hasEmail: !!config.email,
      hasApiToken: !!config.apiToken,
      hasCloudId: !!config.cloudId,
      isValidGraphQLConfig: isValidGraphQLConfig(config),
      useGraphQL: useGraphQL
    });
  }
  
  if (useGraphQL) {
    // Use GraphQL client only
    serviceState = {
      isConfigured: true,
      graphqlClient: createJiraGraphQLClient(config as JiraGraphQLConfig),
      useGraphQL: true,
      discoveredCloudId: undefined
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Jira service configured with GraphQL API only');
    }
  } else {
    serviceState = createInitialState();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Jira service configuration invalid - GraphQL required');
    }
  }
};

// Remove unused function

const getGraphQLClient = (): ReturnType<typeof createJiraGraphQLClient> => {
  if (!serviceState.graphqlClient) {
    throw new Error('Jira GraphQL client not configured. Please set configuration first.');
  }
  return serviceState.graphqlClient;
};

const isConfigured = (): boolean => serviceState.isConfigured;

const testConnection = async (): Promise<boolean> => {
  if (serviceState.graphqlClient) {
    return serviceState.graphqlClient.testConnection();
  }
  return false;
};

const fetchProjects = async (): Promise<readonly JiraProject[]> => {
  if (!serviceState.graphqlClient) {
    throw new Error('Jira GraphQL client not configured');
  }
  
  const projects = await serviceState.graphqlClient.fetchProjects();
  // Convert GraphQL projects to REST format for compatibility
  return projects.map(project => ({
    id: project.id,
    key: project.key,
    name: project.name,
    avatarUrls: project.avatarUrl ? {
      '48x48': project.avatarUrl,
      '32x32': project.avatarUrl,
      '24x24': project.avatarUrl,
      '16x16': project.avatarUrl
    } : undefined
  }));
};

const fetchTeamIssues = async (
  projectKey: string,
  assigneeIds: readonly string[],
  daysBack: number = 30
): Promise<readonly JiraIssue[]> => {
  if (assigneeIds.length === 0) {
    return [];
  }

  if (!serviceState.graphqlClient) {
    throw new Error('Jira GraphQL client not configured');
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Jira Service: Making GraphQL call for team issues');
    console.log('🚀 Jira Service: Project:', projectKey);
    console.log('🚀 Jira Service: Assignees:', assigneeIds);
    console.log('🚀 Jira Service: Days back:', daysBack);
  }
  
  try {
    // Use GraphQL client
    const graphqlIssues = await serviceState.graphqlClient.fetchTeamIssues(projectKey, assigneeIds, daysBack);
    
    // Convert GraphQL issues to REST format for compatibility with existing metrics calculation
    const issues = graphqlIssues.map(issue => ({
      id: issue.id,
      key: issue.key,
      summary: issue.summary,
      description: issue.description,
      status: issue.status,
      issueType: issue.issueType,
      priority: issue.priority,
      assignee: issue.assignee ? {
        accountId: issue.assignee.accountId,
        displayName: issue.assignee.displayName,
        emailAddress: issue.assignee.emailAddress,
        avatarUrls: {
          '48x48': issue.assignee.avatarUrl,
          '24x24': issue.assignee.avatarUrl,
          '16x16': issue.assignee.avatarUrl,
          '32x32': issue.assignee.avatarUrl
        }
      } : null,
      reporter: issue.reporter ? {
        accountId: issue.reporter.accountId,
        displayName: issue.reporter.displayName,
        emailAddress: issue.reporter.emailAddress,
        avatarUrls: {
          '48x48': issue.reporter.avatarUrl,
          '24x24': issue.reporter.avatarUrl,
          '16x16': issue.reporter.avatarUrl,
          '32x32': issue.reporter.avatarUrl
        }
      } : null,
      created: issue.created,
      updated: issue.updated,
      resolved: issue.resolved,
      project: {
        id: issue.project.id,
        key: issue.project.key,
        name: issue.project.name,
        avatarUrls: issue.project.avatarUrl ? {
          '48x48': issue.project.avatarUrl,
          '32x32': issue.project.avatarUrl,
          '24x24': issue.project.avatarUrl,
          '16x16': issue.project.avatarUrl
        } : undefined
      },
      labels: issue.labels,
      // Additional fields for metrics calculation
      createdAt: issue.createdAt,
      resolvedAt: issue.resolvedAt,
      assigneeDisplayName: issue.assigneeDisplayName,
      fields: issue.fields
    })) as JiraIssue[];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Jira Service: Retrieved', issues.length, 'issues via GraphQL');
    }
    
    return issues;
  } catch (error) {
    console.error('❌ Jira Service: Error fetching team issues:', error);
    throw error;
  }
};

const searchIssues = async (jql: string, maxResults: number = 50) => {
  throw new Error('Search functionality not implemented for GraphQL. Use fetchTeamIssues instead.');
};

const fetchUserById = async (accountId: string) => {
  if (!serviceState.graphqlClient) {
    throw new Error('Jira GraphQL client not configured');
  }
  
  const user = await serviceState.graphqlClient.getUser(accountId);
  if (user) {
    // Convert GraphQL user to REST format
    return {
      accountId: user.accountId,
      displayName: user.displayName,
      emailAddress: user.emailAddress,
      avatarUrls: {
        '48x48': user.avatarUrl,
        '24x24': user.avatarUrl,
        '16x16': user.avatarUrl,
        '32x32': user.avatarUrl
      }
    };
  }
  return null;
};

const searchUsers = async (query: string) => {
  throw new Error('User search functionality not implemented for GraphQL.');
};

// Function to get discovered cloud ID
const getDiscoveredCloudId = async (): Promise<string | null> => {
  if (!serviceState.graphqlClient) {
    return null;
  }
  
  try {
    const cloudId = await serviceState.graphqlClient.ensureCloudId();
    
    // Update service state with discovered cloudId
    serviceState = {
      ...serviceState,
      discoveredCloudId: cloudId
    };
    
    return cloudId;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to discover cloud ID:', error);
    }
    return null;
  }
};

// Export service
export const jiraService = {
  setConfiguration,
  isConfigured,
  testConnection,
  fetchProjects,
  fetchTeamIssues,
  searchIssues,
  fetchUserById,
  searchUsers,
  getDiscoveredCloudId
};

// Export types
export type { JiraServiceConfig };