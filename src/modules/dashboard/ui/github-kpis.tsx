import React from 'react';
import { MetricCard } from '@/shared/ui/components/metric-card.tsx';
import { Spinner, Button, useDisclosure } from '@heroui/react';
import { GitMerge, GitPullRequest, Clock, Users, Code, MessageCircle, GitCommit, Eye, TrendingUp, BarChart3 } from 'lucide-react';
import { useGitHubMetrics } from '@/modules/github/ui/hooks/use-github-metrics.ts';
import { getTimeFilterDays } from '@/modules/dashboard/ui/time-filter.tsx';
import { MetricsTrendView } from '@/modules/dashboard/ui/metrics-trend-view.tsx';
import { MetricDetailModal } from '@/modules/dashboard/ui/metric-detail-modal.tsx';
import { WidgetContainer } from '@/shared/ui/components/widget-container.tsx';

type GitHubKPIsProps = {
  readonly teamMembers: readonly string[];
  readonly selectedMember?: string | null;
  readonly allMembers?: readonly any[];
  readonly timePeriod?: string;
  readonly activeFilters?: readonly any[];
  readonly isDraggable?: boolean;
  readonly isCustomizing?: boolean;
  readonly isFixed?: boolean;
  readonly dragHandleProps?: any;
};

export const GitHubKPIs = React.memo(({ 
  teamMembers, 
  selectedMember, 
  allMembers, 
  timePeriod = '30d',
  activeFilters = [],
  isDraggable = false,
  isCustomizing = false,
  isFixed = false,
  dragHandleProps
}: GitHubKPIsProps) => {
  const [viewMode, setViewMode] = React.useState<'metrics' | 'trends'>('metrics');
  const [selectedMetric, setSelectedMetric] = React.useState<any>(null);
  const { isOpen: isDetailModalOpen, onOpen: onDetailModalOpen, onClose: onDetailModalClose } = useDisclosure();
  
  // Filter team members if a specific member is selected
  const filteredMembers = React.useMemo(() => {
    if (selectedMember && allMembers) {
      const selectedMemberData = allMembers.find(member => member.id === selectedMember);
      return selectedMemberData?.githubUsername ? [selectedMemberData.githubUsername] : [];
    }
    return teamMembers;
  }, [selectedMember, allMembers, teamMembers]);
  
  const days = getTimeFilterDays(timePeriod);
  const { metrics, isLoading, error } = useGitHubMetrics(filteredMembers, days);

  // Function to apply active filters to data
  const applyFilters = React.useCallback((data: any[], filterType: 'repositories' | 'teamMembers' | 'prStatuses') => {
    if (!activeFilters.length) return data;

    return data.filter(item => {
      // Apply repository filters
      const repoFilters = activeFilters.filter(f => f.key?.startsWith('repo-'));
      if (repoFilters.length > 0 && filterType === 'repositories') {
        const allowedRepos = repoFilters.map(f => f.key.replace('repo-', ''));
        const itemRepo = item.repository || item.repo;
        if (itemRepo && !allowedRepos.includes(itemRepo)) return false;
      }

      // Apply team member filters
      const memberFilters = activeFilters.filter(f => f.key?.startsWith('member-'));
      if (memberFilters.length > 0 && filterType === 'teamMembers') {
        const allowedMembers = memberFilters.map(f => f.key.replace('member-', ''));
        const memberData = allMembers?.find(m => m.id === f.key.replace('member-', ''));
        const itemAuthor = item.author || item.user?.login;
        if (itemAuthor && memberData?.githubUsername !== itemAuthor) return false;
      }

      // Apply PR status filters
      const statusFilters = activeFilters.filter(f => f.key?.startsWith('pr-'));
      if (statusFilters.length > 0 && filterType === 'prStatuses') {
        const allowedStatuses = statusFilters.map(f => f.key.replace('pr-', ''));
        if (!allowedStatuses.includes(item.state)) return false;
      }

      return true;
    });
  }, [activeFilters, allMembers]);

  // Debug logging
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 GitHub KPIs Debug:');
      console.log('- Team Members (original):', teamMembers);
      console.log('- All Members:', allMembers);
      console.log('- Filtered Members:', filteredMembers);
      console.log('- Days:', days);
      console.log('- Time Period:', timePeriod);
      console.log('- Selected Member:', selectedMember);
      console.log('- Is Loading:', isLoading);
      console.log('- Error:', error);
      console.log('- Metrics:', metrics);
      console.log('- Condition check - No filter applied:', !selectedMember);
      console.log('- Condition check - Using all team members:', filteredMembers.length === teamMembers.length);
    }
  }, [teamMembers, allMembers, filteredMembers, days, timePeriod, selectedMember, isLoading, error, metrics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !metrics) {
    // Show error message if there's an actual error
    if (error) {
      return (
        <WidgetContainer
          icon={GitPullRequest}
          title="GitHub KPIs"
          subtitle="Development activity and code quality metrics"
          isDraggable={isDraggable}
          isCustomizing={isCustomizing}
          isFixed={isFixed}
          dragHandleProps={dragHandleProps}
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        </WidgetContainer>
      );
    }
    
    // Show message if no team members are configured
    if (teamMembers.length === 0) {
      return (
        <WidgetContainer
          icon={GitPullRequest}
          title="GitHub KPIs"
          subtitle="Development activity and code quality metrics"
          isDraggable={isDraggable}
          isCustomizing={isCustomizing}
          isFixed={isFixed}
          dragHandleProps={dragHandleProps}
        >
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              No hay miembros del equipo con usernames de GitHub configurados.
            </p>
          </div>
        </WidgetContainer>
      );
    }
    
    // Show message if no data is available but configuration seems correct
    if (!metrics && teamMembers.length > 0) {
      return (
        <WidgetContainer
          icon={GitPullRequest}
          title="GitHub KPIs"
          subtitle="Development activity and code quality metrics"
          isDraggable={isDraggable}
          isCustomizing={isCustomizing}
          isFixed={isFixed}
          dragHandleProps={dragHandleProps}
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              No se encontraron datos para el período seleccionado. Prueba con un período de tiempo más amplio.
            </p>
          </div>
        </WidgetContainer>
      );
    }
    
    return null;
  }

  const formatDuration = (hours: number): string => {
    if (hours < 1) return '< 1h';
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.round(hours / 24);
    return `${days}d`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleMetricClick = (metricType: string, kpi: any) => {
    // Generate detailed data based on real GitHub metrics with filters applied
    const generateRealDetailData = () => {
      // Apply filters to data before showing in modal
      const filteredRecentPRs = applyFilters(metrics.recentPRs || [], 'repositories');
      const filteredContributors = applyFilters(metrics.topContributors || [], 'teamMembers');
      
      switch (metricType) {
        case 'pullrequests':
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: [
              { label: 'Open PRs', value: metrics.openPRs, percentage: Math.round((metrics.openPRs / metrics.totalPRs) * 100) || 0, color: 'warning' },
              { label: 'Merged PRs', value: metrics.mergedPRs, percentage: Math.round((metrics.mergedPRs / metrics.totalPRs) * 100) || 0, color: 'success' },
              { label: 'Closed PRs', value: metrics.totalPRs - metrics.openPRs - metrics.mergedPRs, percentage: Math.round(((metrics.totalPRs - metrics.openPRs - metrics.mergedPRs) / metrics.totalPRs) * 100) || 0, color: 'danger' },
            ],
            timeline: metrics.timeline?.pullRequests || [],
            contributors: filteredContributors.slice(0, 5).map(contributor => ({
              name: contributor.author,
              avatar: contributor.avatar,
              value: contributor.totalPRs,
              change: contributor.mergedPRs - contributor.openPRs,
            })),
            relatedItems: filteredRecentPRs.slice(0, 5).map(pr => ({
              title: `#${pr.number} ${pr.title}`,
              url: pr.htmlUrl,
              status: pr.state === 'open' ? 'Open' : pr.merged ? 'Merged' : 'Closed',
              createdAt: pr.createdAt,
            })) || [],
          };
        
        case 'mergesuccessrate':
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: [
              { label: 'Successfully Merged', value: metrics.mergedPRs, percentage: Math.round(metrics.mergeRate), color: 'success' },
              { label: 'Failed/Closed', value: metrics.totalPRs - metrics.mergedPRs - metrics.openPRs, percentage: Math.round(100 - metrics.mergeRate), color: 'danger' },
            ],
            timeline: metrics.timeline?.mergeRate || [],
            contributors: filteredContributors.slice(0, 5).map(contributor => ({
              name: contributor.author,
              avatar: contributor.avatar,
              value: Math.round((contributor.mergedPRs / contributor.totalPRs) * 100) || 0,
              change: 0, // Could calculate week-over-week change here
            })),
            relatedItems: filteredRecentPRs.filter(pr => pr.merged).slice(0, 5).map(pr => ({
              title: `#${pr.number} ${pr.title}`,
              url: pr.htmlUrl,
              status: 'Merged',
              createdAt: pr.mergedAt || pr.createdAt,
            })) || [],
          };
        
        case 'avgmergetime':
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: [
              { label: 'Fast (< 24h)', value: metrics.mergeTimeBreakdown?.fast || 0, percentage: 30, color: 'success' },
              { label: 'Medium (1-3 days)', value: metrics.mergeTimeBreakdown?.medium || 0, percentage: 50, color: 'warning' },
              { label: 'Slow (> 3 days)', value: metrics.mergeTimeBreakdown?.slow || 0, percentage: 20, color: 'danger' },
            ],
            timeline: metrics.timeline?.avgMergeTime || [],
            contributors: filteredContributors.slice(0, 5).map(contributor => ({
              name: contributor.author,
              avatar: contributor.avatar,
              value: contributor.avgMergeTime || 0,
              change: 0, // Could calculate change here
            })),
            relatedItems: filteredRecentPRs.filter(pr => pr.merged).slice(0, 5).map(pr => ({
              title: `#${pr.number} ${pr.title}`,
              url: pr.htmlUrl,
              status: 'Merged',
              createdAt: pr.mergedAt || pr.createdAt,
            })) || [],
          };
        
        case 'activecontributors':
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: filteredContributors.slice(0, 5).map((contributor, index) => ({
              label: contributor.author,
              value: contributor.totalPRs,
              percentage: Math.round((contributor.totalPRs / metrics.totalPRs) * 100) || 0,
              color: ['primary', 'success', 'warning', 'secondary', 'danger'][index] || 'default',
            })),
            timeline: metrics.timeline?.contributors || [],
            contributors: filteredContributors.slice(0, 10).map(contributor => ({
              name: contributor.author,
              avatar: contributor.avatar,
              value: contributor.totalPRs,
              change: contributor.additions - contributor.deletions,
            })),
            relatedItems: filteredContributors.slice(0, 5).flatMap(contributor => 
              filteredRecentPRs.filter(pr => pr.author === contributor.author).slice(0, 1).map(pr => ({
                title: `#${pr.number} ${pr.title}`,
                url: pr.htmlUrl,
                status: pr.state === 'open' ? 'Open' : pr.merged ? 'Merged' : 'Closed',
                createdAt: pr.createdAt,
              })) || []
            ),
          };
        
        case 'codechanges':
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: [
              { label: 'Additions', value: metrics.totalAdditions, percentage: Math.round((metrics.totalAdditions / (metrics.totalAdditions + metrics.totalDeletions)) * 100) || 50, color: 'success' },
              { label: 'Deletions', value: metrics.totalDeletions, percentage: Math.round((metrics.totalDeletions / (metrics.totalAdditions + metrics.totalDeletions)) * 100) || 50, color: 'danger' },
            ],
            timeline: metrics.timeline?.codeChanges || [],
            contributors: filteredContributors.slice(0, 5).map(contributor => ({
              name: contributor.author,
              avatar: contributor.avatar,
              value: contributor.additions + contributor.deletions,
              change: contributor.additions - contributor.deletions,
            })),
            relatedItems: filteredRecentPRs.slice(0, 5).map(pr => ({
              title: `#${pr.number} ${pr.title}`,
              url: pr.htmlUrl,
              status: pr.state === 'open' ? 'Open' : pr.merged ? 'Merged' : 'Closed',
              createdAt: pr.createdAt,
            })) || [],
          };
        
        case 'reviewcoverage':
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: [
              { label: 'Reviewed PRs', value: Math.round(metrics.totalPRs * (metrics.reviewParticipation / 100)), percentage: Math.round(metrics.reviewParticipation), color: 'success' },
              { label: 'Unreviewed PRs', value: Math.round(metrics.totalPRs * ((100 - metrics.reviewParticipation) / 100)), percentage: Math.round(100 - metrics.reviewParticipation), color: 'warning' },
            ],
            timeline: metrics.timeline?.reviewCoverage || [],
            contributors: metrics.topReviewers?.slice(0, 5).map(reviewer => ({
              name: reviewer.author,
              avatar: reviewer.avatar,
              value: reviewer.reviewCount,
              change: 0, // Could calculate change here
            })) || [],
            relatedItems: filteredRecentPRs.filter(pr => pr.reviewCount > 0).slice(0, 5).map(pr => ({
              title: `#${pr.number} ${pr.title}`,
              url: pr.htmlUrl,
              status: pr.state === 'open' ? 'Open' : pr.merged ? 'Merged' : 'Closed',
              createdAt: pr.createdAt,
            })) || [],
          };
        
        default:
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: [],
            timeline: [],
            contributors: [],
            relatedItems: [],
          };
      }
    };
    
    const detailData = generateRealDetailData();
    setSelectedMetric({ type: metricType, data: detailData });
    onDetailModalOpen();
  };

  const kpis = [
    {
      title: 'Pull Requests',
      value: metrics.totalPRs,
      subtitle: `${metrics.openPRs} open, ${metrics.mergedPRs} merged`,
      icon: <GitPullRequest className="w-5 h-5 text-blue-600" />,
      gradient: 'from-blue-50 to-blue-100',
      tooltip: 'Total number of pull requests created. A good indicator of development activity and collaboration.',
      trend: metrics.totalPRs > 0 ? {
        value: Math.round(metrics.mergeRate),
        isPositive: metrics.mergeRate > 80
      } : undefined
    },
    {
      title: 'Merge Success Rate',
      value: `${Math.round(metrics.mergeRate)}%`,
      subtitle: 'PRs successfully merged',
      icon: <GitMerge className="w-5 h-5 text-green-600" />,
      gradient: 'from-green-50 to-green-100',
      tooltip: 'Percentage of pull requests that get successfully merged. Higher rates indicate good code quality and team collaboration.',
      trend: {
        value: Math.round(metrics.mergeRate),
        isPositive: metrics.mergeRate > 75
      }
    },
    {
      title: 'Avg Merge Time',
      value: formatDuration(metrics.avgTimeToMerge),
      subtitle: 'Time from creation to merge',
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      gradient: 'from-orange-50 to-orange-100',
      tooltip: 'Average time from PR creation to merge. Shorter times indicate efficient code review processes.',
      trend: {
        value: metrics.avgTimeToMerge,
        isPositive: metrics.avgTimeToMerge < 48
      }
    },
    {
      title: 'Active Contributors',
      value: metrics.topContributors.length,
      subtitle: `${metrics.topContributors.slice(0, 3).map(c => c.author).join(', ')}`,
      icon: <Users className="w-5 h-5 text-purple-600" />,
      gradient: 'from-purple-50 to-purple-100',
      tooltip: 'Number of team members actively contributing code. More contributors indicate healthy team participation.'
    },
    {
      title: 'Code Changes',
      value: formatNumber(metrics.totalAdditions + metrics.totalDeletions),
      subtitle: `+${formatNumber(metrics.totalAdditions)} -${formatNumber(metrics.totalDeletions)}`,
      icon: <Code className="w-5 h-5 text-indigo-600" />,
      gradient: 'from-indigo-50 to-indigo-100',
      tooltip: 'Total lines of code added and removed. Indicates development activity and code maintenance.'
    },
    {
      title: 'Review Coverage',
      value: `${Math.round(metrics.reviewParticipation)}%`,
      subtitle: 'PRs with code reviews',
      icon: <Eye className="w-5 h-5 text-teal-600" />,
      gradient: 'from-teal-50 to-teal-100',
      tooltip: 'Percentage of PRs that received code reviews. Higher coverage indicates better code quality assurance.',
      trend: {
        value: Math.round(metrics.reviewParticipation),
        isPositive: metrics.reviewParticipation > 70
      }
    }
  ];

  // Use real trend data from metrics
  const trendData = {
    pullRequests: metrics.timeline?.pullRequests || [],
    mergeRate: metrics.timeline?.mergeRate || [],
    codeChanges: metrics.timeline?.codeChanges || [],
    contributors: metrics.timeline?.contributors || [],
    dates: metrics.timeline?.dates || []
  };

  return (
    <WidgetContainer
      icon={GitPullRequest}
      title="GitHub KPIs"
      subtitle="Development activity and code quality metrics"
      isDraggable={isDraggable}
      isCustomizing={isCustomizing}
      isFixed={isFixed}
      dragHandleProps={dragHandleProps}
      headerActions={
        <>
          <Button
            size="sm"
            variant={viewMode === 'metrics' ? 'solid' : 'ghost'}
            color="primary"
            startContent={<BarChart3 className="w-4 h-4" />}
            onPress={() => setViewMode('metrics')}
          >
            Metrics
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'trends' ? 'solid' : 'ghost'}
            color="primary"
            startContent={<TrendingUp className="w-4 h-4" />}
            onPress={() => setViewMode('trends')}
          >
            Trends
          </Button>
        </>
      }
    >

      {viewMode === 'metrics' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <MetricCard
              key={kpi.title}
              title={kpi.title}
              value={kpi.value}
              subtitle={kpi.subtitle}
              icon={kpi.icon}
              gradient={kpi.gradient}
              tooltip={kpi.tooltip}
              trend={kpi.trend}
              onClick={() => handleMetricClick(kpi.title.toLowerCase().replace(' ', ''), kpi)}
              isClickable={true}
            />
          ))}
        </div>
      ) : (
        <MetricsTrendView
          data={trendData}
          timePeriod={timePeriod}
          selectedMember={selectedMember}
        />
      )}
      
      {/* Metric Detail Modal */}
      {selectedMetric && (
        <MetricDetailModal
          isOpen={isDetailModalOpen}
          onClose={onDetailModalClose}
          metricType={selectedMetric.type}
          data={selectedMetric.data}
          timePeriod={timePeriod}
        />
      )}
    </WidgetContainer>
  );
});

GitHubKPIs.displayName = 'GitHubKPIs';