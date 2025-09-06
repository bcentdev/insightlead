import { ObjectiveData, ObjectiveCategory, ObjectivePriority } from './objective.entity';

export type ObjectiveFilters = {
  readonly peerId?: string;
  readonly category?: ObjectiveCategory;
  readonly priority?: ObjectivePriority;
  readonly isCompleted?: boolean;
  readonly isOverdue?: boolean;
  readonly tags?: readonly string[];
  readonly targetDateFrom?: Date;
  readonly targetDateTo?: Date;
};

export type ObjectiveRepository = {
  readonly save: (objective: ObjectiveData) => Promise<ObjectiveData>;
  readonly findById: (id: string) => Promise<ObjectiveData | null>;
  readonly findByPeerId: (peerId: string) => Promise<readonly ObjectiveData[]>;
  readonly findByFilters: (filters: ObjectiveFilters) => Promise<readonly ObjectiveData[]>;
  readonly findAll: () => Promise<readonly ObjectiveData[]>;
  readonly update: (objective: ObjectiveData) => Promise<void>;
  readonly delete: (id: string) => Promise<void>;
  readonly countByPeerId: (peerId: string) => Promise<number>;
  readonly countCompletedByPeerId: (peerId: string) => Promise<number>;
  readonly findOverdueObjectives: () => Promise<readonly ObjectiveData[]>;
};