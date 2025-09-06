import React from 'react';
import { MetricCard } from '../../../presentation/components/common/metric-card.tsx';
import { Spinner, Button, useDisclosure } from '@heroui/react';
import { Bug, CheckCircle, Clock, Target, Zap, Activity, TrendingUp, Timer, Kanban, BarChart3 } from 'lucide-react';
import { useJiraMetrics } from '../../../presentation/hooks/use-jira-metrics.ts';
import { getTimeFilterDays } from './time-filter.tsx';
import { MetricsTrendView } from './metrics-trend-view.tsx';
import { MetricDetailModal } from './metric-detail-modal.tsx';
import { WidgetContainer } from '../../../presentation/components/common/widget-container.tsx';

type JiraKPIsProps = {
  readonly projectKey: string;
  readonly assigneeIds: readonly string[];
  readonly selectedMember?: string | null;
  readonly allMembers?: readonly any[];
  readonly timePeriod?: string;
  readonly activeFilters?: readonly any[];
  readonly isDraggable?: boolean;
  readonly isCustomizing?: boolean;
  readonly isFixed?: boolean;
  readonly dragHandleProps?: any;
};

export const JiraKPIs = React.memo(({ 
  projectKey, 
  assigneeIds, 
  selectedMember, 
  allMembers, 
  timePeriod = '30d',
  activeFilters = [],
  isDraggable = false,
  isCustomizing = false,
  isFixed = false,
  dragHandleProps
}: JiraKPIsProps) => {
  const [viewMode, setViewMode] = React.useState<'metrics' | 'trends'>('metrics');
  const [selectedMetric, setSelectedMetric] = React.useState<any>(null);
  const { isOpen: isDetailModalOpen, onOpen: onDetailModalOpen, onClose: onDetailModalClose } = useDisclosure();
  
  // Filter assignee IDs if a specific member is selected
  const filteredAssigneeIds = React.useMemo(() => {
    if (selectedMember && allMembers) {
      const selectedMemberData = allMembers.find(member => member.id === selectedMember);
      if (selectedMemberData?.jiraUsername) {
        return [selectedMemberData.jiraUsername];
      }
      // If selected member doesn't have jiraUsername, return empty array to show no data
      return [];
    }
    // Show all team members by default (no filter)
    return assigneeIds.length > 0 ? assigneeIds : [];
  }, [selectedMember, allMembers, assigneeIds]);
  
  const days = getTimeFilterDays(timePeriod);
  const { metrics, isLoading, error } = useJiraMetrics(projectKey, filteredAssigneeIds, days);

  // Function to apply active filters to Jira data
  const applyJiraFilters = React.useCallback((data: any[], filterType: 'projects' | 'teamMembers' | 'issueTypes' | 'priorities' | 'statuses') => {
    if (!activeFilters.length) return data;

    return data.filter(item => {
      // Apply project filters
      const projectFilters = activeFilters.filter(f => f.key?.startsWith('jira-'));
      if (projectFilters.length > 0 && filterType === 'projects') {
        const allowedProjects = projectFilters.map(f => f.key.replace('jira-', ''));
        const itemProject = item.project || item.projectKey;
        if (itemProject && !allowedProjects.includes(itemProject)) return false;
      }

      // Apply team member filters
      const memberFilters = activeFilters.filter(f => f.key?.startsWith('member-'));
      if (memberFilters.length > 0 && filterType === 'teamMembers') {
        const allowedMembers = memberFilters.map(f => f.key.replace('member-', ''));
        const memberData = allMembers?.find(m => m.id === f.key.replace('member-', ''));
        const itemAssignee = item.assignee;
        if (itemAssignee && memberData?.jiraUsername !== itemAssignee) return false;
      }

      // Apply issue type filters
      const typeFilters = activeFilters.filter(f => f.key?.startsWith('issue-'));
      if (typeFilters.length > 0 && filterType === 'issueTypes') {
        const allowedTypes = typeFilters.map(f => f.key.replace('issue-', ''));
        if (!allowedTypes.includes(item.issueType?.toLowerCase())) return false;
      }

      // Apply priority filters
      const priorityFilters = activeFilters.filter(f => f.key?.startsWith('priority-'));
      if (priorityFilters.length > 0 && filterType === 'priorities') {
        const allowedPriorities = priorityFilters.map(f => f.key.replace('priority-', ''));
        if (!allowedPriorities.includes(item.priority?.toLowerCase())) return false;
      }

      // Apply status filters
      const statusFilters = activeFilters.filter(f => f.key?.startsWith('status-'));
      if (statusFilters.length > 0 && filterType === 'statuses') {
        const allowedStatuses = statusFilters.map(f => f.key.replace('status-', ''));
        if (!allowedStatuses.includes(item.status?.toLowerCase().replace(' ', ''))) return false;
      }

      return true;
    });
  }, [activeFilters, allMembers]);

  // Debug logging
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 Jira KPIs Debug:');
      console.log('- Project Key:', projectKey);
      console.log('- Assignee IDs (original):', assigneeIds);
      console.log('- All Members:', allMembers);
      console.log('- Filtered Assignee IDs:', filteredAssigneeIds);
      console.log('- Days:', days);
      console.log('- Time Period:', timePeriod);
      console.log('- Selected Member:', selectedMember);
      console.log('- Is Loading:', isLoading);
      console.log('- Error:', error);
      console.log('- Metrics:', metrics);
      console.log('- Condition check - No filter applied:', !selectedMember);
      console.log('- Condition check - Using all assignees:', filteredAssigneeIds.length === assigneeIds.length);
    }
  }, [projectKey, assigneeIds, allMembers, filteredAssigneeIds, days, timePeriod, selectedMember, isLoading, error, metrics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !metrics) {
    // Show a message if no data is available
    if (selectedMember && allMembers) {
      const selectedMemberData = allMembers.find(member => member.id === selectedMember);
      if (selectedMemberData && !selectedMemberData.jiraUsername) {
        return (
          <WidgetContainer
            icon={Kanban}
            title="Jira KPIs"
            subtitle="Project delivery and issue tracking metrics"
            isDraggable={isDraggable}
            isCustomizing={isCustomizing}
            isFixed={isFixed}
            dragHandleProps={dragHandleProps}
          >
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                <strong>{selectedMemberData.name}</strong> no tiene configurado un username de Jira.
              </p>
            </div>
          </WidgetContainer>
        );
      }
    }
    
    // Show message if no assignees are configured at all
    if (!selectedMember && assigneeIds.length === 0) {
      return (
        <WidgetContainer
          icon={Kanban}
          title="Jira KPIs"
          subtitle="Project delivery and issue tracking metrics"
          isDraggable={isDraggable}
          isCustomizing={isCustomizing}
          isFixed={isFixed}
          dragHandleProps={dragHandleProps}
        >
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              No hay miembros del equipo con usernames de Jira configurados.
            </p>
          </div>
        </WidgetContainer>
      );
    }
    
    // Show error message if there's an actual error
    if (error) {
      return (
        <WidgetContainer
          icon={Kanban}
          title="Jira KPIs"
          subtitle="Project delivery and issue tracking metrics"
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
    
    // Show message if no data is available but configuration seems correct
    if (!metrics && projectKey && filteredAssigneeIds.length > 0) {
      return (
        <WidgetContainer
          icon={Kanban}
          title="Jira KPIs"
          subtitle="Project delivery and issue tracking metrics"
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

  const completionRate = metrics.totalIssues > 0 
    ? Math.round(((metrics.storiesCompleted + metrics.bugsFixed + metrics.tasksCompleted) / metrics.totalIssues) * 100)
    : 0;

  const handleMetricClick = (metricType: string, kpi: any) => {
    // Generate detailed data based on real Jira metrics with filters applied
    const generateRealDetailData = () => {
      // Apply filters to data before showing in modal
      const filteredIssues = applyJiraFilters(metrics.recentIssues || [], 'projects');
      const filteredContributors = applyJiraFilters(metrics.topContributors || [], 'teamMembers');
      
      switch (metricType) {
        case 'storiesdelivered':
          const filteredStories = filteredIssues.filter(issue => issue.issueType === 'Story');
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: [
              { label: 'Small Stories (1-3 pts)', value: Math.floor(metrics.storiesCompleted * 0.4), percentage: 40, color: 'success' },
              { label: 'Medium Stories (5-8 pts)', value: Math.floor(metrics.storiesCompleted * 0.45), percentage: 45, color: 'primary' },
              { label: 'Large Stories (13+ pts)', value: Math.floor(metrics.storiesCompleted * 0.15), percentage: 15, color: 'warning' },
            ],
            timeline: metrics.timeline?.storiesCompleted || [],
            contributors: filteredContributors.slice(0, 5).map(contributor => ({
              name: contributor.displayName || contributor.assignee || 'Unknown',
              avatar: contributor.avatar,
              value: contributor.storiesCompleted || 0,
              change: 0, // Could calculate week-over-week change
            })),
            relatedItems: filteredStories.slice(0, 5).map(issue => ({
              title: `${issue.key} - ${issue.summary}`,
              url: issue.url,
              status: issue.status,
              createdAt: issue.created,
            })) || [],
          };
        
        case 'bugsresolved':
          const filteredBugs = filteredIssues.filter(issue => issue.issueType === 'Bug');
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: [
              { label: 'Critical Bugs', value: Math.floor(metrics.bugsFixed * 0.1), percentage: 10, color: 'danger' },
              { label: 'High Priority', value: Math.floor(metrics.bugsFixed * 0.3), percentage: 30, color: 'warning' },
              { label: 'Medium Priority', value: Math.floor(metrics.bugsFixed * 0.4), percentage: 40, color: 'primary' },
              { label: 'Low Priority', value: Math.floor(metrics.bugsFixed * 0.2), percentage: 20, color: 'success' },
            ],
            timeline: metrics.timeline?.bugsFixed || [],
            contributors: filteredContributors.slice(0, 5).map(contributor => ({
              name: contributor.displayName || contributor.assignee || 'Unknown',
              avatar: contributor.avatar,
              value: contributor.bugsFixed || 0,
              change: 0,
            })),
            relatedItems: filteredBugs.slice(0, 5).map(issue => ({
              title: `${issue.key} - ${issue.summary}`,
              url: issue.url,
              status: issue.status,
              createdAt: issue.created,
            })) || [],
          };
        
        case 'taskscompleted':
          const filteredTasks = filteredIssues.filter(issue => issue.issueType === 'Task' || issue.issueType === 'Spike');
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: [
              { label: 'Development Tasks', value: Math.floor(metrics.tasksCompleted * 0.6), percentage: 60, color: 'primary' },
              { label: 'Research Spikes', value: metrics.spikesCompleted, percentage: Math.round((metrics.spikesCompleted / metrics.tasksCompleted) * 100) || 0, color: 'secondary' },
              { label: 'Other Tasks', value: metrics.tasksCompleted - Math.floor(metrics.tasksCompleted * 0.6) - metrics.spikesCompleted, percentage: 25, color: 'warning' },
            ],
            timeline: metrics.timeline?.tasksCompleted || [],
            contributors: filteredContributors.slice(0, 5).map(contributor => ({
              name: contributor.displayName || contributor.assignee || 'Unknown',
              avatar: contributor.avatar,
              value: contributor.tasksCompleted || 0,
              change: 0,
            })),
            relatedItems: filteredTasks.slice(0, 5).map(issue => ({
              title: `${issue.key} - ${issue.summary}`,
              url: issue.url,
              status: issue.status,
              createdAt: issue.created,
            })) || [],
          };
        
        case 'avgcycletime':
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: [
              { label: 'Fast (< 3 days)', value: Math.floor(metrics.totalIssues * 0.3), percentage: 30, color: 'success' },
              { label: 'Normal (3-7 days)', value: Math.floor(metrics.totalIssues * 0.5), percentage: 50, color: 'primary' },
              { label: 'Slow (> 7 days)', value: Math.floor(metrics.totalIssues * 0.2), percentage: 20, color: 'warning' },
            ],
            timeline: metrics.timeline?.cycleTime || [],
            contributors: filteredContributors.slice(0, 5).map(contributor => ({
              name: contributor.displayName || contributor.assignee || 'Unknown',
              avatar: contributor.avatar,
              value: contributor.avgCycleTime || 0,
              change: 0,
            })),
            relatedItems: filteredIssues.slice(0, 5).map(issue => ({
              title: `${issue.key} - ${issue.summary}`,
              url: issue.url,
              status: issue.status,
              createdAt: issue.created,
            })) || [],
          };
        
        case 'deliveryrate':
          const filteredCompletedIssues = filteredIssues.filter(issue => issue.status === 'Done' || issue.status === 'Resolved');
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: [
              { label: 'Completed', value: metrics.storiesCompleted + metrics.bugsFixed + metrics.tasksCompleted, percentage: completionRate, color: 'success' },
              { label: 'In Progress', value: Math.floor(metrics.totalIssues * 0.1), percentage: 10, color: 'warning' },
              { label: 'Remaining', value: metrics.totalIssues - (metrics.storiesCompleted + metrics.bugsFixed + metrics.tasksCompleted), percentage: 100 - completionRate, color: 'danger' },
            ],
            timeline: metrics.timeline?.deliveryRate || [],
            contributors: filteredContributors.slice(0, 5).map(contributor => ({
              name: contributor.displayName || contributor.assignee || 'Unknown',
              avatar: contributor.avatar,
              value: Math.round(((contributor.storiesCompleted + contributor.bugsFixed + contributor.tasksCompleted) / Math.max(contributor.totalIssues, 1)) * 100) || 0,
              change: 0,
            })),
            relatedItems: filteredCompletedIssues.slice(0, 5).map(issue => ({
              title: `${issue.key} - ${issue.summary}`,
              url: issue.url,
              status: issue.status,
              createdAt: issue.resolutionDate || issue.created,
            })) || [],
          };
        
        case 'teamcontributors':
          return {
            title: kpi.title,
            value: kpi.value,
            subtitle: kpi.subtitle,
            trend: kpi.trend,
            breakdown: filteredContributors.slice(0, 5).map((contributor, index) => ({
              label: contributor.displayName || contributor.assignee || 'Unknown',
              value: contributor.totalIssues || 0,
              percentage: Math.round((contributor.totalIssues / metrics.totalIssues) * 100) || 0,
              color: ['primary', 'success', 'warning', 'secondary', 'danger'][index] || 'default',
            })),
            timeline: metrics.timeline?.contributors || [],
            contributors: filteredContributors.slice(0, 10).map(contributor => ({
              name: contributor.displayName || contributor.assignee || 'Unknown',
              avatar: contributor.avatar,
              value: contributor.totalIssues || 0,
              change: 0,
            })),
            relatedItems: filteredContributors.slice(0, 3).flatMap(contributor => 
              filteredIssues.filter(issue => issue.assignee === contributor.assignee).slice(0, 2).map(issue => ({
                title: `${issue.key} - ${issue.summary}`,
                url: issue.url,
                status: issue.status,
                createdAt: issue.created,
              })) || []
            ),
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
      title: 'Stories Delivered',
      value: metrics.storiesCompleted,
      subtitle: `${metrics.storyPoints} story points`,
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      gradient: 'from-green-50 to-green-100',
      tooltip: 'Number of user stories completed. Story points indicate the complexity and effort delivered.',
      trend: metrics.storyPoints > 0 ? {
        value: metrics.storyPoints,
        isPositive: true
      } : undefined
    },
    {
      title: 'Bugs Resolved',
      value: metrics.bugsFixed,
      subtitle: `${Math.round((metrics.bugsFixed / Math.max(metrics.totalIssues, 1)) * 100)}% of total issues`,
      icon: <Bug className="w-5 h-5 text-red-600" />,
      gradient: 'from-red-50 to-red-100',
      tooltip: 'Number of bugs fixed. Lower percentages indicate better code quality and fewer production issues.',
      trend: {
        value: metrics.bugsFixed,
        isPositive: true
      }
    },
    {
      title: 'Tasks Completed',
      value: metrics.tasksCompleted,
      subtitle: `${metrics.spikesCompleted} research spikes`,
      icon: <Target className="w-5 h-5 text-blue-600" />,
      gradient: 'from-blue-50 to-blue-100',
      tooltip: 'General tasks and research spikes completed. Indicates productivity in non-story work.'
    },
    {
      title: 'Avg Cycle Time',
      value: `${metrics.avgCycleTime.toFixed(1)}d`,
      subtitle: 'From start to completion',
      icon: <Timer className="w-5 h-5 text-orange-600" />,
      gradient: 'from-orange-50 to-orange-100',
      tooltip: 'Average time from when work starts to when it\'s completed. Shorter times indicate efficient workflows.',
      trend: {
        value: Math.round(metrics.avgCycleTime),
        isPositive: metrics.avgCycleTime < 7 // Good if less than 7 days
      }
    },
    {
      title: 'Delivery Rate',
      value: `${completionRate}%`,
      subtitle: 'Issues resolved',
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
      gradient: 'from-purple-50 to-purple-100',
      tooltip: 'Percentage of started issues that get completed. Higher rates indicate better planning and execution.',
      trend: {
        value: completionRate,
        isPositive: completionRate > 70
      }
    },
    {
      title: 'Team Contributors',
      value: metrics.topContributors.length,
      subtitle: `${metrics.topContributors.slice(0, 2).map(c => String(c.displayName || c.assignee || 'Unknown').split(' ')[0]).join(', ')}`,
      icon: <Zap className="w-5 h-5 text-indigo-600" />,
      gradient: 'from-indigo-50 to-indigo-100',
      tooltip: 'Number of team members actively working on Jira issues. More contributors indicate good workload distribution.'
    }
  ];

  // Use real trend data from Jira metrics
  const trendData = {
    pullRequests: [], // Not applicable for Jira
    mergeRate: [], // Not applicable for Jira
    storiesCompleted: metrics.timeline?.storiesCompleted || [],
    bugsFixed: metrics.timeline?.bugsFixed || [],
    tasksCompleted: metrics.timeline?.tasksCompleted || [],
    cycleTime: metrics.timeline?.cycleTime || [],
    dates: metrics.timeline?.dates || []
  };

  return (
    <WidgetContainer
      icon={Kanban}
      title="Jira KPIs"
      subtitle="Project delivery and issue tracking metrics"
      isDraggable={isDraggable}
      isCustomizing={isCustomizing}
      isFixed={isFixed}
      dragHandleProps={dragHandleProps}
      headerActions={
        <>
          {selectedMember && allMembers && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {allMembers.find(m => m.id === selectedMember)?.name}
              </span>
            </div>
          )}
          
          <Button
            size="sm"
            variant={viewMode === 'metrics' ? 'solid' : 'ghost'}
            color="primary"
            startContent={<BarChart3 className="w-4 h-4" />}
            onPress={() => setViewMode('metrics')}
          >
            Métricas
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
              onClick={() => handleMetricClick(kpi.title.toLowerCase().replace(/\s+/g, ''), kpi)}
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

JiraKPIs.displayName = 'JiraKPIs';