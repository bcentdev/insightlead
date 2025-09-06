import { useState, useEffect, useCallback, useMemo } from 'react';
import { githubService } from '@/modules/github/infrastructure/services/github.service';
import { getCachedGitHubMetrics, cacheGitHubMetrics, getPendingGitHubRequest, setPendingGitHubRequest } from '@/modules/github/ui/services/metrics-cache.service';

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
  readonly timeline?: TimelineData;
  readonly recentPRs?: readonly PRDetail[];
  readonly topReviewers?: readonly TopReviewer[];
  readonly mergeTimeBreakdown?: MergeTimeBreakdown;
};

type TopContributor = {
  readonly author: string;
  readonly prCount: number;
  readonly mergedCount: number;
  readonly avgLinesChanged: number;
  readonly avatar?: string;
  readonly totalPRs: number;
  readonly openPRs: number;
  readonly additions: number;
  readonly deletions: number;
  readonly avgMergeTime?: number;
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

type TimelineData = {
  readonly pullRequests: readonly { date: string; value: number }[];
  readonly mergeRate: readonly { date: string; value: number }[];
  readonly codeChanges: readonly { date: string; value: number }[];
  readonly contributors: readonly { date: string; value: number }[];
  readonly avgMergeTime: readonly { date: string; value: number }[];
  readonly reviewCoverage: readonly { date: string; value: number }[];
  readonly dates: readonly string[];
};

type PRDetail = {
  readonly number: number;
  readonly title: string;
  readonly htmlUrl: string;
  readonly state: string;
  readonly merged: boolean;
  readonly createdAt: string;
  readonly mergedAt?: string;
  readonly author: string;
  readonly reviewCount: number;
};

type TopReviewer = {
  readonly author: string;
  readonly reviewCount: number;
  readonly avatar?: string;
};

type MergeTimeBreakdown = {
  readonly fast: number; // < 24h
  readonly medium: number; // 1-3 days
  readonly slow: number; // > 3 days
};

type UseGitHubMetricsResult = {
  readonly metrics: PRMetrics | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
};

// Pure functions
const calculatePRSize = (additions: number, deletions: number): PRSize => {
  const totalLines = additions + deletions;
  if (totalLines <= 50) return 'small';
  if (totalLines <= 200) return 'medium';
  if (totalLines <= 500) return 'large';
  return 'xlarge';
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
      reviewStats: { withReviews: 0, withoutReviews: 0, avgReviewsPerPR: 0 },
      timeline: { pullRequests: [], mergeRate: [], codeChanges: [], contributors: [], avgMergeTime: [], reviewCoverage: [], dates: [] },
      recentPRs: [],
      topReviewers: [],
      mergeTimeBreakdown: { fast: 0, medium: 0, slow: 0 }
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
        const diffInHours = (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return sum + diffInHours;
      }, 0) / mergedPRsWithTime.length
    : 0;

  const totalAdditions = pullRequests.reduce((sum, pr) => sum + (pr.additions || 0), 0);
  const totalDeletions = pullRequests.reduce((sum, pr) => sum + (pr.deletions || 0), 0);
  const avgLinesChanged = totalPRs > 0 ? (totalAdditions + totalDeletions) / totalPRs : 0;

  const totalReviewComments = pullRequests.reduce((sum, pr) => sum + (pr.review_comments || 0), 0);
  const avgReviewComments = totalPRs > 0 ? totalReviewComments / totalPRs : 0;

  const mergeRate = totalPRs > 0 ? (mergedPRs / totalPRs) * 100 : 0;

  const prsWithReviews = pullRequests.filter(pr => (pr.review_comments || 0) > 0).length;
  const reviewParticipation = totalPRs > 0 ? (prsWithReviews / totalPRs) * 100 : 0;

  // Calculate size distribution
  const sizeDistribution = pullRequests.reduce(
    (acc, pr) => {
      const size = calculatePRSize(pr.additions || 0, pr.deletions || 0);
      return { ...acc, [size]: acc[size] + 1 };
    },
    { small: 0, medium: 0, large: 0, xlarge: 0 }
  );

  // Calculate top contributors with extended data
  const contributorStats = pullRequests.reduce((acc, pr) => {
    const author = pr.user?.login || 'Unknown';
    const existing = acc[author] || { 
      prCount: 0, 
      mergedCount: 0, 
      openCount: 0,
      totalLinesChanged: 0, 
      totalAdditions: 0, 
      totalDeletions: 0,
      totalMergeTime: 0,
      mergedWithTime: 0,
      avatar: undefined
    };
    
    const mergeTime = (pr.state === 'merged' && pr.merged_at && pr.created_at) 
      ? (new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60)
      : 0;
    
    return {
      ...acc,
      [author]: {
        prCount: existing.prCount + 1,
        mergedCount: existing.mergedCount + (pr.state === 'merged' ? 1 : 0),
        openCount: existing.openCount + (pr.state === 'open' ? 1 : 0),
        totalLinesChanged: existing.totalLinesChanged + (pr.additions || 0) + (pr.deletions || 0),
        totalAdditions: existing.totalAdditions + (pr.additions || 0),
        totalDeletions: existing.totalDeletions + (pr.deletions || 0),
        totalMergeTime: existing.totalMergeTime + mergeTime,
        mergedWithTime: existing.mergedWithTime + (mergeTime > 0 ? 1 : 0),
        avatar: existing.avatar || pr.user?.avatar_url
      }
    };
  }, {} as Record<string, { 
    prCount: number; 
    mergedCount: number; 
    openCount: number;
    totalLinesChanged: number;
    totalAdditions: number;
    totalDeletions: number;
    totalMergeTime: number;
    mergedWithTime: number;
    avatar?: string;
  }>);

  const topContributors = Object.entries(contributorStats)
    .map(([author, stats]) => ({
      author,
      prCount: stats.prCount,
      mergedCount: stats.mergedCount,
      avgLinesChanged: stats.prCount > 0 ? stats.totalLinesChanged / stats.prCount : 0,
      avatar: stats.avatar,
      totalPRs: stats.prCount,
      openPRs: stats.openCount,
      additions: stats.totalAdditions,
      deletions: stats.totalDeletions,
      avgMergeTime: stats.mergedWithTime > 0 ? stats.totalMergeTime / stats.mergedWithTime : 0
    }))
    .sort((a, b) => b.prCount - a.prCount)
    .slice(0, 10);

  const reviewStats = {
    withReviews: prsWithReviews,
    withoutReviews: totalPRs - prsWithReviews,
    avgReviewsPerPR: avgReviewComments
  };

  // Calculate recent PRs (last 10)
  const recentPRs = pullRequests
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(pr => ({
      number: pr.number,
      title: pr.title,
      htmlUrl: pr.html_url,
      state: pr.state,
      merged: pr.state === 'merged',
      createdAt: pr.created_at,
      mergedAt: pr.merged_at,
      author: pr.user?.login || 'Unknown',
      reviewCount: pr.review_comments || 0
    }));

  // Calculate top reviewers (based on review comments)
  const reviewerStats = pullRequests.reduce((acc, pr) => {
    if (pr.review_comments > 0) {
      const author = pr.user?.login || 'Unknown';
      const existing = acc[author] || { reviewCount: 0, avatar: undefined };
      return {
        ...acc,
        [author]: {
          reviewCount: existing.reviewCount + pr.review_comments,
          avatar: existing.avatar || pr.user?.avatar_url
        }
      };
    }
    return acc;
  }, {} as Record<string, { reviewCount: number; avatar?: string }>);

  const topReviewers = Object.entries(reviewerStats)
    .map(([author, stats]) => ({
      author,
      reviewCount: stats.reviewCount,
      avatar: stats.avatar
    }))
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 5);

  // Calculate merge time breakdown
  const mergeTimeBreakdown = mergedPRsWithTime.reduce(
    (acc, pr) => {
      const mergedAt = new Date(pr.merged_at!);
      const createdAt = new Date(pr.created_at);
      const diffInHours = (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return { ...acc, fast: acc.fast + 1 };
      } else if (diffInHours < 72) {
        return { ...acc, medium: acc.medium + 1 };
      } else {
        return { ...acc, slow: acc.slow + 1 };
      }
    },
    { fast: 0, medium: 0, slow: 0 }
  );

  // Generate timeline data (last 30 days)
  const generateTimeline = (): TimelineData => {
    const now = new Date();
    const dates: string[] = [];
    const timelineData = {
      pullRequests: [] as { date: string; value: number }[],
      mergeRate: [] as { date: string; value: number }[],
      codeChanges: [] as { date: string; value: number }[],
      contributors: [] as { date: string; value: number }[],
      avgMergeTime: [] as { date: string; value: number }[],
      reviewCoverage: [] as { date: string; value: number }[],
      dates: [] as string[]
    };

    // Generate last 7 days for timeline
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);

      // PRs created on this day
      const dayPRs = pullRequests.filter(pr => 
        pr.created_at.startsWith(dateStr)
      );
      
      // Calculate metrics for this day
      const dayMerged = dayPRs.filter(pr => pr.state === 'merged').length;
      const dayMergeRate = dayPRs.length > 0 ? (dayMerged / dayPRs.length) * 100 : 0;
      const dayCodeChanges = dayPRs.reduce((sum, pr) => sum + (pr.additions || 0) + (pr.deletions || 0), 0);
      const dayContributors = new Set(dayPRs.map(pr => pr.user?.login)).size;
      const dayAvgMergeTime = dayPRs.length > 0 ? 
        dayPRs.reduce((sum, pr) => {
          if (pr.state === 'merged' && pr.merged_at) {
            const mergeTime = (new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60);
            return sum + mergeTime;
          }
          return sum;
        }, 0) / dayPRs.length : 0;
      const dayReviewCoverage = dayPRs.length > 0 ? 
        (dayPRs.filter(pr => (pr.review_comments || 0) > 0).length / dayPRs.length) * 100 : 0;

      timelineData.pullRequests.push({ date: dateStr, value: dayPRs.length });
      timelineData.mergeRate.push({ date: dateStr, value: dayMergeRate });
      timelineData.codeChanges.push({ date: dateStr, value: dayCodeChanges });
      timelineData.contributors.push({ date: dateStr, value: dayContributors });
      timelineData.avgMergeTime.push({ date: dateStr, value: dayAvgMergeTime });
      timelineData.reviewCoverage.push({ date: dateStr, value: dayReviewCoverage });
    }

    timelineData.dates = dates;
    return timelineData;
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
    reviewStats,
    timeline: generateTimeline(),
    recentPRs,
    topReviewers,
    mergeTimeBreakdown
  };
};

