declare const GitHubUsernameBrand: unique symbol;

export type GitHubUsername = string & { readonly [GitHubUsernameBrand]: never };

const validateGitHubUsername = (value: string): void => {
  if (!value.trim()) {
    throw new Error('GitHub username cannot be empty');
  }

  if (value.length > 39) {
    throw new Error('GitHub username cannot be longer than 39 characters');
  }

  if (value.startsWith('-') || value.endsWith('-')) {
    throw new Error('GitHub username cannot start or end with a hyphen');
  }

  if (!/^[a-zA-Z0-9-]+$/.test(value)) {
    throw new Error('GitHub username can only contain alphanumeric characters and hyphens');
  }

  if (/--/.test(value)) {
    throw new Error('GitHub username cannot contain consecutive hyphens');
  }
};

export const createGitHubUsername = (value: string): GitHubUsername => {
  validateGitHubUsername(value);
  return value as GitHubUsername;
};

export const isValidGitHubUsername = (value: string): value is GitHubUsername => {
  try {
    validateGitHubUsername(value);
    return true;
  } catch {
    return false;
  }
};

export const gitHubUsernamesEqual = (a: GitHubUsername, b: GitHubUsername): boolean => 
  a.toLowerCase() === b.toLowerCase();

export const gitHubUsernameToString = (username: GitHubUsername): string => username;

export const gitHubUsernameFromString = (value: string): GitHubUsername => 
  createGitHubUsername(value);

// Add value property for compatibility
export const getGitHubUsernameValue = (username: GitHubUsername): string => username;