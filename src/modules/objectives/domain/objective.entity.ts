import { v4 as uuidv4 } from 'uuid';
import { ObjectiveProgress, isObjectiveProgressComplete } from '@/modules/objectives/domain/objective-progress.vo';

export const OBJECTIVE_CATEGORIES = {
  TECHNICAL_SKILLS: 'technical_skills',
  LEADERSHIP: 'leadership',
  PROJECT_DELIVERY: 'project_delivery',
  TEAM_COLLABORATION: 'team_collaboration',
  PROCESS_IMPROVEMENT: 'process_improvement',
  MENTORING: 'mentoring',
  COMMUNICATION: 'communication',
  INNOVATION: 'innovation'
} as const;

export type ObjectiveCategory = typeof OBJECTIVE_CATEGORIES[keyof typeof OBJECTIVE_CATEGORIES];

export const OBJECTIVE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export type ObjectivePriority = typeof OBJECTIVE_PRIORITIES[keyof typeof OBJECTIVE_PRIORITIES];

export type ObjectiveMetric = {
  readonly id: string;
  readonly name: string;
  readonly target: number;
  readonly current: number;
  readonly unit: string;
  readonly updatedAt: Date;
};

export type ObjectiveData = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly peerId: string;
  readonly category: ObjectiveCategory;
  readonly priority: ObjectivePriority;
  readonly progress: ObjectiveProgress;
  readonly targetDate: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly completedAt?: Date;
  readonly tags: readonly string[];
  readonly metrics: readonly ObjectiveMetric[];
};

export type CreateObjectiveProps = {
  id?: string;
  title: string;
  description: string;
  peerId: string;
  category: ObjectiveCategory;
  priority: ObjectivePriority;
  progress: ObjectiveProgress;
  targetDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
  tags?: string[];
  metrics?: ObjectiveMetric[];
};

export type UpdateObjectiveDetailsProps = Partial<Pick<ObjectiveData, 'title' | 'description' | 'category' | 'priority' | 'targetDate'>>;

export type CreateObjectiveMetricProps = Omit<ObjectiveMetric, 'id' | 'updatedAt'>;

const validateObjectiveData = (data: Omit<ObjectiveData, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>): void => {
  if (!data.title.trim()) {
    throw new Error('Objective title cannot be empty');
  }
  if (!data.description.trim()) {
    throw new Error('Objective description cannot be empty');
  }
  if (!data.peerId.trim()) {
    throw new Error('Objective must be assigned to a peer');
  }
  if (data.targetDate < new Date()) {
    throw new Error('Target date must be in the future');
  }
};

export const createObjective = (props: CreateObjectiveProps): ObjectiveData => {
  const now = new Date();
  const objectiveData: ObjectiveData = {
    id: props.id || uuidv4(),
    title: props.title,
    description: props.description,
    peerId: props.peerId,
    category: props.category,
    priority: props.priority,
    progress: props.progress,
    targetDate: props.targetDate,
    createdAt: props.createdAt || now,
    updatedAt: props.updatedAt || now,
    completedAt: props.completedAt,
    tags: props.tags || [],
    metrics: props.metrics || []
  };

  validateObjectiveData(objectiveData);
  return objectiveData;
};

export const updateObjectiveProgress = (objective: ObjectiveData, progress: ObjectiveProgress): ObjectiveData => {
  const updatedAt = new Date();
  const completedAt = isObjectiveProgressComplete(progress) ? updatedAt : undefined;
  
  return {
    ...objective,
    progress,
    updatedAt,
    completedAt
  };
};

export const updateObjectiveDetails = (objective: ObjectiveData, updates: UpdateObjectiveDetailsProps): ObjectiveData => {
  const updatedObjective: ObjectiveData = {
    ...objective,
    ...updates,
    updatedAt: new Date()
  };

  validateObjectiveData(updatedObjective);
  return updatedObjective;
};

export const addObjectiveTag = (objective: ObjectiveData, tag: string): ObjectiveData => {
  if (objective.tags.includes(tag)) {
    return objective;
  }
  
  return {
    ...objective,
    tags: [...objective.tags, tag],
    updatedAt: new Date()
  };
};

export const removeObjectiveTag = (objective: ObjectiveData, tag: string): ObjectiveData => ({
  ...objective,
  tags: objective.tags.filter(t => t !== tag),
  updatedAt: new Date()
});

export const addObjectiveMetric = (objective: ObjectiveData, metric: CreateObjectiveMetricProps): ObjectiveData => {
  const newMetric: ObjectiveMetric = {
    ...metric,
    id: uuidv4(),
    updatedAt: new Date()
  };
  
  return {
    ...objective,
    metrics: [...objective.metrics, newMetric],
    updatedAt: new Date()
  };
};

export const updateObjectiveMetric = (objective: ObjectiveData, metricId: string, current: number): ObjectiveData => {
  const updatedAt = new Date();
  const updatedMetrics = objective.metrics.map(metric => 
    metric.id === metricId 
      ? { ...metric, current, updatedAt }
      : metric
  );
  
  return {
    ...objective,
    metrics: updatedMetrics,
    updatedAt
  };
};

export const removeObjectiveMetric = (objective: ObjectiveData, metricId: string): ObjectiveData => ({
  ...objective,
  metrics: objective.metrics.filter(m => m.id !== metricId),
  updatedAt: new Date()
});

export const isObjectiveOverdue = (objective: ObjectiveData): boolean => 
  new Date() > objective.targetDate && !isObjectiveCompleted(objective);

export const isObjectiveCompleted = (objective: ObjectiveData): boolean => 
  isObjectiveProgressComplete(objective.progress);

export const getDaysUntilTarget = (objective: ObjectiveData): number => {
  const now = new Date();
  const timeDiff = objective.targetDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

export const objectiveToJSON = (objective: ObjectiveData): CreateObjectiveProps => ({
  id: objective.id,
  title: objective.title,
  description: objective.description,
  peerId: objective.peerId,
  category: objective.category,
  priority: objective.priority,
  progress: objective.progress,
  targetDate: objective.targetDate,
  createdAt: objective.createdAt,
  updatedAt: objective.updatedAt,
  completedAt: objective.completedAt,
  tags: [...objective.tags],
  metrics: [...objective.metrics]
});

// Type alias for compatibility
export type Objective = ObjectiveData;