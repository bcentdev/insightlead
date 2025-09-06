import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner } from '@heroui/react';
import { Calendar, GitPullRequest, GitMerge, Activity, TrendingUp } from 'lucide-react';
import { githubService } from '@/modules/github/infrastructure/services/github.service';
import { format, subDays, eachDayOfInterval, isToday, isYesterday } from 'date-fns';

// Types using functional programming approach
type ActivityPeriodValue = '7d' | '30d' | '90d';

type ActivityPeriod = {
  readonly label: string;
  readonly days: number;
  readonly value: ActivityPeriodValue;
};

type DayActivity = {
  readonly date: string;
  readonly prsCreated: number;
  readonly prsMerged: number;
  readonly totalActivity: number;
  readonly pullRequests: readonly ActivityPullRequest[];
};

type ActivityPullRequest = {
  readonly title: string;
  readonly activityType: 'created' | 'merged';
};

type ActivityGraphProps = {
  readonly teamMembers: readonly string[];
  readonly className?: string;
};

// Pure functions and constants
const ACTIVITY_PERIODS: readonly ActivityPeriod[] = [
  { label: '7 days', days: 7, value: '7d' },
  { label: '30 days', days: 30, value: '30d' },
  { label: '90 days', days: 90, value: '90d' }
] as const;

const getActivityColor = (activity: number, maxActivity: number): string => {
  if (activity === 0) return 'bg-gray-100';
  const intensity = activity / maxActivity;
  if (intensity <= 0.25) return 'bg-green-200';
  if (intensity <= 0.5) return 'bg-green-300';
  if (intensity <= 0.75) return 'bg-green-400';
  return 'bg-green-500';
};

const getActivityDescription = (activity: number): string => {
  if (activity === 0) return 'No activity';
  if (activity === 1) return '1 contribution';
  return `${activity} contributions`;
};

const formatDateLabel = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
};

const createEmptyActivity = (dateStr: string): DayActivity => ({
  date: dateStr,
  prsCreated: 0,
  prsMerged: 0,
  totalActivity: 0,
  pullRequests: []
});

