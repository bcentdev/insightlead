import { Octokit } from '@octokit/rest';

export type GitHubConfig = {
  token?: string;
  baseUrl?: string;
}

export class GitHubClient {
  private octokit: Octokit;
  private token?: string;

  constructor(config: GitHubConfig = {}) {
    this.token = config.token;
    this.octokit = new Octokit({
      auth: this.token,
      baseUrl: config.baseUrl || 'https://api.github.com'
    });
  }

  updateToken(token: string) {
    this.token = token;
    this.octokit = new Octokit({
      auth: token,
      baseUrl: 'https://api.github.com'
    });
  }

  hasToken(): boolean {
    return !!this.token;
  }

  async getUser(username: string) {
    try {
      const response = await this.octokit.rest.users.getByUsername({
        username
      });
      return response.data;
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getUserRepositories(username: string, page = 1, per_page = 100) {
    const response = await this.octokit.rest.repos.listForUser({
      username,
      page,
      per_page,
      sort: 'updated',
      direction: 'desc'
    });
    return response.data;
  }

  async getPullRequests(owner: string, repo: string, creator: string, since?: Date, until?: Date) {
    const params: any = {
      owner,
      repo,
      creator,
      state: 'all',
      sort: 'updated',
      direction: 'desc',
      per_page: 100
    };

    if (since) {
      params.since = since.toISOString();
    }

    const response = await this.octokit.rest.pulls.list(params);
    
    let pullRequests = response.data;

    // Filter by date range if until is specified
    if (until) {
      pullRequests = pullRequests.filter(pr => 
        new Date(pr.updated_at) <= until
      );
    }

    return pullRequests;
  }

  async getPullRequestDetails(owner: string, repo: string, pull_number: number) {
    const response = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number
    });
    return response.data;
  }

  async getIssues(owner: string, repo: string, creator: string, since?: Date, until?: Date) {
    const params: any = {
      owner,
      repo,
      creator,
      state: 'all',
      sort: 'updated',
      direction: 'desc',
      per_page: 100
    };

    if (since) {
      params.since = since.toISOString();
    }

    const response = await this.octokit.rest.issues.list(params);
    
    let issues = response.data.filter(issue => !issue.pull_request); // Exclude PRs

    // Filter by date range if until is specified
    if (until) {
      issues = issues.filter(issue => 
        new Date(issue.updated_at) <= until
      );
    }

    return issues;
  }

  async getCommits(owner: string, repo: string, author: string, since?: Date, until?: Date) {
    const params: any = {
      owner,
      repo,
      author,
      per_page: 100
    };

    if (since) {
      params.since = since.toISOString();
    }

    if (until) {
      params.until = until.toISOString();
    }

    const response = await this.octokit.rest.repos.listCommits(params);
    return response.data;
  }

  async getCommitDetails(owner: string, repo: string, ref: string) {
    const response = await this.octokit.rest.repos.getCommit({
      owner,
      repo,
      ref
    });
    return response.data;
  }

  async getReviews(owner: string, repo: string, pull_number: number) {
    const response = await this.octokit.rest.pulls.listReviews({
      owner,
      repo,
      pull_number
    });
    return response.data;
  }

  async searchPullRequests(query: string, sort?: 'created' | 'updated' | 'comments') {
    const response = await this.octokit.rest.search.issuesAndPullRequests({
      q: query,
      sort,
      per_page: 100
    });
    return response.data.items.filter(item => item.pull_request);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.octokit.rest.users.getAuthenticated();
      return true;
    } catch {
      return false;
    }
  }

  // GraphQL method for efficient team pull requests fetching
  async getTeamPullRequestsGraphQL(repositories: Array<{owner: string, name: string}>, teamMembers: string[], since: Date, limit: number = 10) {
    const sinceISO = since.toISOString();
    
    // Build repository queries for GraphQL
    const repoQueries = repositories.map((repo, index) => {
      return `
        repo${index}: repository(owner: "${repo.owner}", name: "${repo.name}") {
          pullRequests(first: 50, orderBy: {field: CREATED_AT, direction: DESC}, states: [OPEN, MERGED, CLOSED]) {
            nodes {
              id
              title
              number
              state
              createdAt
              updatedAt
              mergedAt
              url
              additions
              deletions
              author {
                login
              }
              repository {
                nameWithOwner
                url
              }
              reviews(first: 10) {
                totalCount
              }
              comments(first: 1) {
                totalCount
              }
            }
          }
        }
      `;
    }).join('\n');

    const query = `
      query GetTeamPullRequests {
        ${repoQueries}
      }
    `;

    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 GraphQL Query for repositories:', repositories.length);
      console.log('🔧 Generated GraphQL Query:', query);
    }

    try {
      const response = await this.octokit.graphql(query);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 GraphQL Response structure:', Object.keys(response));
        console.log('🔧 Full GraphQL Response:', response);
      }
      
      // Collect all PRs from all repositories
      const allPRs: any[] = [];
      
      repositories.forEach((_, index) => {
        const repoData = response[`repo${index}`];
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔧 Processing repo${index}:`, repositories[index], 'Data:', repoData);
        }
        if (repoData && repoData.pullRequests) {
          const prs = repoData.pullRequests.nodes
            .filter((pr: any) => {
              // Filter by team members
              const authorLogin = pr.author?.login;
              return authorLogin && teamMembers.includes(authorLogin);
            })
            .filter((pr: any) => {
              // Filter by date
              return new Date(pr.createdAt) >= since;
            })
            .map((pr: any) => ({
              id: pr.id,
              title: pr.title,
              number: pr.number,
              state: pr.state.toLowerCase(),
              created_at: pr.createdAt,
              updated_at: pr.updatedAt,
              merged_at: pr.mergedAt,
              html_url: pr.url,
              additions: pr.additions || 0,
              deletions: pr.deletions || 0,
              review_comments: (pr.reviews?.totalCount || 0) + (pr.comments?.totalCount || 0),
              repository: pr.repository?.nameWithOwner,
              repositoryUrl: pr.repository?.url,
              user: {
                login: pr.author?.login
              },
              author: pr.author?.login
            }));
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔧 Found ${prs.length} PRs for repo${index} (${repositories[index].owner}/${repositories[index].name})`);
            console.log('🔧 PRs:', prs.map(pr => ({ title: pr.title, author: pr.author, state: pr.state })));
          }
          
          allPRs.push(...prs);
        } else if (process.env.NODE_ENV === 'development') {
          console.log(`🔧 No data for repo${index}:`, repositories[index]);
        }
      });

      // Remove duplicates and sort by creation date
      const uniquePRs = allPRs
        .filter((pr, index, arr) => arr.findIndex(p => p.id === pr.id) === index)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, Math.max(limit, 200)); // Ensure we return enough PRs for metrics calculation

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 GraphQL Summary: ${allPRs.length} total PRs from ${repositories.length} repos, ${uniquePRs.length} unique PRs returned`);
        console.log('🔧 Repositories processed:', repositories.map(r => `${r.owner}/${r.name}`));
        console.log('🔧 Team members:', teamMembers);
      }

      return uniquePRs;
    } catch (error) {
      console.error('GraphQL query error:', error);
      throw error;
    }
  }
}