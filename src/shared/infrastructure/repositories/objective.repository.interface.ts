import type { ObjectiveData, CreateObjectiveProps } from '@/modules/objectives/domain/objective.entity';

export interface IObjectiveRepository {
  // Read operations
  getAll(): Promise<ObjectiveData[]>;
  getById(id: string): Promise<ObjectiveData | null>;
  getByPeerId(peerId: string): Promise<ObjectiveData[]>;
  getByCategory(category: string): Promise<ObjectiveData[]>;
  getOverdue(): Promise<ObjectiveData[]>;
  getCompleted(): Promise<ObjectiveData[]>;
  
  // Write operations
  create(objective: CreateObjectiveProps): Promise<ObjectiveData>;
  update(id: string, updates: Partial<CreateObjectiveProps>): Promise<ObjectiveData>;
  delete(id: string): Promise<void>;
  
  // Progress operations
  updateProgress(id: string, progress: number): Promise<ObjectiveData>;
  markCompleted(id: string): Promise<ObjectiveData>;
  
  // Metrics operations
  addMetric(objectiveId: string, metric: { name: string; target: number; current: number; unit: string }): Promise<void>;
  updateMetric(objectiveId: string, metricId: string, current: number): Promise<void>;
  removeMetric(objectiveId: string, metricId: string): Promise<void>;
}