export const useGitHubMetrics = (teamMembers: readonly string[], days: number = 30): UseGitHubMetricsResult => {
  const [metrics, setMetrics] = useState<PRMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memorize teamMembers to prevent unnecessary re-renders and add throttling
  const stableTeamMembers = useMemo(() => teamMembers, [JSON.stringify(teamMembers)]);
  
  // Only allow fetching every 2 seconds to prevent spam
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const FETCH_THROTTLE_MS = 2000;

  const fetchMetrics = useCallback(async () => {
    const now = Date.now();
    
    // Throttle: prevent excessive API calls
    if (now - lastFetchTime < FETCH_THROTTLE_MS) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 GitHub Metrics Hook: Throttled, skipping fetch');
      }
      return;
    }
    
    if (stableTeamMembers.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 GitHub Metrics Hook: No team members provided, skipping fetch');
      }
      setMetrics(null);
      return;
    }
    
    setLastFetchTime(now);

    // Verificar cache primero (temporalmente deshabilitado para debug)
    // const cachedData = getCachedGitHubMetrics(stableTeamMembers, days);
    // if (cachedData) {
    //   if (process.env.NODE_ENV === 'development') {
    //     console.log('🐛 GitHub Metrics Hook: Using cached data for:', stableTeamMembers);
    //   }
    //   setMetrics(cachedData);
    //   return;
    // }

    // Verificar si hay una solicitud pendiente para los mismos datos (temporalmente deshabilitado para debug)
    // const pendingRequest = getPendingGitHubRequest(stableTeamMembers, days);
    // if (pendingRequest) {
    //   if (process.env.NODE_ENV === 'development') {
    //     console.log('🐛 GitHub Metrics Hook: Waiting for pending request for:', stableTeamMembers);
    //   }
    //   setIsLoading(true);
    //   try {
    //     const result = await pendingRequest;
    //     setMetrics(result);
    //   } catch (err) {
    //     const errorMessage = err instanceof Error ? err.message : 'Failed to fetch GitHub metrics';
    //     setError(errorMessage);
    //     setMetrics(null);
    //   } finally {
    //     setIsLoading(false);
    //   }
    //   return;
    // }

    setIsLoading(true);
    setError(null);

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🐛 GitHub Metrics Hook: Fetching NEW data for team members:', stableTeamMembers);
        console.log('🐛 GitHub Metrics Hook: Days:', days);
      }
      
      // Crear y registrar la promesa para evitar duplicados
      const fetchPromise = githubService.fetchTeamPullRequests([...stableTeamMembers], days)
        .then(prData => {
          const calculatedMetrics = calculateMetrics(prData.pullRequests);
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🐛 GitHub Metrics Hook: PR data received and cached:', {
              totalPRs: prData.totalPRs,
              pullRequestsLength: prData.pullRequests.length,
              calculatedMetrics: calculatedMetrics
            });
            console.log('🐛 GitHub Metrics Hook: PR repositories breakdown:', 
              prData.pullRequests.reduce((acc, pr) => {
                const repo = pr.repository || 'unknown';
                acc[repo] = (acc[repo] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            );
            console.log('🐛 GitHub Metrics Hook: Sample PRs:', 
              prData.pullRequests.slice(0, 5).map(pr => ({
                title: pr.title,
                repository: pr.repository,
                author: pr.author || pr.user?.login,
                state: pr.state
              }))
            );
          }
          
          return calculatedMetrics;
        });
      
      // setPendingGitHubRequest(stableTeamMembers, days, fetchPromise); // Temporarily disabled for debug
      const calculatedMetrics = await fetchPromise;
      
      // Guardar en cache (temporarily disabled for debug)
      // cacheGitHubMetrics(stableTeamMembers, days, calculatedMetrics);
      setMetrics(calculatedMetrics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch GitHub metrics';
      if (process.env.NODE_ENV === 'development') {
        console.error('🐛 GitHub Metrics Hook: Error fetching metrics:', errorMessage);
      }
      setError(errorMessage);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  }, [stableTeamMembers, days]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics
  };
};