import React, { useState, useCallback, useMemo } from 'react';
import { 
  Card, 
  CardBody, 
  Button, 
  Select, 
  SelectItem, 
  Input, 
  DatePicker, 
  Chip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Divider
} from '@heroui/react';
import { WidgetContainer } from '@/shared/ui/components/widget-container';
import { 
  Filter, 
  X, 
  Calendar,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ChevronDown,
  Github,
  Kanban,
  GitPullRequest,
  Hash,
  Tag,
  Building,
  RotateCcw
} from 'lucide-react';
import { parseDate } from '@internationalized/date';

type FilterValue = {
  readonly dateRange?: {
    readonly start: string;
    readonly end: string;
  };
  readonly timePeriod?: string;
  readonly teamMembers?: readonly string[];
  readonly taskTypes?: readonly string[];
  readonly priorities?: readonly string[];
  readonly statuses?: readonly string[];
  readonly repositories?: readonly string[];
  readonly prStatuses?: readonly string[];
  readonly jiraProjects?: readonly string[];
  readonly issueTypes?: readonly string[];
  readonly labels?: readonly string[];
};

type AdvancedFiltersProps = {
  readonly onFiltersChange: (filters: readonly any[]) => void;
  readonly teamMembers: readonly { readonly id: string; readonly name: string }[];
  readonly hasGitHubIntegration?: boolean;
  readonly hasJiraIntegration?: boolean;
  readonly repositories?: readonly string[];
  readonly jiraProjects?: readonly string[];
  readonly currentTimePeriod?: string;
  readonly onTimePeriodChange?: (period: string) => void;
  readonly isDraggable?: boolean;
  readonly isCustomizing?: boolean;
  readonly isFixed?: boolean;
  readonly dragHandleProps?: any;
  readonly className?: string;
};