const processActivityData = (pullRequests: readonly any[], days: number): readonly DayActivity[] => {
  const endDate = new Date();
  const startDate = subDays(endDate, days);
  const dayRange = eachDayOfInterval({ start: startDate, end: endDate });
  
  const activityByDay = new Map<string, DayActivity>();
  
  // Initialize all days with empty activity
  dayRange.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    activityByDay.set(dateStr, createEmptyActivity(dateStr));
  });

  // Process pull requests
  pullRequests.forEach(pr => {
    const createdDate = format(new Date(pr.created_at), 'yyyy-MM-dd');
    const mergedDate = pr.merged_at ? format(new Date(pr.merged_at), 'yyyy-MM-dd') : null;

    // Count PRs created
    if (activityByDay.has(createdDate)) {
      const day = activityByDay.get(createdDate)!;
      activityByDay.set(createdDate, {
        ...day,
        prsCreated: day.prsCreated + 1,
        totalActivity: day.totalActivity + 1,
        pullRequests: [...day.pullRequests, { title: pr.title, activityType: 'created' }]
      });
    }

    // Count PRs merged (only if different from created date)
    if (mergedDate && mergedDate !== createdDate && activityByDay.has(mergedDate)) {
      const day = activityByDay.get(mergedDate)!;
      activityByDay.set(mergedDate, {
        ...day,
        prsMerged: day.prsMerged + 1,
        totalActivity: day.totalActivity + 1,
        pullRequests: [...day.pullRequests, { title: pr.title, activityType: 'merged' }]
      });
    }
  });

  return Array.from(activityByDay.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const calculateSummaryStats = (activities: readonly DayActivity[]) => {
  const totalActivity = activities.reduce((sum, a) => sum + a.totalActivity, 0);
  const avgActivity = activities.length > 0 ? totalActivity / activities.length : 0;
  const mostActiveDay = activities.reduce((max, day) => 
    day.totalActivity > max.totalActivity ? day : max, 
    activities[0] || { totalActivity: 0 }
  );

  return { totalActivity, avgActivity, mostActiveDay };
};

const groupActivitiesByWeek = (activities: readonly DayActivity[]) => {
  return Array.from({ length: Math.ceil(activities.length / 7) }, (_, weekIndex) => {
    const weekStart = weekIndex * 7;
    const weekEnd = Math.min(weekStart + 7, activities.length);
    const weekActivities = activities.slice(weekStart, weekEnd);
    const weekTotal = weekActivities.reduce((sum, day) => sum + day.totalActivity, 0);
    const weekStartDate = new Date(weekActivities[0]?.date || '');
    const weekEndDate = new Date(weekActivities[weekActivities.length - 1]?.date || '');

    return {
      weekIndex,
      weekActivities,
      weekTotal,
      weekStartDate,
      weekEndDate
    };
  });
};

export const ActivityGraph = ({ teamMembers, className }: ActivityGraphProps) => {
  const [activities, setActivities] = useState<readonly DayActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ActivityPeriod>(ACTIVITY_PERIODS[1]); // Default to 30 days
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);

  useEffect(() => {
    if (teamMembers.length > 0) {
      fetchActivityData();
    }
  }, [teamMembers, selectedPeriod]);

  const fetchActivityData = async () => {
    setLoading(true);
    setError(null);

    try {
      const prData = await githubService.fetchTeamPullRequests([...teamMembers], selectedPeriod.days);
      const processedActivities = processActivityData(prData.pullRequests, selectedPeriod.days);
      setActivities(processedActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardBody>
            <div className="flex items-center justify-center p-8">
              <Spinner size="lg" />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Activity Graph</h3>
          </CardHeader>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const maxActivity = Math.max(...activities.map(a => a.totalActivity), 1);
  const { totalActivity, avgActivity, mostActiveDay } = calculateSummaryStats(activities);
  const weeklyBreakdown = groupActivitiesByWeek(activities);

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header with period selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Activity Graph</h3>
            </div>
            <div className="flex gap-2">
              {ACTIVITY_PERIODS.map((period) => (
                <Button
                  key={period.value}
                  size="sm"
                  variant={selectedPeriod.value === period.value ? "solid" : "flat"}
                  color={selectedPeriod.value === period.value ? "primary" : "default"}
                  onPress={() => setSelectedPeriod(period)}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-600">{totalActivity}</p>
              <p className="text-sm text-gray-600">Total Contributions</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">{avgActivity.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Avg per Day</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xl font-bold text-purple-600">{mostActiveDay.totalActivity}</p>
              <p className="text-sm text-gray-600">Most Active Day</p>
            </div>
          </div>

          {/* Activity Graph */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded-sm" />
                <div className="w-3 h-3 bg-green-200 rounded-sm" />
                <div className="w-3 h-3 bg-green-300 rounded-sm" />
                <div className="w-3 h-3 bg-green-400 rounded-sm" />
                <div className="w-3 h-3 bg-green-500 rounded-sm" />
              </div>
              <span>More</span>
            </div>

            {/* Activity Grid */}
            <div className="grid grid-cols-7 gap-1 max-w-full overflow-x-auto">
              {activities.map((day) => (
                <div
                  key={day.date}
                  className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-blue-300 ${getActivityColor(day.totalActivity, maxActivity)}`}
                  title={`${formatDateLabel(new Date(day.date))}: ${getActivityDescription(day.totalActivity)}`}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </div>

            {/* Tooltip */}
            {hoveredDay && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">{formatDateLabel(new Date(hoveredDay.date))}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="w-3 h-3 text-blue-600" />
                    <span>{hoveredDay.prsCreated} PRs created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-3 h-3 text-green-600" />
                    <span>{hoveredDay.prsMerged} PRs merged</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-purple-600" />
                    <span>{hoveredDay.totalActivity} total contributions</span>
                  </div>
                </div>
                {hoveredDay.pullRequests.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-600 mb-1">Recent PRs:</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {hoveredDay.pullRequests.slice(0, 3).map((pr, index) => (
                        <p key={index} className="text-xs truncate">
                          {pr.activityType === 'created' ? '📝' : '✅'} {pr.title}
                        </p>
                      ))}
                      {hoveredDay.pullRequests.length > 3 && (
                        <p className="text-xs text-gray-500">+{hoveredDay.pullRequests.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Weekly Breakdown
          </h4>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {weeklyBreakdown.map(({ weekIndex, weekActivities, weekTotal, weekStartDate, weekEndDate }) => (
              <div key={weekIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">
                    {format(weekStartDate, 'MMM d')} - {format(weekEndDate, 'MMM d')}
                  </p>
                  <p className="text-sm text-gray-600">Week {weekIndex + 1}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {weekActivities.map((day, index) => (
                      <div
                        key={index}
                        className={`w-2 h-8 rounded-sm ${getActivityColor(day.totalActivity, maxActivity)}`}
                        title={`${formatDateLabel(new Date(day.date))}: ${day.totalActivity} contributions`}
                      />
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{weekTotal}</p>
                    <p className="text-sm text-gray-600">contributions</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};