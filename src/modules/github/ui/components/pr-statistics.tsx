import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Spinner } from '@heroui/react';
import { GitPullRequest, GitMerge, Clock, Users, TrendingUp, Activity, Award } from 'lucide-react';
import { MetricCard } from '@/shared/ui/components/metric-card';
import { githubService } from '@/modules/github/infrastructure/services/github.service';

// Types using functional programming approach
type PRSize = 'small' | 'medium' | 'large' | 'xlarge';

type PRMetrics = {
  readonly totalPRs: number;
  readonly mergedPRs: number;
  readonly openPRs: number;
  readonly closedPRs: number;
  readonly avgTimeToMerge: number;
  readonly avgLinesChanged: number;
  readonly avgReviewComments: number;
  readonly mergeRate: number;
  readonly reviewParticipation: number;
  readonly totalAdditions: number;
  readonly totalDeletions: number;
  readonly topContributors: readonly TopContributor[];
  readonly sizeDistribution: SizeDistribution;
  readonly reviewStats: ReviewStats;
};

type TopContributor = {
  readonly username: string;
  readonly prCount: number;
  readonly mergedCount: number;
  readonly avgLinesChanged: number;
};

type SizeDistribution = {
  readonly small: number;
  readonly medium: number;
  readonly large: number;
  readonly xlarge: number;
};

type ReviewStats = {
  readonly withReviews: number;
  readonly withoutReviews: number;
  readonly avgReviewsPerPR: number;
};

type PRStatisticsProps = {
  readonly teamMembers: readonly string[];
  readonly className?: string;
};

// Pure functions
const calculatePRSize = (additions: number, deletions: number): PRSize => {
  const totalLines = additions + deletions;
  if (totalLines <= 50) return 'small';
  if (totalLines <= 200) return 'medium';
  if (totalLines <= 500) return 'large';
  return 'xlarge';
};

const formatDuration = (hours: number): string => {
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};

