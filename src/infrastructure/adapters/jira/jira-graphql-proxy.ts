// Jira GraphQL Proxy Service for handling CORS issues in development
import type { JiraGraphQLConfig } from './jira-graphql-client';

type ProxyGraphQLConfig = {
  readonly baseUrl: string;
  readonly email: string;
  readonly apiToken: string;
  readonly cloudId: string;
};

// Development-only GraphQL proxy functions
const makeGraphQLProxyRequest = async (
  config: ProxyGraphQLConfig,
  query: string,
  variables: Record<string, any> = {}
): Promise<any> => {
  const proxyUrl = `/gateway/api/graphql`;
  
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Jira-Token': config.apiToken,
      'X-Jira-Email': config.email,
      'X-Jira-CloudId': config.cloudId,
      'X-ExperimentalApi': 'true'
    },
    body: JSON.stringify({
      query,
      variables
    })
  });
  
  if (!response.ok) {
    throw new Error(`Jira GraphQL proxy request failed: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (result.errors && result.errors.length > 0) {
    throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
  }
  
  return result.data;
};

// GraphQL queries (same as in main client)
const GET_PROJECTS_QUERY = `
  query GetProjects {
    jira {
      projects {
        nodes {
          id
          key
          name
          avatarUrl
        }
      }
    }
  }
`;

const GET_TEAM_ISSUES_QUERY = `
  query GetTeamIssues($jql: String!, $maxResults: Int!) {
    jira {
      issueSearch(jql: $jql, maxResults: $maxResults) {
        issues {
          nodes {
            id
            key
            summary
            description {
              content {
                content {
                  text
                }
              }
            }
            status {
              name
            }
            issueType {
              name
            }
            priority {
              name
            }
            assignee {
              accountId
              displayName
              emailAddress
              avatarUrl
            }
            reporter {
              accountId
              displayName
              emailAddress
              avatarUrl
            }
            created
            updated
            resolutionDate
            project {
              id
              key
              name
              avatarUrl
            }
            labels {
              name
            }
            customFields {
              ... on StringCustomField {
                name
                value
              }
              ... on NumberCustomField {
                name
                value
              }
              ... on DateCustomField {
                name
                value
              }
            }
          }
        }
        total
      }
    }
  }
`;

const fetchProjectsViaGraphQLProxy = async (config: ProxyGraphQLConfig) => {
  try {
    const data = await makeGraphQLProxyRequest(config, GET_PROJECTS_QUERY);
    return data.jira.projects.nodes;
  } catch (error) {
    console.error('Failed to fetch projects via GraphQL proxy:', error);
    throw error;
  }
};

const fetchTeamIssuesViaGraphQLProxy = async (
  config: ProxyGraphQLConfig,
  jql: string,
  maxResults: number = 100
) => {
  try {
    const data = await makeGraphQLProxyRequest(config, GET_TEAM_ISSUES_QUERY, { jql, maxResults });
    return data.jira.issueSearch.issues.nodes;
  } catch (error) {
    console.error('Failed to fetch team issues via GraphQL proxy:', error);
    throw error;
  }
};

const testConnectionViaGraphQLProxy = async (config: ProxyGraphQLConfig): Promise<boolean> => {
  try {
    await makeGraphQLProxyRequest(config, GET_PROJECTS_QUERY);
    return true;
  } catch (error) {
    console.error('GraphQL proxy connection test failed:', error);
    return false;
  }
};

export const createJiraGraphQLProxyService = (config: JiraGraphQLConfig) => ({
  fetchProjects: () => fetchProjectsViaGraphQLProxy(config),
  fetchTeamIssues: (jql: string, maxResults?: number) => 
    fetchTeamIssuesViaGraphQLProxy(config, jql, maxResults),
  testConnection: () => testConnectionViaGraphQLProxy(config)
});

export type { ProxyGraphQLConfig };