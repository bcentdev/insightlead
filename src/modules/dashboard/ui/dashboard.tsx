import React, { useState, useCallback } from 'react';
import { TeamOverview } from './team-overview.tsx';
import { TeamMembersFilter } from './team-members-filter.tsx';
import { GitHubKPIs } from './github-kpis.tsx';
import { JiraKPIs } from './jira-kpis.tsx';
import { TimeFilter } from './time-filter.tsx';
import { CustomizableDashboard } from '@/modules/dashboard/ui/customizable-dashboard.tsx';
import { AdvancedFiltersSimple } from './advanced-filters-simple.tsx';
import { LoadingSpinner } from '../../../presentation/components/common/loading-spinner.tsx';
import { SearchModal } from '../../../presentation/components/common/search-modal.tsx';
import { Card, CardBody, Button, Chip } from '@heroui/react';
import { AlertCircle, Settings, BarChart3, Search } from 'lucide-react';
import { useDashboardData } from '../../../presentation/hooks/use-dashboard-data.ts';

const DashboardPage = () => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<string>('30d');
  const [useCustomizable, setUseCustomizable] = useState(true);
  const [activeFilters, setActiveFilters] = useState<readonly any[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  
  const {
    teamData,
    allTeamMembers,
    allJiraAssignees,
    teamJiraProject,
    configStatus,
    repositories,
    isLoading
  } = useDashboardData();

  const goToSettings = () => {
    window.location.href = '/settings';
  };

  const handleFiltersChange = useCallback((filters: readonly any[]) => {
    setActiveFilters(filters);
    console.log('Filters applied:', filters);
  }, []);

  const handleSearchSelect = useCallback((result: any) => {
    console.log('Search result selected:', result);
    // Here you could navigate to the selected item or apply filters
  }, []);

  // Global keyboard shortcut for search
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Use real repositories from settings
  const jiraProjects = teamJiraProject ? [teamJiraProject] : [];
  
  // Debug: Log repositories
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && repositories.length > 0) {
      console.log('🔧 Dashboard Page: Using repositories:', repositories);
      console.log('🔧 Dashboard Page: Using Jira projects:', jiraProjects);
    }
  }, [repositories, jiraProjects]);

  // Create dashboard layout configuration
  const createDashboardLayout = useCallback(() => {
    const widgets = [
      {
        id: 'advanced-filters',
        title: 'Advanced Filters',
        component: () => (
          <AdvancedFiltersSimple
            onFiltersChange={handleFiltersChange}
            teamMembers={[...teamData.members, teamData.teamLead].map(m => ({ id: m.id, name: m.name }))}
            hasGitHubIntegration={configStatus.hasToken && configStatus.hasRepositories}
            hasJiraIntegration={!!teamJiraProject}
            repositories={repositories}
            jiraProjects={jiraProjects}
            currentTimePeriod={timePeriod}
            onTimePeriodChange={setTimePeriod}
          />
        ),
        isVisible: true,
        gridCols: 2,
      },
      {
        id: 'team-members-filter',
        title: 'Team Members',
        component: () => (
          <TeamMembersFilter
            teamLead={teamData.teamLead}
            members={teamData.members}
            selectedMember={selectedMember}
            onMemberSelect={setSelectedMember}
          />
        ),
        isVisible: true,
        gridCols: 2,
      },
      {
        id: 'team-overview',
        title: 'Team Overview',
        component: () => (
          <TeamOverview
            teamName={teamData.teamName}
            teamLead={teamData.teamLead}
            members={teamData.members}
            averageCompletionRate={teamData.averageCompletionRate}
            totalMembers={teamData.totalMembers}
          />
        ),
        isVisible: true,
        gridCols: 2,
      },
      {
        id: 'github-kpis',
        title: 'GitHub KPIs',
        component: () => 
          configStatus.hasToken && configStatus.hasRepositories && allTeamMembers.length > 0 ? (
            <GitHubKPIs 
              teamMembers={allTeamMembers} 
              selectedMember={selectedMember}
              allMembers={[...teamData.members, teamData.teamLead]}
              timePeriod={timePeriod}
              activeFilters={activeFilters}
            />
          ) : null,
        isVisible: configStatus.hasToken && configStatus.hasRepositories && allTeamMembers.length > 0,
        gridCols: 2,
      },
      {
        id: 'jira-kpis',
        title: 'Jira KPIs',
        component: () => 
          teamJiraProject ? (
            <JiraKPIs 
              projectKey={teamJiraProject}
              assigneeIds={allJiraAssignees}
              selectedMember={selectedMember}
              allMembers={[...teamData.members, teamData.teamLead]}
              timePeriod={timePeriod}
              activeFilters={activeFilters}
            />
          ) : null,
        isVisible: !!teamJiraProject,
        gridCols: 2,
      },
    ];

    return {
      widgets: widgets.filter(w => w.component() !== null),
      columns: 2,
    };
  }, [teamData, selectedMember, timePeriod, configStatus, allTeamMembers, allJiraAssignees, teamJiraProject, repositories, jiraProjects, handleFiltersChange, handleSearchSelect]);

  const handleLayoutChange = useCallback((layout: any) => {
    // Here you could save the layout to localStorage or backend
    console.log('Layout changed:', layout);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner 
          size="lg" 
          text="Loading dashboard..." 
          variant="pulse"
        />
      </div>
    );
  }

  // Configuration Status Banner Component
  const ConfigStatusBanner = () => (
    !configStatus.loading && (!configStatus.hasToken || !configStatus.hasRepositories) ? (
      <Card className="border-orange-200 bg-orange-50">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-orange-800">Setup Required</h4>
                <p className="text-sm text-orange-700">
                  {!configStatus.hasToken && !configStatus.hasRepositories 
                    ? 'Configure GitHub token and add repositories to view metrics'
                    : !configStatus.hasToken
                    ? 'GitHub token required to fetch data'
                    : `Add repositories to track metrics (${configStatus.repositoryCount} configured)`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {configStatus.hasToken && (
                <Chip size="sm" color="success" variant="flat">
                  Token ✓
                </Chip>
              )}
              {configStatus.hasRepositories && (
                <Chip size="sm" color="success" variant="flat">
                  {configStatus.repositoryCount} Repos ✓
                </Chip>
              )}
              <Button
                color="warning"
                variant="flat"
                size="sm"
                startContent={<Settings className="w-4 h-4" />}
                onPress={goToSettings}
              >
                Configure
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    ) : null
  );

  if (useCustomizable) {
    return (
      <div className="space-y-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <p className="text-gray-600 dark:text-gray-400">
              Overview of {teamData.teamName} performance and objectives
            </p>
          </div>
          <Button
            variant="flat"
            size="sm"
            startContent={<Search className="w-4 h-4" />}
            onPress={() => setIsSearchModalOpen(true)}
            className="text-gray-600 dark:text-gray-400"
          >
            Search
            <span className="ml-2 text-xs opacity-60">⌘K</span>
          </Button>
        </div>
        
        <ConfigStatusBanner />
        
        <CustomizableDashboard
          initialLayout={createDashboardLayout()}
          onLayoutChange={handleLayoutChange}
        />
        
        <SearchModal 
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onResultSelect={handleSearchSelect}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of {teamData.teamName} performance and objectives
          </p>
        </div>
        <TimeFilter
          selectedPeriod={timePeriod}
          onPeriodChange={setTimePeriod}
        />
      </div>

      {/* Configuration Status Banner */}
      {!configStatus.loading && (!configStatus.hasToken || !configStatus.hasRepositories) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-orange-800">Setup Required</h4>
                  <p className="text-sm text-orange-700">
                    {!configStatus.hasToken && !configStatus.hasRepositories 
                      ? 'Configure GitHub token and add repositories to view metrics'
                      : !configStatus.hasToken
                      ? 'GitHub token required to fetch data'
                      : `Add repositories to track metrics (${configStatus.repositoryCount} configured)`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {configStatus.hasToken && (
                  <Chip size="sm" color="success" variant="flat">
                    Token ✓
                  </Chip>
                )}
                {configStatus.hasRepositories && (
                  <Chip size="sm" color="success" variant="flat">
                    {configStatus.repositoryCount} Repos ✓
                  </Chip>
                )}
                <Button
                  color="warning"
                  variant="flat"
                  size="sm"
                  startContent={<Settings className="w-4 h-4" />}
                  onPress={goToSettings}
                >
                  Configure
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Team Members */}
      <TeamMembersFilter
        teamLead={teamData.teamLead}
        members={teamData.members}
        selectedMember={selectedMember}
        onMemberSelect={setSelectedMember}
      />

      {/* Team Overview KPIs */}
      <TeamOverview
        teamName={teamData.teamName}
        teamLead={teamData.teamLead}
        members={teamData.members}
        averageCompletionRate={teamData.averageCompletionRate}
        totalMembers={teamData.totalMembers}
      />

      {/* GitHub KPIs Section - only show if GitHub is configured */}
      {configStatus.hasToken && configStatus.hasRepositories && allTeamMembers.length > 0 && (
        <GitHubKPIs 
          teamMembers={allTeamMembers} 
          selectedMember={selectedMember}
          allMembers={[...teamData.members, teamData.teamLead]}
          timePeriod={timePeriod}
          activeFilters={activeFilters}
        />
      )}

      {/* Jira KPIs Section - only show if Jira is configured */}
      {teamJiraProject && (
        <JiraKPIs 
          projectKey={teamJiraProject}
          assigneeIds={allJiraAssignees}
          selectedMember={selectedMember}
          allMembers={[...teamData.members, teamData.teamLead]}
          timePeriod={timePeriod}
          activeFilters={activeFilters}
        />
      )}
    </div>
  );
};

export default React.memo(DashboardPage);