const calculateMetrics = (pullRequests: readonly any[]): PRMetrics => {
  if (pullRequests.length === 0) {
    return {
      totalPRs: 0,
      mergedPRs: 0,
      openPRs: 0,
      closedPRs: 0,
      avgTimeToMerge: 0,
      avgLinesChanged: 0,
      avgReviewComments: 0,
      mergeRate: 0,
      reviewParticipation: 0,
      totalAdditions: 0,
      totalDeletions: 0,
      topContributors: [],
      sizeDistribution: { small: 0, medium: 0, large: 0, xlarge: 0 },
      reviewStats: { withReviews: 0, withoutReviews: 0, avgReviewsPerPR: 0 }
    };
  }

  const totalPRs = pullRequests.length;
  const mergedPRs = pullRequests.filter(pr => pr.state === 'merged').length;
  const openPRs = pullRequests.filter(pr => pr.state === 'open').length;
  const closedPRs = pullRequests.filter(pr => pr.state === 'closed').length;

  const mergedPRsWithTime = pullRequests.filter(pr => 
    pr.state === 'merged' && pr.merged_at && pr.created_at
  );
  
  const avgTimeToMerge = mergedPRsWithTime.length > 0 
    ? mergedPRsWithTime.reduce((sum, pr) => {
        const mergedAt = new Date(pr.merged_at!);
        const createdAt = new Date(pr.created_at);
        return sum + (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      }, 0) / mergedPRsWithTime.length
    : 0;

  const totalAdditions = pullRequests.reduce((sum, pr) => sum + (pr.additions || 0), 0);
  const totalDeletions = pullRequests.reduce((sum, pr) => sum + (pr.deletions || 0), 0);
  const avgLinesChanged = (totalAdditions + totalDeletions) / totalPRs;

  const totalReviewComments = pullRequests.reduce((sum, pr) => sum + (pr.review_comments || 0), 0);
  const avgReviewComments = totalReviewComments / totalPRs;

  const mergeRate = (mergedPRs / totalPRs) * 100;

  const prsWithReviews = pullRequests.filter(pr => (pr.review_comments || 0) > 0).length;
  const reviewParticipation = (prsWithReviews / totalPRs) * 100;

  const contributorMap = pullRequests.reduce((acc, pr) => {
    const author = pr.user?.login || pr.author;
    const existing = acc.get(author) || { prCount: 0, mergedCount: 0, totalLines: 0 };
    
    return acc.set(author, {
      prCount: existing.prCount + 1,
      mergedCount: existing.mergedCount + (pr.state === 'merged' ? 1 : 0),
      totalLines: existing.totalLines + (pr.additions || 0) + (pr.deletions || 0)
    });
  }, new Map());

  const topContributors = Array.from(contributorMap.entries())
    .map(([username, stats]) => ({
      username,
      prCount: stats.prCount,
      mergedCount: stats.mergedCount,
      avgLinesChanged: stats.prCount > 0 ? stats.totalLines / stats.prCount : 0
    }))
    .sort((a, b) => b.prCount - a.prCount)
    .slice(0, 5);

  const sizeDistribution = pullRequests.reduce((acc, pr) => {
    const size = calculatePRSize(pr.additions || 0, pr.deletions || 0);
    return { ...acc, [size]: acc[size] + 1 };
  }, { small: 0, medium: 0, large: 0, xlarge: 0 });

  const reviewStats = {
    withReviews: prsWithReviews,
    withoutReviews: totalPRs - prsWithReviews,
    avgReviewsPerPR: avgReviewComments
  };

  return {
    totalPRs,
    mergedPRs,
    openPRs,
    closedPRs,
    avgTimeToMerge,
    avgLinesChanged,
    avgReviewComments,
    mergeRate,
    reviewParticipation,
    totalAdditions,
    totalDeletions,
    topContributors,
    sizeDistribution,
    reviewStats
  };
};

const getSizeLabel = (size: PRSize): string => {
  const labels = {
    small: 'Small (≤50 lines)',
    medium: 'Medium (51-200 lines)',
    large: 'Large (201-500 lines)',
    xlarge: 'X-Large (>500 lines)'
  };
  return labels[size];
};

const getSizeColor = (size: PRSize): string => {
  const colors = {
    small: 'bg-green-500',
    medium: 'bg-yellow-500',
    large: 'bg-orange-500',
    xlarge: 'bg-red-500'
  };
  return colors[size];
};

export const PRStatistics = ({ teamMembers, className }: PRStatisticsProps) => {
  const [metrics, setMetrics] = useState<PRMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamMembers.length > 0) {
      fetchPRStatistics();
    }
  }, [teamMembers]);

  const fetchPRStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const prData = await githubService.fetchTeamPullRequests([...teamMembers], 30);
      const calculatedMetrics = calculateMetrics(prData.pullRequests);
      setMetrics(calculatedMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PR statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardBody>
            <div className="flex items-center justify-center p-8">
              <Spinner size="lg" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">PR Statistics</h3>
          </CardHeader>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total PRs"
          value={metrics.totalPRs}
          icon={<GitPullRequest className="w-5 h-5 text-blue-600" />}
          gradient="from-blue-50 to-blue-100"
        />
        <MetricCard
          title="Merged PRs"
          value={metrics.mergedPRs}
          icon={<GitMerge className="w-5 h-5 text-green-600" />}
          gradient="from-green-50 to-green-100"
        />
        <MetricCard
          title="Merge Rate"
          value={`${metrics.mergeRate.toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
          gradient="from-purple-50 to-purple-100"
        />
        <MetricCard
          title="Avg Time to Merge"
          value={formatDuration(metrics.avgTimeToMerge)}
          icon={<Clock className="w-5 h-5 text-orange-600" />}
          gradient="from-orange-50 to-orange-100"
        />
      </div>

      {/* Advanced Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Avg Lines Changed"
          value={Math.round(metrics.avgLinesChanged)}
          icon={<Activity className="w-5 h-5 text-indigo-600" />}
          gradient="from-indigo-50 to-indigo-100"
        />
        <MetricCard
          title="Review Participation"
          value={`${metrics.reviewParticipation.toFixed(1)}%`}
          icon={<Users className="w-5 h-5 text-teal-600" />}
          gradient="from-teal-50 to-teal-100"
        />
        <MetricCard
          title="Avg Reviews per PR"
          value={metrics.avgReviewComments.toFixed(1)}
          icon={<Award className="w-5 h-5 text-pink-600" />}
          gradient="from-pink-50 to-pink-100"
        />
      </div>

      {/* Detailed Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Contributors
            </h4>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {metrics.topContributors.map((contributor, index) => (
                <div key={contributor.username} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{contributor.username}</p>
                      <p className="text-sm text-gray-600">
                        {contributor.mergedCount}/{contributor.prCount} merged
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{contributor.prCount} PRs</p>
                    <p className="text-sm text-gray-600">
                      ~{Math.round(contributor.avgLinesChanged)} lines avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* PR Size Distribution */}
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              PR Size Distribution
            </h4>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {(Object.entries(metrics.sizeDistribution) as Array<[PRSize, number]>).map(([size, count]) => {
                const percentage = metrics.totalPRs > 0 ? (count / metrics.totalPRs) * 100 : 0;
                
                return (
                  <div key={size} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSizeColor(size)}`} />
                      <span className="text-sm">{getSizeLabel(size)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getSizeColor(size)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Code Changes Summary */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Code Changes Summary
          </h4>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">+{metrics.totalAdditions.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Lines Added</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">-{metrics.totalDeletions.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Lines Deleted</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(metrics.avgLinesChanged)}
              </p>
              <p className="text-sm text-gray-600">Avg Lines per PR</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};