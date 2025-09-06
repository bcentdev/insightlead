declare const ObjectiveProgressBrand: unique symbol;

export type ObjectiveProgress = number & { readonly [ObjectiveProgressBrand]: never };

export const PROGRESS_LEVELS = {
  NOT_STARTED: 'not_started',
  MINIMAL: 'minimal',
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  COMPLETE: 'complete'
} as const;

export type ProgressLevel = typeof PROGRESS_LEVELS[keyof typeof PROGRESS_LEVELS];

const validateProgressPercentage = (percentage: number): void => {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Progress percentage must be between 0 and 100');
  }
};

export const createObjectiveProgress = (percentage: number): ObjectiveProgress => {
  validateProgressPercentage(percentage);
  return percentage as ObjectiveProgress;
};

export const isValidObjectiveProgress = (percentage: number): percentage is ObjectiveProgress => {
  try {
    validateProgressPercentage(percentage);
    return true;
  } catch {
    return false;
  }
};

export const objectiveProgressEqual = (a: ObjectiveProgress, b: ObjectiveProgress): boolean => 
  a === b;

export const isObjectiveProgressComplete = (progress: ObjectiveProgress): boolean => 
  progress === 100;

export const isObjectiveProgressInProgress = (progress: ObjectiveProgress): boolean => 
  progress > 0 && progress < 100;

export const isObjectiveProgressNotStarted = (progress: ObjectiveProgress): boolean => 
  progress === 0;

export const getObjectiveProgressLevel = (progress: ObjectiveProgress): ProgressLevel => {
  if (progress === 0) return PROGRESS_LEVELS.NOT_STARTED;
  if (progress < 25) return PROGRESS_LEVELS.MINIMAL;
  if (progress < 50) return PROGRESS_LEVELS.LOW;
  if (progress < 75) return PROGRESS_LEVELS.MODERATE;
  if (progress < 100) return PROGRESS_LEVELS.HIGH;
  return PROGRESS_LEVELS.COMPLETE;
};

export const addToObjectiveProgress = (progress: ObjectiveProgress, increment: number): ObjectiveProgress => {
  const newPercentage = Math.min(100, Math.max(0, progress + increment));
  return createObjectiveProgress(newPercentage);
};

export const subtractFromObjectiveProgress = (progress: ObjectiveProgress, decrement: number): ObjectiveProgress => {
  const newPercentage = Math.min(100, Math.max(0, progress - decrement));
  return createObjectiveProgress(newPercentage);
};

export const objectiveProgressToString = (progress: ObjectiveProgress): string => 
  `${progress}%`;

export const objectiveProgressToNumber = (progress: ObjectiveProgress): number => 
  progress as number;

export const objectiveProgressFromPercentage = (percentage: number): ObjectiveProgress => 
  createObjectiveProgress(percentage);

export const objectiveProgressNotStarted = (): ObjectiveProgress => 
  createObjectiveProgress(0);

export const objectiveProgressComplete = (): ObjectiveProgress => 
  createObjectiveProgress(100);

export const objectiveProgressFromRatio = (current: number, total: number): ObjectiveProgress => {
  if (total === 0) return objectiveProgressNotStarted();
  const percentage = Math.round((current / total) * 100);
  return createObjectiveProgress(percentage);
};