export const AdvancedFilters = ({ 
  onFiltersChange, 
  teamMembers,
  hasGitHubIntegration = false,
  hasJiraIntegration = false,
  repositories = [],
  jiraProjects = [],
  currentTimePeriod = '30d',
  onTimePeriodChange,
  isDraggable = false,
  isCustomizing = false,
  isFixed = false,
  dragHandleProps,
  className = "" 
}: AdvancedFiltersProps) => {
  // Load filters from localStorage on mount
  const [filters, setFilters] = useState<FilterValue>(() => {
    try {
      const saved = localStorage.getItem('advanced-filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...parsed, timePeriod: currentTimePeriod }; // Always use current time period
      }
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error);
    }
    return { timePeriod: currentTimePeriod };
  });
  
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem('advanced-filters-expanded');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      return false;
    }
  });

  // Save filters to localStorage when they change
  React.useEffect(() => {
    try {
      localStorage.setItem('advanced-filters', JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error);
    }
  }, [filters]);

  // Save expanded state to localStorage when it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('advanced-filters-expanded', JSON.stringify(isExpanded));
    } catch (error) {
      console.warn('Failed to save expanded state to localStorage:', error);
    }
  }, [isExpanded]);

  const taskTypes = [
    { value: 'story', label: 'Story', color: 'success' },
    { value: 'bug', label: 'Bug', color: 'danger' },
    { value: 'task', label: 'Task', color: 'primary' },
    { value: 'epic', label: 'Epic', color: 'secondary' },
    { value: 'spike', label: 'Spike', color: 'warning' }
  ];

  const priorities = [
    { value: 'highest', label: 'Highest', color: 'danger' },
    { value: 'high', label: 'High', color: 'warning' },
    { value: 'medium', label: 'Medium', color: 'primary' },
    { value: 'low', label: 'Low', color: 'success' },
    { value: 'lowest', label: 'Lowest', color: 'default' }
  ];

  const statuses = [
    { value: 'todo', label: 'To Do', color: 'default' },
    { value: 'inprogress', label: 'In Progress', color: 'primary' },
    { value: 'review', label: 'In Review', color: 'warning' },
    { value: 'done', label: 'Done', color: 'success' }
  ];

  const timePeriods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '180d', label: 'Last 6 months' },
    { value: '365d', label: 'Last year' }
  ];

  const prStatuses = [
    { value: 'open', label: 'Open', color: 'success' },
    { value: 'merged', label: 'Merged', color: 'primary' },
    { value: 'closed', label: 'Closed', color: 'danger' },
    { value: 'draft', label: 'Draft', color: 'default' }
  ];

  const issueTypes = [
    { value: 'story', label: 'Story', color: 'primary' },
    { value: 'task', label: 'Task', color: 'success' },
    { value: 'bug', label: 'Bug', color: 'danger' },
    { value: 'epic', label: 'Epic', color: 'secondary' },
    { value: 'subtask', label: 'Sub-task', color: 'warning' }
  ];

  const updateFilters = useCallback((key: keyof FilterValue, value: any) => {
    const newFilters = { ...filters };
    
    if (!value || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    
    setFilters(newFilters);

    // Handle time period separately
    if (key === 'timePeriod' && onTimePeriodChange) {
      onTimePeriodChange(value || '30d');
    }

    // Convert filters to active filter chips
    const chips: any[] = [];
    
    if (newFilters.timePeriod) {
      const period = timePeriods.find(p => p.value === newFilters.timePeriod);
      if (period) {
        chips.push({
          key: 'timePeriod',
          label: period.label,
          icon: Clock,
          color: 'primary'
        });
      }
    }

    if (newFilters.dateRange) {
      chips.push({
        key: 'dateRange',
        label: `${newFilters.dateRange.start} - ${newFilters.dateRange.end}`,
        icon: Calendar,
        color: 'primary'
      });
    }

    if (newFilters.teamMembers?.length) {
      newFilters.teamMembers.forEach(memberId => {
        const member = teamMembers.find(m => m.id === memberId);
        if (member) {
          chips.push({
            key: `member-${memberId}`,
            label: member.name,
            icon: Users,
            color: 'primary'
          });
        }
      });
    }

    if (newFilters.taskTypes?.length) {
      newFilters.taskTypes.forEach(type => {
        const taskType = taskTypes.find(t => t.value === type);
        if (taskType) {
          chips.push({
            key: `taskType-${type}`,
            label: taskType.label,
            icon: Tag,
            color: taskType.color
          });
        }
      });
    }

    if (newFilters.priorities?.length) {
      newFilters.priorities.forEach(priority => {
        const priorityObj = priorities.find(p => p.value === priority);
        if (priorityObj) {
          chips.push({
            key: `priority-${priority}`,
            label: priorityObj.label,
            icon: AlertTriangle,
            color: priorityObj.color
          });
        }
      });
    }

    if (newFilters.statuses?.length) {
      newFilters.statuses.forEach(status => {
        const statusObj = statuses.find(s => s.value === status);
        if (statusObj) {
          chips.push({
            key: `status-${status}`,
            label: statusObj.label,
            icon: CheckCircle,
            color: statusObj.color
          });
        }
      });
    }

    if (newFilters.repositories?.length) {
      newFilters.repositories.forEach(repo => {
        chips.push({
          key: `repo-${repo}`,
          label: repo,
          icon: Github,
          color: 'default'
        });
      });
    }

    if (newFilters.prStatuses?.length) {
      newFilters.prStatuses.forEach(status => {
        const statusObj = prStatuses.find(s => s.value === status);
        if (statusObj) {
          chips.push({
            key: `pr-${status}`,
            label: `PR: ${statusObj.label}`,
            icon: GitPullRequest,
            color: statusObj.color
          });
        }
      });
    }

    if (newFilters.jiraProjects?.length) {
      newFilters.jiraProjects.forEach(project => {
        chips.push({
          key: `jira-${project}`,
          label: project,
          icon: Kanban,
          color: 'secondary'
        });
      });
    }

    if (newFilters.issueTypes?.length) {
      newFilters.issueTypes.forEach(type => {
        const typeObj = issueTypes.find(t => t.value === type);
        if (typeObj) {
          chips.push({
            key: `issue-${type}`,
            label: `Issue: ${typeObj.label}`,
            icon: Hash,
            color: typeObj.color
          });
        }
      });
    }

    onFiltersChange(chips);
  }, [filters, teamMembers, taskTypes, priorities, statuses, timePeriods, prStatuses, issueTypes, onFiltersChange, onTimePeriodChange]);

  // Initialize filters on mount and notify parent
  React.useEffect(() => {
    console.log('🔧 AdvancedFilters mounted with:', { currentTimePeriod, teamMembers: teamMembers.length, filters });
    // Always call updateFilters to ensure parent gets initial state
    updateFilters('timePeriod', filters.timePeriod || currentTimePeriod);
  }, [updateFilters, currentTimePeriod]); // Include dependencies

  const removeFilter = useCallback((filterKey: string) => {
    const newFilters = { ...filters };
    
    if (filterKey === 'dateRange') {
      delete newFilters.dateRange;
    } else if (filterKey === 'timePeriod') {
      delete newFilters.timePeriod;
      onTimePeriodChange?.('30d'); // Reset to default
    } else if (filterKey.startsWith('member-')) {
      const memberId = filterKey.replace('member-', '');
      newFilters.teamMembers = newFilters.teamMembers?.filter(id => id !== memberId);
    } else if (filterKey.startsWith('taskType-')) {
      const type = filterKey.replace('taskType-', '');
      newFilters.taskTypes = newFilters.taskTypes?.filter(t => t !== type);
    } else if (filterKey.startsWith('priority-')) {
      const priority = filterKey.replace('priority-', '');
      newFilters.priorities = newFilters.priorities?.filter(p => p !== priority);
    } else if (filterKey.startsWith('status-')) {
      const status = filterKey.replace('status-', '');
      newFilters.statuses = newFilters.statuses?.filter(s => s !== status);
    } else if (filterKey.startsWith('repo-')) {
      const repo = filterKey.replace('repo-', '');
      newFilters.repositories = newFilters.repositories?.filter(r => r !== repo);
    } else if (filterKey.startsWith('pr-')) {
      const status = filterKey.replace('pr-', '');
      newFilters.prStatuses = newFilters.prStatuses?.filter(s => s !== status);
    } else if (filterKey.startsWith('jira-')) {
      const project = filterKey.replace('jira-', '');
      newFilters.jiraProjects = newFilters.jiraProjects?.filter(p => p !== project);
    } else if (filterKey.startsWith('issue-')) {
      const type = filterKey.replace('issue-', '');
      newFilters.issueTypes = newFilters.issueTypes?.filter(t => t !== type);
    }

    setFilters(newFilters);
    // Trigger update with the first available key to refresh chips
    const firstKey = Object.keys(newFilters)[0] as keyof FilterValue || 'dateRange';
    updateFilters(firstKey, newFilters[firstKey]);
  }, [filters, updateFilters, onTimePeriodChange]);

  const clearAllFilters = useCallback(() => {
    const clearedFilters = { timePeriod: currentTimePeriod };
    setFilters(clearedFilters);
    onTimePeriodChange?.(currentTimePeriod);
    onFiltersChange([]);
    console.log('🔧 All filters cleared');
  }, [onFiltersChange, onTimePeriodChange, currentTimePeriod]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).reduce((count, value) => {
      if (Array.isArray(value)) {
        return count + value.length;
      }
      return value ? count + 1 : count;
    }, 0);
  }, [filters]);

  // Generate active chips for display
  const activeChips = useMemo(() => {
    const chips: any[] = [];
    
    if (filters.timePeriod) {
      const period = timePeriods.find(p => p.value === filters.timePeriod);
      if (period) {
        chips.push({
          key: 'timePeriod',
          label: period.label,
          icon: Clock,
          color: 'primary'
        });
      }
    }

    if (filters.dateRange) {
      chips.push({
        key: 'dateRange',
        label: `${filters.dateRange.start} - ${filters.dateRange.end}`,
        icon: Calendar,
        color: 'primary'
      });
    }

    if (filters.teamMembers?.length) {
      filters.teamMembers.forEach(memberId => {
        const member = teamMembers.find(m => m.id === memberId);
        if (member) {
          chips.push({
            key: `member-${memberId}`,
            label: member.name,
            icon: Users,
            color: 'primary'
          });
        }
      });
    }

    if (filters.taskTypes?.length) {
      filters.taskTypes.forEach(type => {
        const taskType = taskTypes.find(t => t.value === type);
        if (taskType) {
          chips.push({
            key: `taskType-${type}`,
            label: taskType.label,
            icon: Tag,
            color: taskType.color
          });
        }
      });
    }

    if (filters.priorities?.length) {
      filters.priorities.forEach(priority => {
        const priorityObj = priorities.find(p => p.value === priority);
        if (priorityObj) {
          chips.push({
            key: `priority-${priority}`,
            label: priorityObj.label,
            icon: AlertTriangle,
            color: priorityObj.color
          });
        }
      });
    }

    if (filters.statuses?.length) {
      filters.statuses.forEach(status => {
        const statusObj = statuses.find(s => s.value === status);
        if (statusObj) {
          chips.push({
            key: `status-${status}`,
            label: statusObj.label,
            icon: CheckCircle,
            color: statusObj.color
          });
        }
      });
    }

    if (filters.repositories?.length) {
      filters.repositories.forEach(repo => {
        chips.push({
          key: `repo-${repo}`,
          label: repo,
          icon: Github,
          color: 'default'
        });
      });
    }

    if (filters.prStatuses?.length) {
      filters.prStatuses.forEach(status => {
        const statusObj = prStatuses.find(s => s.value === status);
        if (statusObj) {
          chips.push({
            key: `pr-${status}`,
            label: `PR: ${statusObj.label}`,
            icon: GitPullRequest,
            color: statusObj.color
          });
        }
      });
    }

    if (filters.jiraProjects?.length) {
      filters.jiraProjects.forEach(project => {
        chips.push({
          key: `jira-${project}`,
          label: project,
          icon: Kanban,
          color: 'secondary'
        });
      });
    }

    if (filters.issueTypes?.length) {
      filters.issueTypes.forEach(type => {
        const typeObj = issueTypes.find(t => t.value === type);
        if (typeObj) {
          chips.push({
            key: `issue-${type}`,
            label: `Issue: ${typeObj.label}`,
            icon: Hash,
            color: typeObj.color
          });
        }
      });
    }

    return chips;
  }, [filters, teamMembers, taskTypes, priorities, statuses, timePeriods, prStatuses, issueTypes]);

  return (
    <WidgetContainer
      icon={Filter}
      title="Advanced Filters"
      subtitle="Filter data by time period, team members, and integrations"
      isDraggable={isDraggable}
      isCustomizing={isCustomizing}
      isFixed={isFixed}
      dragHandleProps={dragHandleProps}
      className={className}
      headerActions={
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Chip size="sm" color="primary" variant="flat">
              {activeFiltersCount}
            </Chip>
          )}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              startContent={<RotateCcw className="w-4 h-4" />}
              onClick={clearAllFilters}
              className="text-gray-600 dark:text-gray-400"
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            endContent={<ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">

        {/* Active Filters */}
        {activeChips.length > 0 && (
          <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardBody className="p-3">
              <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => {
                const IconComponent = chip.icon;
                return (
                  <Chip
                    key={chip.key}
                    size="sm"
                    variant="flat"
                    color={chip.color}
                    onClose={() => removeFilter(chip.key)}
                    startContent={<IconComponent className="w-3 h-3" />}
                  >
                    {chip.label}
                  </Chip>
                );
              })}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Filter Controls */}
        {isExpanded && (
          <Card className="border-gray-200 dark:border-gray-700">
            <CardBody className="p-4">
              <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Time Period */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Time Period</label>
                  </div>
                  <Select
                    size="sm"
                    selectedKeys={new Set([filters.timePeriod || currentTimePeriod])}
                    onSelectionChange={(keys) => {
                      const selectedValues = Array.from(keys);
                      const value = selectedValues[0] as string;
                      if (value) {
                        updateFilters('timePeriod', value);
                      }
                    }}
                  >
                    {timePeriods.map(period => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Team Members */}
                {teamMembers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Team Members</label>
                    </div>
                    <Select
                      size="sm"
                      selectionMode="multiple"
                      selectedKeys={new Set(filters.teamMembers || [])}
                      onSelectionChange={(keys) => {
                        const values = Array.from(keys) as string[];
                        updateFilters('teamMembers', values);
                      }}
                    >
                      {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                )}

                {/* Task Types */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Task Types</label>
                  </div>
                  <Select
                    size="sm"
                    selectionMode="multiple"
                    selectedKeys={new Set(filters.taskTypes || [])}
                    onSelectionChange={(keys) => {
                      const values = Array.from(keys);
                      console.log('🔧 Task types changed:', values);
                      updateFilters('taskTypes', values);
                    }}
                  >
                    {taskTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Priorities */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Priorities</label>
                  </div>
                  <Select
                    size="sm"
                    selectionMode="multiple"
                    selectedKeys={new Set(filters.priorities || [])}
                    onSelectionChange={(keys) => {
                      const values = Array.from(keys);
                      console.log('🔧 Priorities changed:', values);
                      updateFilters('priorities', values);
                    }}
                  >
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Statuses */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Statuses</label>
                  </div>
                  <Select
                    size="sm"
                    selectionMode="multiple"
                    selectedKeys={new Set(filters.statuses || [])}
                    onSelectionChange={(keys) => {
                      const values = Array.from(keys);
                      console.log('🔧 Statuses changed:', values);
                      updateFilters('statuses', values);
                    }}
                  >
                    {statuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* GitHub Integration Filters */}
                {hasGitHubIntegration && (
                  <>
                    {/* Repositories */}
                    {repositories.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Github className="w-4 h-4 text-primary" />
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">GitHub Repositories</label>
                        </div>
                        <Select
                          size="sm"
                          selectionMode="multiple"
                          selectedKeys={new Set(filters.repositories || [])}
                          onSelectionChange={(keys) => {
                            const values = Array.from(keys);
                            console.log('🔧 Repositories changed:', values);
                            updateFilters('repositories', values);
                          }}
                        >
                          {repositories.map(repo => (
                            <SelectItem key={repo} value={repo}>
                              {repo}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                    )}

                    {/* PR Statuses */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="w-4 h-4 text-primary" />
                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Pull Request Status</label>
                      </div>
                      <Select
                        size="sm"
                        selectionMode="multiple"
                        selectedKeys={new Set(filters.prStatuses || [])}
                        onSelectionChange={(keys) => {
                          const values = Array.from(keys);
                          console.log('🔧 PR Statuses changed:', values);
                          updateFilters('prStatuses', values);
                        }}
                      >
                        {prStatuses.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </>
                )}

                {/* Jira Integration Filters */}
                {hasJiraIntegration && (
                  <>
                    {/* Jira Projects */}
                    {jiraProjects.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Kanban className="w-4 h-4 text-primary" />
                          <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Jira Projects</label>
                        </div>
                        <Select
                          size="sm"
                          selectionMode="multiple"
                          selectedKeys={new Set(filters.jiraProjects || [])}
                          onSelectionChange={(keys) => {
                            const values = Array.from(keys);
                            console.log('🔧 Jira Projects changed:', values);
                            updateFilters('jiraProjects', values);
                          }}
                        >
                          {jiraProjects.map(project => (
                            <SelectItem key={project} value={project}>
                              {project}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                    )}

                    {/* Issue Types */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-primary" />
                        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Jira Issue Types</label>
                      </div>
                      <Select
                        size="sm"
                        selectionMode="multiple"
                        selectedKeys={new Set(filters.issueTypes || [])}
                        onSelectionChange={(keys) => {
                          const values = Array.from(keys);
                          console.log('🔧 Issue Types changed:', values);
                          updateFilters('issueTypes', values);
                        }}
                      >
                        {issueTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </>
                )}
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </WidgetContainer>
  );
};