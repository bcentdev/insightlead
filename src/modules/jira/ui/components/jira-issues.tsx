import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, Chip, Link, Avatar } from '@heroui/react';
import { Bug, Zap, Settings, ExternalLink, Calendar, User, Filter, Kanban } from 'lucide-react';
import { jiraService } from '@/modules/jira/infrastructure/services/jira.service';
import { formatDistanceToNow } from 'date-fns';
import type { JiraIssue } from '@/modules/jira/infrastructure/adapters/jira/jira-client';

// Types using functional programming approach
type JiraIssuesProps = {
  readonly projectKey: string;
  readonly assigneeIds: readonly string[];
  readonly className?: string;
};

type IssuesState = {
  readonly issues: readonly JiraIssue[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly hasConfig: boolean;
};

type IssueTypeFilter = 'all' | 'bug' | 'story' | 'spike';

type PeriodFilter = '7d' | '30d' | '90d';

type PeriodOption = {
  readonly label: string;
  readonly value: PeriodFilter;
  readonly days: number;
};

// Pure functions
const createInitialState = (): IssuesState => ({
  issues: [],
  loading: false,
  error: null,
  hasConfig: false
});

const PERIOD_OPTIONS: readonly PeriodOption[] = [
  { label: '7 days', value: '7d', days: 7 },
  { label: '30 days', value: '30d', days: 30 },
  { label: '90 days', value: '90d', days: 90 }
] as const;

const getIssueTypeIcon = (issueType: string) => {
  const type = issueType.toLowerCase();
  if (type.includes('bug')) return <Bug className="w-4 h-4" />;
  if (type.includes('spike')) return <Zap className="w-4 h-4" />;
  return <Settings className="w-4 h-4" />;
};

const getIssueTypeColor = (issueType: string): 'danger' | 'warning' | 'primary' | 'secondary' => {
  const type = issueType.toLowerCase();
  if (type.includes('bug')) return 'danger';
  if (type.includes('spike')) return 'warning';
  if (type.includes('story')) return 'primary';
  return 'secondary';
};

const getPriorityColor = (priority: string): 'danger' | 'warning' | 'primary' | 'success' | 'default' => {
  const p = priority.toLowerCase();
  if (p.includes('critical') || p.includes('highest')) return 'danger';
  if (p.includes('high')) return 'warning';
  if (p.includes('medium')) return 'primary';
  if (p.includes('low')) return 'success';
  return 'default';
};

const getStatusColor = (status: string): 'success' | 'warning' | 'primary' | 'default' => {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('resolved') || s.includes('closed')) return 'success';
  if (s.includes('progress') || s.includes('review')) return 'warning';
  if (s.includes('todo') || s.includes('open')) return 'primary';
  return 'default';
};

const filterIssuesByType = (issues: readonly JiraIssue[], filter: IssueTypeFilter): readonly JiraIssue[] => {
  if (filter === 'all') return issues;
  
  return issues.filter(issue => {
    const type = issue.issueType.toLowerCase();
    switch (filter) {
      case 'bug': return type.includes('bug');
      case 'story': return type.includes('story') || type.includes('task');
      case 'spike': return type.includes('spike');
      default: return true;
    }
  });
};

const formatRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const JiraIssuesComponent = ({ projectKey, assigneeIds, className }: JiraIssuesProps) => {
  const [state, setState] = useState<IssuesState>(createInitialState());
  const [typeFilter, setTypeFilter] = useState<IssueTypeFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30d');

  // Memoize assigneeIds to prevent unnecessary re-renders
  const memoizedAssigneeIds = useMemo(() => assigneeIds, [JSON.stringify(assigneeIds)]);

  const checkConfigAndFetchIssues = useCallback(async () => {
    const isConfigured = jiraService.isConfigured();
    
    if (!isConfigured) {
      setState(prev => ({ ...prev, hasConfig: false, error: null }));
      return;
    }

    if (!projectKey || memoizedAssigneeIds.length === 0) {
      setState(prev => ({ 
        ...prev, 
        hasConfig: true, 
        issues: [],
        error: null
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, hasConfig: true }));

    try {
      const period = PERIOD_OPTIONS.find(p => p.value === periodFilter);
      const issues = await jiraService.fetchTeamIssues(
        projectKey, 
        [...memoizedAssigneeIds], 
        period?.days || 30
      );
      
      setState(prev => ({ 
        ...prev, 
        issues, 
        loading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch Jira issues',
        loading: false 
      }));
    }
  }, [projectKey, memoizedAssigneeIds, periodFilter]);

  useEffect(() => {
    checkConfigAndFetchIssues();
  }, [checkConfigAndFetchIssues]);

  const goToSettings = useCallback(() => {
    window.location.href = '/settings';
  }, []);

  if (!state.hasConfig) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Kanban className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Jira Issues</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="text-center py-8">
              <Kanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Connect Jira</h4>
              <p className="text-gray-600 mb-4">
                Configure your Jira connection to view team issues and track progress
              </p>
              <Button
                color="primary"
                variant="flat"
                startContent={<Settings className="w-4 h-4" />}
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

  if (!projectKey) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Kanban className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Jira Issues</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Project Not Configured</h4>
              <p className="text-gray-600 mb-4">
                Add a Jira project key to your team configuration to view issues
              </p>
              <Button
                color="primary"
                variant="flat"
                startContent={<Settings className="w-4 h-4" />}
                onPress={goToSettings}
              >
                Configure Team
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const filteredIssues = filterIssuesByType(state.issues, typeFilter);

  return (
    <div className={`space-y-4 ${className || ''}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold">Jira Issues</h3>
              <Chip size="sm" variant="flat" color="primary">
                {projectKey}
              </Chip>
              {state.loading && <Spinner size="sm" />}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Period Filter */}
              <div className="flex gap-1">
                {PERIOD_OPTIONS.map((period) => (
                  <Button
                    key={period.value}
                    size="sm"
                    variant={periodFilter === period.value ? "solid" : "flat"}
                    color={periodFilter === period.value ? "primary" : "default"}
                    onPress={() => setPeriodFilter(period.value)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
              
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={goToSettings}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {/* Query Information */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2">
              <Bug className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-800 mb-1">Active Query</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Tracking issues for project <code className="bg-gray-200 px-1 rounded font-mono">{projectKey}</code> with the following JQL:</p>
                  <code className="block bg-white p-2 rounded border text-xs font-mono text-gray-700 break-all">
                    project = {projectKey} AND assignee WAS [team_members] DURING (-30d, now()) AND updated {'>'}= -30d AND issuetype IN (Bug, standardIssueTypes(), Spike) ORDER BY updated DESC
                  </code>
                  <p className="text-gray-500">This shows recent bugs, stories, and spikes assigned to your team members in the last 30 days.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex gap-1">
              {(['all', 'bug', 'story', 'spike'] as const).map((filter) => {
                return (
                  <Button
                    key={filter}
                    size="sm"
                    variant={typeFilter === filter ? "solid" : "flat"}
                    color={typeFilter === filter ? "primary" : "default"}
                    onPress={() => setTypeFilter(filter)}
                  >
                    {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                );
              })}
            </div>
            <span className="text-sm text-gray-500 ml-2">
              {filteredIssues.length} issues
            </span>
          </div>

          {/* Loading State */}
          {state.loading && !state.issues.length && (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {state.error && (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Failed to load issues</div>
              <p className="text-gray-600 text-sm mb-4">{state.error}</p>
              <Button
                variant="flat"
                size="sm"
                onPress={checkConfigAndFetchIssues}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!state.loading && !state.error && filteredIssues.length === 0 && state.issues.length === 0 && (
            <div className="text-center py-8">
              <Kanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No issues found for the selected period</p>
            </div>
          )}

          {/* Filtered Empty State */}
          {!state.loading && !state.error && filteredIssues.length === 0 && state.issues.length > 0 && (
            <div className="text-center py-8">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No issues match the current filter</p>
            </div>
          )}

          {/* Issues List */}
          {filteredIssues.length > 0 && (
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={getIssueTypeColor(issue.issueType)}
                          startContent={getIssueTypeIcon(issue.issueType)}
                        >
                          {issue.issueType}
                        </Chip>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={getPriorityColor(issue.priority)}
                        >
                          {issue.priority}
                        </Chip>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={getStatusColor(issue.status)}
                        >
                          {issue.status}
                        </Chip>
                      </div>
                      
                      <Link
                        href={`${jiraService.isConfigured() ? 'https://example.atlassian.net' : '#'}/browse/${issue.key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {issue.key}: {truncateText(issue.summary, 80)}
                      </Link>
                      
                      {issue.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {truncateText(issue.description, 120)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {issue.assignee && (
                          <div className="flex items-center gap-1">
                            <Avatar
                              src={issue.assignee.avatarUrls['16x16']}
                              name={issue.assignee.displayName}
                              size="sm"
                              className="w-4 h-4"
                            />
                            <span>{issue.assignee.displayName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatRelativeTime(issue.updated)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      as={Link}
                      href={`${jiraService.isConfigured() ? 'https://example.atlassian.net' : '#'}/browse/${issue.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      isIconOnly
                      variant="light"
                      size="sm"
                      className="ml-2 flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
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
export const JiraIssues = React.memo(JiraIssuesComponent, (prevProps, nextProps) => {
  return (
    prevProps.projectKey === nextProps.projectKey &&
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.assigneeIds) === JSON.stringify(nextProps.assigneeIds)
  );
});