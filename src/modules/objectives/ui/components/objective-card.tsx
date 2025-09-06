import { Card, CardBody, CardHeader, Progress, Chip, Button } from '@heroui/react';
import { Calendar, User, Edit3, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

// Types using functional programming approach
type ObjectivePriority = 'low' | 'medium' | 'high' | 'critical';

type ObjectiveCardProps = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly priority: ObjectivePriority;
  readonly progress: number;
  readonly targetDate: Date;
  readonly isCompleted: boolean;
  readonly isOverdue: boolean;
  readonly daysUntilTarget: number;
  readonly tags: readonly string[];
  readonly peerName: string;
  readonly onEdit?: (id: string) => void;
  readonly onUpdateProgress?: (id: string) => void;
};

// Pure functions
const getPriorityColor = (priority: ObjectivePriority): 'default' | 'primary' | 'warning' | 'danger' => {
  const colors = {
    low: 'default',
    medium: 'primary',
    high: 'warning',
    critical: 'danger'
  } as const;
  return colors[priority];
};

const getCategoryColor = (category: string): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' => {
  const colors = {
    technical_skills: 'primary',
    leadership: 'secondary',
    project_delivery: 'success',
    team_collaboration: 'warning',
    process_improvement: 'danger',
    mentoring: 'default',
    communication: 'primary',
    innovation: 'secondary'
  } as const;
  return colors[category as keyof typeof colors] || 'default';
};

const getProgressColor = (progress: number, isCompleted: boolean, isOverdue: boolean): 'primary' | 'success' | 'warning' | 'danger' => {
  if (isCompleted) return 'success';
  if (isOverdue) return 'danger';
  if (progress >= 75) return 'success';
  if (progress >= 50) return 'warning';
  return 'primary';
};

const formatCategoryText = (category: string): string =>
  category.replace('_', ' ');

const getTargetDateText = (
  isCompleted: boolean,
  isOverdue: boolean,
  daysUntilTarget: number,
  targetDate: Date
): string => {
  if (isCompleted) return 'Completed';
  if (isOverdue) return `Overdue by ${Math.abs(daysUntilTarget)} days`;
  if (daysUntilTarget <= 7) return `${daysUntilTarget} days left`;
  return format(targetDate, 'MMM dd, yyyy');
};

const getTargetDateColor = (
  isCompleted: boolean,
  isOverdue: boolean,
  daysUntilTarget: number
): string => {
  if (isCompleted) return 'text-green-600';
  if (isOverdue) return 'text-red-600';
  if (daysUntilTarget <= 7) return 'text-orange-600';
  return 'text-gray-600';
};

const getCardBackgroundClass = (isCompleted: boolean, isOverdue: boolean): string => {
  if (isCompleted) return 'bg-green-50/50';
  if (isOverdue) return 'bg-red-50/50';
  return '';
};

export const ObjectiveCard = ({
  id,
  title,
  description,
  category,
  priority,
  progress,
  targetDate,
  isCompleted,
  isOverdue,
  daysUntilTarget,
  tags,
  peerName,
  onEdit,
  onUpdateProgress
}: ObjectiveCardProps) => {
  const priorityColor = getPriorityColor(priority);
  const categoryColor = getCategoryColor(category);
  const progressColor = getProgressColor(progress, isCompleted, isOverdue);
  const categoryText = formatCategoryText(category);
  const targetDateText = getTargetDateText(isCompleted, isOverdue, daysUntilTarget, targetDate);
  const targetDateColor = getTargetDateColor(isCompleted, isOverdue, daysUntilTarget);
  const cardBackgroundClass = getCardBackgroundClass(isCompleted, isOverdue);

  return (
    <Card className={`border-none shadow-sm hover:shadow-md transition-all ${cardBackgroundClass}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between w-full">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Chip
                size="sm"
                variant="flat"
                color={categoryColor}
              >
                {categoryText}
              </Chip>
              <Chip
                size="sm"
                variant="flat"
                color={priorityColor}
              >
                {priority}
              </Chip>
              {isCompleted && (
                <Chip
                  size="sm"
                  variant="flat"
                  color="success"
                  startContent={<CheckCircle className="w-3 h-3" />}
                >
                  Completed
                </Chip>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {title}
            </h3>
          </div>
          
          <div className="flex items-center gap-1 ml-4">
            {onEdit && (
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => onEdit(id)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {description}
        </p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress
            value={progress}
            color={progressColor}
            size="sm"
            className="w-full"
          />
        </div>

        {/* Meta Information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{peerName}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className={targetDateColor}>
              {targetDateText}
            </span>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                size="sm"
                variant="flat"
                color="default"
                className="text-xs"
              >
                #{tag}
              </Chip>
            ))}
            {tags.length > 3 && (
              <Chip
                size="sm"
                variant="flat"
                color="default"
                className="text-xs"
              >
                +{tags.length - 3} more
              </Chip>
            )}
          </div>
        )}

        {/* Actions */}
        {!isCompleted && onUpdateProgress && (
          <div className="flex justify-end">
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={() => onUpdateProgress(id)}
            >
              Update Progress
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};