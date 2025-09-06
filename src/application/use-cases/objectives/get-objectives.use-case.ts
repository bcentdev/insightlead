import { ObjectiveRepository, ObjectiveFilters } from '../../../domain/repositories/objective.repository';
import { Objective, ObjectiveCategory, ObjectivePriority, isObjectiveOverdue, isObjectiveCompleted, getDaysUntilTarget } from '../../../domain/entities/objective.entity';

export type GetObjectivesRequest = {
  peerId?: string;
  category?: ObjectiveCategory;
  priority?: ObjectivePriority;
  isCompleted?: boolean;
  isOverdue?: boolean;
  tags?: string[];
  targetDateFrom?: Date;
  targetDateTo?: Date;
}

export type ObjectiveSummary = {
  id: string;
  title: string;
  description: string;
  peerId: string;
  category: ObjectiveCategory;
  priority: ObjectivePriority;
  progress: number;
  targetDate: Date;
  isCompleted: boolean;
  isOverdue: boolean;
  daysUntilTarget: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type GetObjectivesResponse = {
  success: boolean;
  objectives?: ObjectiveSummary[];
  total?: number;
  error?: string;
}

// Pure function to map objective to summary
const mapObjectiveToSummary = (objective: Objective): ObjectiveSummary => ({
  id: objective.id,
  title: objective.title,
  description: objective.description,
  peerId: objective.peerId,
  category: objective.category,
  priority: objective.priority,
  progress: objective.progress as number,
  targetDate: objective.targetDate,
  isCompleted: isObjectiveCompleted(objective),
  isOverdue: isObjectiveOverdue(objective),
  daysUntilTarget: getDaysUntilTarget(objective),
  tags: [...objective.tags],
  createdAt: objective.createdAt,
  updatedAt: objective.updatedAt
});

// Pure function to build filters from request
const buildFiltersFromRequest = (request: GetObjectivesRequest): ObjectiveFilters => ({
  peerId: request.peerId,
  category: request.category,
  priority: request.priority,
  isCompleted: request.isCompleted,
  isOverdue: request.isOverdue,
  tags: request.tags,
  targetDateFrom: request.targetDateFrom,
  targetDateTo: request.targetDateTo
});

// Main use case function
export const createGetObjectivesUseCase = (objectiveRepository: ObjectiveRepository) => {
  return async (request: GetObjectivesRequest): Promise<GetObjectivesResponse> => {
    try {
      // Build filters
      const filters = buildFiltersFromRequest(request);

      // Fetch objectives
      const objectives = await objectiveRepository.findByFilters(filters);

      // Transform to summary format
      const objectiveSummaries = objectives.map(mapObjectiveToSummary);

      return {
        success: true,
        objectives: objectiveSummaries,
        total: objectiveSummaries.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };
};

// Factory function for easy instantiation
export const getObjectives = (objectiveRepository: ObjectiveRepository) => 
  createGetObjectivesUseCase(objectiveRepository);