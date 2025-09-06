import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Chip,
  Link
} from '@heroui/react';
import { Github, GitPullRequest, GitMerge, Clock, Settings, ExternalLink } from 'lucide-react';
import { MetricCard } from '@/shared/ui/components/metric-card';
import { SettingsRepository } from '@/shared/infrastructure/repositories/settings.repository';
import { githubService } from '@/modules/github/infrastructure/services/github.service';

interface GitHubPullRequestsProps {
  teamMembers?: string[];  // Changed from single username to array of team members
  className?: string;
}

interface PullRequestData {
  pullRequests: any[];
  totalPRs: number;
  mergedPRs: number;
  openPRs: number;
}

const GitHubPullRequestsComponent = ({ teamMembers = [], className }: GitHubPullRequestsProps) => {
  const [data, setData] = useState<PullRequestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [hasRepositories, setHasRepositories] = useState(false);
  const [repositoryCount, setRepositoryCount] = useState(0);
  
  const settingsRepo = useMemo(() => new SettingsRepository(), []);
  const memoizedTeamMembers = useMemo(() => teamMembers, [JSON.stringify(teamMembers)]);

  const fetchPullRequestData = useCallback(async () => {
    if (memoizedTeamMembers.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const prData = await githubService.fetchTeamPullRequests(memoizedTeamMembers, 30);
      setData(prData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pull request data');
      console.error('Error fetching GitHub data:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedTeamMembers]);

  const checkTokenAndFetchData = useCallback(async () => {
    try {
      const settings = await settingsRepo.getAppSettings();
      const repositories = await settingsRepo.getGitHubRepositories();
      
      const tokenExists = !!settings.githubToken;
      const reposExist = repositories.length > 0;
      
      setHasToken(tokenExists);
      setHasRepositories(reposExist);
      setRepositoryCount(repositories.length);

      if (tokenExists && reposExist) {
        // Update the GitHub service with the token from settings
        githubService.setToken(settings.githubToken!);
        
        if (memoizedTeamMembers.length > 0) {
          await fetchPullRequestData();
        }
      }
    } catch (error) {
      console.error('Error loading GitHub settings:', error);
      setHasToken(false);
      setHasRepositories(false);
    }
  }, [settingsRepo, memoizedTeamMembers, fetchPullRequestData]);

  useEffect(() => {
    checkTokenAndFetchData();
  }, [checkTokenAndFetchData]);

  const goToSettings = useCallback(() => {
    window.location.href = '/settings';
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'today';
    if (diffDays === 2) return 'yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'merged': return 'success';
      case 'open': return 'primary';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'merged': return <GitMerge style={{ width: '0.75rem', height: '0.75rem' }} />;
      case 'open': return <GitPullRequest style={{ width: '0.75rem', height: '0.75rem' }} />;
      case 'closed': return <GitPullRequest style={{ width: '0.75rem', height: '0.75rem' }} />;
      default: return <GitPullRequest style={{ width: '0.75rem', height: '0.75rem' }} />;
    }
  };

  // If no token configured, show setup card
  if (!hasToken) {
    return (
      <div style={className ? {} : {}}>
        <Card style={{ border: 'none', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Github style={{ width: '1.25rem', height: '1.25rem', color: 'rgb(75 85 99)' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>GitHub Integration</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <Github style={{ width: '3rem', height: '3rem', color: 'rgb(156 163 175)', margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.125rem', fontWeight: 500, color: 'rgb(17 24 39)', marginBottom: '0.5rem' }}>Connect GitHub</h4>
              <p style={{ color: 'rgb(75 85 99)', marginBottom: '1.5rem' }}>
                Configure your GitHub token to view pull request data and metrics
              </p>
              <Button
                color="primary"
                variant="flat"
                startContent={<Settings style={{ width: '1rem', height: '1rem' }} />}
                onPress={goToSettings}
              >
                Go to Settings
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // If token exists but no repositories configured, show repository setup card
  if (hasToken && !hasRepositories) {
    return (
      <div style={className ? {} : {}}>
        <Card style={{ border: 'none', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Github style={{ width: '1.25rem', height: '1.25rem', color: 'rgb(75 85 99)' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>GitHub Pull Requests</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <Github style={{ width: '3rem', height: '3rem', color: 'rgb(156 163 175)', margin: '0 auto 1rem' }} />
              <h4 style={{ fontSize: '1.125rem', fontWeight: 500, color: 'rgb(17 24 39)', marginBottom: '0.5rem' }}>Configure Repositories</h4>
              <p style={{ color: 'rgb(75 85 99)', marginBottom: '1.5rem' }}>
                Add GitHub repositories to track pull requests and metrics. You currently have {repositoryCount} repositories configured.
              </p>
              <Button
                color="primary"
                variant="flat"
                startContent={<Settings style={{ width: '1rem', height: '1rem' }} />}
                onPress={goToSettings}
              >
                Add Repositories
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // If no team members provided
  if (teamMembers.length === 0) {
    return (
      <div style={className ? {} : {}}>
        <Card style={{ border: 'none', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Github style={{ width: '1.25rem', height: '1.25rem', color: 'rgb(75 85 99)' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>GitHub Pull Requests</h3>
              </div>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={goToSettings}
              >
                <Settings style={{ width: '1rem', height: '1rem' }} />
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <GitPullRequest style={{ width: '3rem', height: '3rem', color: 'rgb(156 163 175)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'rgb(75 85 99)' }}>
                No team members found to display pull request data
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* GitHub Metrics */}
      {data && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <MetricCard
            title="Total PRs"
            value={data.totalPRs}
            icon={<GitPullRequest style={{ width: '1.25rem', height: '1.25rem', color: 'rgb(37 99 235)' }} />}
            gradient="from-blue-50 to-blue-100"
          />
          <MetricCard
            title="Merged PRs"
            value={data.mergedPRs}
            icon={<GitMerge style={{ width: '1.25rem', height: '1.25rem', color: 'rgb(34 197 94)' }} />}
            gradient="from-green-50 to-green-100"
          />
          <MetricCard
            title="Open PRs"
            value={data.openPRs}
            icon={<GitPullRequest style={{ width: '1.25rem', height: '1.25rem', color: 'rgb(249 115 22)' }} />}
            gradient="from-orange-50 to-orange-100"
          />
        </div>
      )}

      {/* Pull Requests List */}
      <Card style={{ border: 'none', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Github style={{ width: '1.25rem', height: '1.25rem', color: 'rgb(75 85 99)' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Pull Requests</h3>
              {loading && <Spinner size="sm" />}
            </div>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={goToSettings}
            >
              <Settings style={{ width: '1rem', height: '1rem' }} />
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {loading && !data && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ color: 'rgb(239 68 68)', marginBottom: '0.5rem' }}>Failed to load pull requests</div>
              <p style={{ color: 'rgb(75 85 99)', fontSize: '0.875rem' }}>{error}</p>
              <Button
                variant="flat"
                size="sm"
                onPress={fetchPullRequestData}
                style={{ marginTop: '1rem' }}
              >
                Retry
              </Button>
            </div>
          )}

          {data && data.pullRequests.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <GitPullRequest style={{ width: '3rem', height: '3rem', color: 'rgb(156 163 175)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'rgb(75 85 99)' }}>No pull requests found in the last 30 days</p>
            </div>
          )}

          {data && data.pullRequests.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.pullRequests.map((pr) => (
                <div
                  key={pr.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '1rem',
                    border: '1px solid rgb(229 231 235)',
                    borderRadius: '0.5rem',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgb(156 163 175)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgb(229 231 235)';
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getStateColor(pr.state)}
                      startContent={getStateIcon(pr.state)}
                    >
                      {pr.state}
                    </Chip>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={pr.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontWeight: 500,
                        color: 'rgb(17 24 39)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {pr.title}
                    </Link>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      marginTop: '0.25rem', 
                      fontSize: '0.875rem', 
                      color: 'rgb(75 85 99)' 
                    }}>
                      <span>{pr.repository}</span>
                      <span>•</span>
                      <span>by {pr.user?.login || pr.author}</span>
                      <span>•</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock style={{ width: '0.75rem', height: '0.75rem' }} />
                        <span>{formatDate(pr.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1rem', 
                      marginTop: '0.5rem', 
                      fontSize: '0.75rem', 
                      color: 'rgb(107 114 128)' 
                    }}>
                      <span style={{ color: 'rgb(34 197 94)' }}>+{pr.additions || 0}</span>
                      <span style={{ color: 'rgb(239 68 68)' }}>-{pr.deletions || 0}</span>
                      <span>{pr.review_comments || 0} comments</span>
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <Button
                      as={Link}
                      href={pr.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      isIconOnly
                      variant="light"
                      size="sm"
                    >
                      <ExternalLink style={{ width: '1rem', height: '1rem' }} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const GitHubPullRequests = React.memo(GitHubPullRequestsComponent, (prevProps, nextProps) => {
  return (
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.teamMembers) === JSON.stringify(nextProps.teamMembers)
  );
});