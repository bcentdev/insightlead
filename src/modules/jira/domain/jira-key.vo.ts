declare const JiraKeyBrand: unique symbol;

export type JiraKey = string & { readonly [JiraKeyBrand]: never };

export type JiraKeyParts = {
  readonly projectKey: string;
  readonly issueNumber: number;
};

const parseJiraKey = (value: string): JiraKeyParts => {
  if (!value.trim()) {
    throw new Error('Jira key cannot be empty');
  }

  const jiraKeyRegex = /^([A-Z][A-Z0-9]*)-(\d+)$/;
  const match = value.match(jiraKeyRegex);

  if (!match) {
    throw new Error('Invalid Jira key format. Expected format: PROJECT-123');
  }

  const projectKey = match[1];
  const issueNumber = parseInt(match[2], 10);

  if (projectKey.length > 10) {
    throw new Error('Jira project key cannot be longer than 10 characters');
  }

  if (issueNumber <= 0) {
    throw new Error('Jira issue number must be positive');
  }

  return { projectKey, issueNumber };
};

export const createJiraKey = (value: string): JiraKey => {
  parseJiraKey(value);
  return value as JiraKey;
};

export const isValidJiraKey = (value: string): value is JiraKey => {
  try {
    parseJiraKey(value);
    return true;
  } catch {
    return false;
  }
};

export const getJiraKeyParts = (jiraKey: JiraKey): JiraKeyParts => 
  parseJiraKey(jiraKey);

export const jiraKeysEqual = (a: JiraKey, b: JiraKey): boolean => a === b;

export const jiraKeyToString = (jiraKey: JiraKey): string => jiraKey;

export const jiraKeyFromString = (value: string): JiraKey => createJiraKey(value);

export const getJiraKeyProjectKey = (jiraKey: JiraKey): string => 
  getJiraKeyParts(jiraKey).projectKey;

export const getJiraKeyIssueNumber = (jiraKey: JiraKey): number => 
  getJiraKeyParts(jiraKey).issueNumber;