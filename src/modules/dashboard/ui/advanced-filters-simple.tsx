import React, { useState, useCallback } from 'react';
import { 
  Button, 
  Select, 
  SelectItem, 
  Chip
} from '@heroui/react';
import { 
  Filter, 
  Clock,
  Users,
  Tag,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  RotateCcw,
  Github,
  GitPullRequest,
  Kanban,
  Hash
} from 'lucide-react';
import { WidgetContainer } from '@/shared/ui/components/widget-container';

type FilterValue = {
  readonly timePeriod?: string;
  readonly teamMembers?: readonly string[];
  readonly taskTypes?: readonly string[];
  readonly priorities?: readonly string[];
  readonly statuses?: readonly string[];
  readonly repositories?: readonly string[];
  readonly prStatuses?: readonly string[];
  readonly jiraProjects?: readonly string[];
  readonly issueTypes?: readonly string[];
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

export const AdvancedFiltersSimple = ({ 
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState(currentTimePeriod);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<string[]>([]);

  const timePeriods = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '180d', label: 'Last 6 months' },
    { value: '365d', label: 'Last year' }
  ];

  const taskTypes = [
    { value: 'story', label: 'Story', color: 'success' },
    { value: 'bug', label: 'Bug', color: 'danger' },
    { value: 'task', label: 'Task', color: 'primary' },
    { value: 'epic', label: 'Epic', color: 'secondary' }
  ];

  const handleTimePeriodChange = useCallback((keys: any) => {
    const value = Array.from(keys)[0] as string;
    setSelectedTimePeriod(value);
    onTimePeriodChange?.(value);
    
    // Generate simple chips for now
    const chips = [{
      key: 'timePeriod',
      label: timePeriods.find(p => p.value === value)?.label || value,
      icon: Clock,
      color: 'primary'
    }];
    
    onFiltersChange(chips);
  }, [onFiltersChange, onTimePeriodChange]);

  const handleTeamMembersChange = useCallback((keys: any) => {
    const values = Array.from(keys) as string[];
    setSelectedTeamMembers(values);
    
    const chips = values.map(memberId => {
      const member = teamMembers.find(m => m.id === memberId);
      return member ? {
        key: `member-${memberId}`,
        label: member.name,
        icon: Users,
        color: 'primary'
      } : null;
    }).filter(Boolean);
    
    onFiltersChange(chips);
  }, [teamMembers, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    setSelectedTimePeriod(currentTimePeriod);
    setSelectedTeamMembers([]);
    setSelectedTaskTypes([]);
    onTimePeriodChange?.(currentTimePeriod);
    onFiltersChange([]);
  }, [currentTimePeriod, onTimePeriodChange, onFiltersChange]);

  const activeFiltersCount = selectedTeamMembers.length + selectedTaskTypes.length + (selectedTimePeriod !== currentTimePeriod ? 1 : 0);

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
              onPress={clearAllFilters}
              className="text-gray-600 dark:text-gray-400"
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            endContent={<ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filter Controls */}
        {isExpanded && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Time Period */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Time Period</label>
                </div>
                <Select
                  size="sm"
                  selectedKeys={new Set([selectedTimePeriod])}
                  onSelectionChange={handleTimePeriodChange}
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
                    selectedKeys={new Set(selectedTeamMembers)}
                    onSelectionChange={handleTeamMembersChange}
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
                  selectedKeys={new Set(selectedTaskTypes)}
                  onSelectionChange={(keys) => {
                    const values = Array.from(keys) as string[];
                    setSelectedTaskTypes(values);
                  }}
                >
                  {taskTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};