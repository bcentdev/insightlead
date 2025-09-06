import React from 'react';
import { JiraIssues } from '@/modules/jira/ui/components/jira-issues';
import { Spinner, Card, CardBody, Button } from '@heroui/react';
import { Kanban, Settings } from 'lucide-react';
import { useDashboardData } from '@/modules/dashboard/ui/hooks/use-dashboard-data';

const JiraAnalyticsPage = () => {
  const {
    allJiraAssignees,
    teamJiraProject,
    isLoading
  } = useDashboardData();

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
            <Kanban className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Jira Analytics</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Track team issues, stories, and project progress in Jira
          </p>
        </div>
      </div>

      {teamJiraProject ? (
        <JiraIssues
          projectKey={teamJiraProject}
          assigneeIds={allJiraAssignees}
        />
      ) : (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Kanban className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h4 className="text-xl font-medium text-gray-900 mb-3">No Jira Project Configured</h4>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Configure a Jira project for your team to view issues, track progress, and analyze team performance metrics
              </p>
              <Button
                color="primary"
                variant="flat"
                size="lg"
                startContent={<Settings className="w-5 h-5" />}
                onPress={() => window.location.href = '/teams'}
              >
                Configure Team
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default React.memo(JiraAnalyticsPage);