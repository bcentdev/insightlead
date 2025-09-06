import { GitHubClient } from '@/modules/github/infrastructure/adapters/github/github-client';
import { createGitHubAdapter } from '@/modules/github/infrastructure/adapters/github/github.adapter';
import { GitHubPort } from '@/modules/github/application/ports/github.port';
import { SettingsRepository } from '@/shared/infrastructure/repositories/settings.repository';

function createGitHubService() {
  const settingsRepo = new SettingsRepository();
  let githubClient = new GitHubClient({ token: '' });
  let githubAdapter: GitHubPort = createGitHubAdapter(githubClient);

  async function loadTokenFromSettings(): Promise<void> {
    try {
      const settings = await settingsRepo.getAppSettings();
      if (settings.githubToken) {
        githubClient.updateToken(settings.githubToken);
        githubAdapter = createGitHubAdapter(githubClient);
      }
    } catch (error) {
      console.warn('Failed to load GitHub token from settings:', error);
    }
  }

  // Inicializa el token al crear el servicio
  loadTokenFromSettings();

  return {
    setToken(token: string): void {
      githubClient.updateToken(token);
      githubAdapter = createGitHubAdapter(githubClient);
    },

    async getToken(): Promise<string | undefined> {
      try {
        const settings = await settingsRepo.getAppSettings();
        return settings.githubToken;
      } catch (error) {
        console.error('Failed to get GitHub token from settings:', error);
        return undefined;
      }
    },

    clearToken(): void {
      githubClient.updateToken('');
      githubAdapter = createGitHubAdapter(githubClient);
    },

    hasToken(): boolean {
      return githubClient.hasToken();
    },

    get client(): GitHubClient {
      return githubClient;
    },

    async testConnection(): Promise<boolean> {
      if (!githubClient.hasToken()) {
        return false;
      }
      return githubAdapter.testConnection();
    },

    async fetchTeamPullRequests(teamMembers: string[], days: number = 30): Promise<{
      pullRequests: any[];
      totalPRs: number;
      mergedPRs: number;
      openPRs: number;
    }> {
      if (!githubClient.hasToken()) {
        throw new Error('GitHub token not configured');
      }

      // Check if repositories are configured
      const repositories = await settingsRepo.getGitHubRepositories();
      if (repositories.length === 0) {
        throw new Error('No repositories configured. Please add repositories in Settings to track pull requests.');
      }

      if (teamMembers.length === 0) {
        return {
          pullRequests: [],
          totalPRs: 0,
          mergedPRs: 0,
          openPRs: 0
        };
      }

      // Filter out empty/invalid usernames
      const validTeamMembers = teamMembers.filter(username => username && username.trim().length > 0);
      if (validTeamMembers.length === 0) {
        console.warn('No valid GitHub usernames found in team members');
        return {
          pullRequests: [],
          totalPRs: 0,
          mergedPRs: 0,
          openPRs: 0
        };
      }

      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      console.log(`🚀 Using GraphQL to fetch PRs from ${repositories.length} repositories for team members:`, validTeamMembers);
      console.log('🚀 Repository details:', repositories.map(repo => ({ 
        fullName: repo.fullName, 
        url: repo.url,
        id: repo.id 
      })));

      try {
        // Transform repositories to GraphQL format
        const repoParams = repositories.map(repo => {
          const [owner, name] = repo.fullName.split('/');
          return { owner, name };
        });
        
        console.log('🚀 GraphQL repository parameters:', repoParams);

        // Use GraphQL for efficient single-query fetch
        const pullRequests = await githubClient.getTeamPullRequestsGraphQL(
          repoParams,
          validTeamMembers,
          dateFrom,
          200 // Get many more PRs from all repos to ensure comprehensive metrics
        );

        const totalPRs = pullRequests.length;
        const mergedPRs = pullRequests.filter(pr => pr.state === 'merged').length;
        const openPRs = pullRequests.filter(pr => pr.state === 'open').length;

        console.log(`📊 GraphQL fetched ${totalPRs} PRs (${mergedPRs} merged, ${openPRs} open) from team members`);

        // Return ALL PRs for accurate metrics calculation
        // The hook will calculate metrics from all PRs, not just the first 10
        return {
          pullRequests: pullRequests, // Return all PRs for metrics calculation
          totalPRs,
          mergedPRs,
          openPRs
        };

      } catch (error) {
        console.error('❌ GraphQL fetch failed, falling back to REST API:', error);

        // Fallback to REST API if GraphQL fails
        return this.fetchTeamPullRequestsREST(validTeamMembers, days);
      }
    },

    async fetchUserPullRequests(username: string, days: number = 30): Promise<{
      pullRequests: any[];
      totalPRs: number;
      mergedPRs: number;
      openPRs: number;
    }> {
      if (!githubClient.hasToken()) {
        throw new Error('GitHub token not configured');
      }

      // Check if repositories are configured
      const repositories = await settingsRepo.getGitHubRepositories();
      if (repositories.length === 0) {
        throw new Error('No repositories configured. Please add repositories in Settings to track pull requests.');
      }

      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      console.log(`🔍 Fetching PRs from ${repositories.length} configured repositories for user ${username}`);

      const allPullRequests: any[] = [];

      // Fetch PRs only from configured repositories
      for (const repo of repositories) {
        try {
          console.log(`📂 Fetching PRs from ${repo.fullName}`);
          const [owner, repoName] = repo.fullName.split('/');

          const prs = await githubClient.getPullRequests(owner, repoName, username, dateFrom);

          // Transform basic PR info (without expensive details calls)
          const transformedPrs = prs.map((pr) => ({
            id: pr.id,
            title: pr.title,
            state: pr.merged_at ? 'merged' : pr.state,
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            merged_at: pr.merged_at,
            html_url: pr.html_url,
            repository: repo.fullName,
            repositoryUrl: repo.url,
            number: pr.number,
            user: pr.user,
            // We'll fetch these details later only for displayed PRs
            additions: 0,
            deletions: 0,
            review_comments: 0
          }));

          allPullRequests.push(...transformedPrs);
          console.log(`✅ Found ${transformedPrs.length} PRs in ${repo.fullName}`);
        } catch (error) {
          console.warn(`❌ Error fetching PRs from ${repo.fullName}:`, error);
          // Continue with other repositories
        }
      }

      // Sort by creation date (newest first)
      allPullRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const totalPRs = allPullRequests.length;
      const mergedPRs = allPullRequests.filter(pr => pr.state === 'merged').length;
      const openPRs = allPullRequests.filter(pr => pr.state === 'open').length;

      console.log(`📊 Total PRs found: ${totalPRs} (${mergedPRs} merged, ${openPRs} open)`);

      // Get detailed info only for the PRs we'll display (optimization)
      const displayPRs = allPullRequests.slice(0, 10);
      const detailedPRs = await Promise.all(displayPRs.map(async (pr) => {
        try {
          const [owner, repoName] = pr.repository.split('/');
          const prDetails = await githubClient.getPullRequestDetails(owner, repoName, pr.number);
          return {
            ...pr,
            additions: prDetails.additions || 0,
            deletions: prDetails.deletions || 0,
            review_comments: prDetails.review_comments || 0
          };
        } catch (error) {
          console.warn(`Error fetching details for PR ${pr.number} in ${pr.repository}:`, error);
          return pr; // Return basic PR if details fetch fails
        }
      }));

      return {
        pullRequests: detailedPRs,
        totalPRs,
        mergedPRs,
        openPRs
      };
    },

    async getUserProfile(username: string) {
      if (!githubClient.hasToken()) {
        throw new Error('GitHub token not configured');
      }
      return githubAdapter.getUserProfile(username);
    },

    async searchRepositories(query: string): Promise<any[]> {
      if (!githubClient.hasToken()) {
        throw new Error('GitHub token not configured');
      }
      try {
        const response = await githubClient['octokit'].rest.search.repos({
          q: query,
          sort: 'updated',
          per_page: 20
        });
        return response.data.items;
      } catch (error) {
        console.error('Error searching repositories:', error);
        throw error;
      }
    },

    async getUserRepositories(username: string): Promise<any[]> {
      if (!githubClient.hasToken()) {
        throw new Error('GitHub token not configured');
      }
      try {
        return await githubClient.getUserRepositories(username);
      } catch (error) {
        console.error('Error fetching user repositories:', error);
        throw error;
      }
    },

    async getRepositoryDetails(owner: string, repo: string): Promise<any> {
      if (!githubClient.hasToken()) {
        throw new Error('GitHub token not configured');
      }
      try {
        const response = await githubClient['octokit'].rest.repos.get({
          owner,
          repo
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching repository details:', error);
        throw error;
      }
    },

    async getPullRequestComments(owner: string, repo: string, pull_number: number): Promise<any[]> {
      if (!githubClient.hasToken()) {
        throw new Error('GitHub token not configured');
      }
      try {
        const [issueComments, reviewComments] = await Promise.all([
          githubClient['octokit'].rest.issues.listComments({
            owner,
            repo,
            issue_number: pull_number
          }),
          githubClient['octokit'].rest.pulls.listReviewComments({
            owner,
            repo,
            pull_number
          })
        ]);
        return [
          ...issueComments.data.map(comment => ({ ...comment, type: 'issue' })),
          ...reviewComments.data.map(comment => ({ ...comment, type: 'review' }))
        ];
      } catch (error) {
        console.error('Error fetching PR comments:', error);
        throw error;
      }
    },

    async getUserCommentsCount(username: string, days: number = 30): Promise<number> {
      if (!githubClient.hasToken()) {
        throw new Error('GitHub token not configured');
      }

      // Get configured repositories
      const repositories = await settingsRepo.getGitHubRepositories();
      if (repositories.length === 0) {
        return 0; // No repositories configured, return 0 comments
      }

      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      let totalComments = 0;

      console.log(`🔍 Fetching comments from ${repositories.length} configured repositories for user ${username}`);

      try {
        for (const repo of repositories) {
          const [owner, repoName] = repo.fullName.split('/');
          if (!owner || !repoName) continue;

          // Search for comments by the user in this repository
          const query = `repo:${repo.fullName} commenter:${username} created:>=${dateFrom.toISOString().split('T')[0]}`;

          try {
            const response = await githubClient['octokit'].rest.search.issuesAndPullRequests({
              q: query,
              per_page: 100
            });

            // Count comments from each issue/PR
            for (const item of response.data.items) {
              try {
                const comments = await githubClient['octokit'].rest.issues.listComments({
                  owner,
                  repo: repoName,
                  issue_number: item.number
                });

                const userComments = comments.data.filter(comment =>
                  comment.user?.login === username &&
                  new Date(comment.created_at) >= dateFrom
                );

                totalComments += userComments.length;
              } catch (error) {
                console.warn(`Error fetching comments for ${item.html_url}:`, error);
              }
            }
          } catch (error) {
            console.warn(`Error searching comments in ${repo.fullName}:`, error);
          }
        }
      } catch (error) {
        console.error('Error fetching user comments count:', error);
      }

      console.log(`💬 Total comments found: ${totalComments}`);
      return totalComments;
    },

    // Método privado convertido en función interna
    async fetchTeamPullRequestsREST(teamMembers: string[], days: number = 30): Promise<{
      pullRequests: any[];
      totalPRs: number;
      mergedPRs: number;
      openPRs: number;
    }> {
      const repositories = await settingsRepo.getGitHubRepositories();
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      console.log(`⚠️ Using REST API fallback for ${repositories.length} repositories`);

      const allPullRequests: any[] = [];

      // Get all PRs and filter by team members (since REST API doesn't support creator filter properly)
      for (const repo of repositories) {
        try {
          console.log(`📂 Fetching all PRs from ${repo.fullName}`);
          const [owner, repoName] = repo.fullName.split('/');

          // Get all recent PRs from the repository
          const response = await githubClient['octokit'].rest.pulls.list({
            owner,
            repo: repoName,
            state: 'all',
            sort: 'updated',
            direction: 'desc',
            per_page: 100
          });

          // Filter PRs by team members and date
          const teamPRs = response.data
            .filter(pr => {
              const authorLogin = pr.user?.login;
              return authorLogin && teamMembers.includes(authorLogin);
            })
            .filter(pr => new Date(pr.created_at) >= dateFrom)
            .map(pr => ({
              id: pr.id,
              title: pr.title,
              state: pr.merged_at ? 'merged' : pr.state,
              created_at: pr.created_at,
              updated_at: pr.updated_at,
              merged_at: pr.merged_at,
              html_url: pr.html_url,
              repository: repo.fullName,
              repositoryUrl: repo.url,
              number: pr.number,
              user: pr.user,
              author: pr.user?.login,
              additions: 0,
              deletions: 0,
              review_comments: 0
            }));

          allPullRequests.push(...teamPRs);
          console.log(`✅ Found ${teamPRs.length} team PRs in ${repo.fullName}`);
        } catch (error) {
          console.warn(`❌ Error fetching PRs from ${repo.fullName}:`, error);
        }
      }

      // Remove duplicates and sort
      const uniquePRs = allPullRequests
        .filter((pr, index, arr) => arr.findIndex(p => p.id === pr.id) === index)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const totalPRs = uniquePRs.length;
      const mergedPRs = uniquePRs.filter(pr => pr.state === 'merged').length;
      const openPRs = uniquePRs.filter(pr => pr.state === 'open').length;

      console.log(`📊 REST API found ${totalPRs} unique team PRs (${mergedPRs} merged, ${openPRs} open)`);

      return {
        pullRequests: uniquePRs, // Return all PRs for accurate metrics calculation
        totalPRs,
        mergedPRs,
        openPRs
      };
    }
  };
}

export const githubService = createGitHubService();
