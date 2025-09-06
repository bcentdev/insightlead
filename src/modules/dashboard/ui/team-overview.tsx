import { Users, Target, TrendingUp, CheckCircle, Calendar } from 'lucide-react';
import { MetricCard } from '../../../presentation/components/common/metric-card.tsx';
import { WidgetContainer } from '../../../presentation/components/common/widget-container.tsx';

type TeamMember = {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly seniority: string;
  readonly avatar?: string;
  readonly objectivesCompleted: number;
  readonly objectivesTotal: number;
  readonly completionRate: number;
  readonly keyMetrics?: {
    readonly pullRequests: number;
    readonly codeReviews: number;
    readonly storiesCompleted: number;
    readonly comments: number;
  };
};

type TeamOverviewProps = {
  readonly teamName: string;
  readonly teamLead: TeamMember;
  readonly members: readonly TeamMember[];
  readonly averageCompletionRate: number;
  readonly totalMembers: number;
  readonly isDraggable?: boolean;
  readonly isCustomizing?: boolean;
  readonly isFixed?: boolean;
  readonly dragHandleProps?: any;
};

export function TeamOverview({ 
  teamLead, 
  members, 
  averageCompletionRate, 
  totalMembers,
  isDraggable = false,
  isCustomizing = false,
  isFixed = false,
  dragHandleProps
}: TeamOverviewProps) {
  const totalObjectives = members.reduce((sum, m) => sum + m.objectivesTotal, 0);
  const completedObjectives = members.reduce((sum, m) => sum + m.objectivesCompleted, 0);
  const activeObjectives = totalObjectives - completedObjectives;
  const teamCompletionRate = totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;

  return (
    <WidgetContainer
      icon={Users}
      title="Team Overview"
      subtitle="Team performance and objectives tracking"
      isDraggable={isDraggable}
      isCustomizing={isCustomizing}
      isFixed={isFixed}
      dragHandleProps={dragHandleProps}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Team Size"
          value={totalMembers}
          subtitle="Total team members"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          gradient="from-blue-50 to-blue-100"
          tooltip="Total number of team members including the team lead"
        />
        
        <MetricCard
          title="Team Completion Rate"
          value={`${Math.round(teamCompletionRate)}%`}
          subtitle="Objectives completed"
          icon={<Target className="w-5 h-5 text-green-600" />}
          gradient="from-green-50 to-green-100"
          tooltip="Percentage of total objectives completed by the entire team"
          trend={{
            value: Math.round(teamCompletionRate),
            isPositive: teamCompletionRate > 70
          }}
        />
        
        <MetricCard
          title="Active Objectives"
          value={activeObjectives}
          subtitle="Currently in progress"
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
          gradient="from-purple-50 to-purple-100"
          tooltip="Number of objectives currently being worked on by team members"
        />
        
        <MetricCard
          title="Completed Objectives"
          value={completedObjectives}
          subtitle="Total completed"
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          gradient="from-emerald-50 to-emerald-100"
          tooltip="Total number of objectives completed by all team members"
        />

        <MetricCard
          title="Avg Performance"
          value={`${Math.round(averageCompletionRate)}%`}
          subtitle="Individual average"
          icon={<Calendar className="w-5 h-5 text-orange-600" />}
          gradient="from-orange-50 to-orange-100"
          tooltip="Average individual completion rate across all team members"
          trend={{
            value: Math.round(averageCompletionRate),
            isPositive: averageCompletionRate > 75
          }}
        />
      </div>
    </WidgetContainer>
  );
}