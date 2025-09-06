import React from 'react';
import { GitHubPullRequests } from '../components/github/github-pull-requests';
import { PRStatistics } from '../components/github/pr-statistics';
import { ActivityGraph } from '../components/github/activity-graph';
import { Spinner, Card, CardBody, Button, Chip, Tabs, Tab } from '@heroui/react';
import { AlertCircle, Settings, BarChart3, Github } from 'lucide-react';
import { useDashboardData } from '../hooks/use-dashboard-data';

const GitHubAnalyticsPage = () => {
  const {
    allTeamMembers,
    configStatus,
    isLoading
  } = useDashboardData();

  const goToSettings = () => {
    window.location.href = '/settings';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Github className="w-8 h-8 text-gray-900" />
            <h1 className="text-3xl font-bold text-gray-900">GitHub Analytics</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Comprehensive view of team GitHub activity and pull request metrics
          </p>
        </div>
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

      <Tabs aria-label="GitHub Analytics" variant="underlined" color="primary" size="lg">
        <Tab key="overview" title="Overview">
          <div className="space-y-6 pt-4">
            <GitHubPullRequests 
              teamMembers={allTeamMembers}
            />
          </div>
        </Tab>
        
        <Tab key="statistics" title="Statistics">
          <div className="space-y-6 pt-4">
            <PRStatistics 
              teamMembers={allTeamMembers}
            />
          </div>
        </Tab>
        
        <Tab key="activity" title="Activity">
          <div className="space-y-6 pt-4">
            <ActivityGraph 
              teamMembers={allTeamMembers}
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default React.memo(GitHubAnalyticsPage);