import { ObjectiveRepository } from '@/modules/objectives/domain/objective.repository';
import { updateObjectiveProgress, addObjectiveTag, isObjectiveCompleted } from '@/modules/objectives/domain/objective.entity';
import { objectiveProgressFromPercentage } from '@/modules/objectives/domain/objective-progress.vo';

export type TrackProgressRequest = {
  readonly objectiveId: string;
  readonly newProgress: number;
  readonly notes?: string;
};

export type TrackProgressResponse = {
  readonly success: boolean;
  readonly isCompleted?: boolean;
  readonly error?: string;
};

export type TrackProgressDependencies = {
  readonly objectiveRepository: ObjectiveRepository;
};

export const createTrackProgressUseCase = (dependencies: TrackProgressDependencies) =>
  async (request: TrackProgressRequest): Promise<TrackProgressResponse> => {
    const { objectiveRepository } = dependencies;

    try {
      const objective = await objectiveRepository.findById(request.objectiveId);
      if (!objective) {
        return {
          success: false,
          error: 'Objective not found'
        };
      }

      const newProgress = objectiveProgressFromPercentage(request.newProgress);
      let updatedObjective = updateObjectiveProgress(objective, newProgress);

      if (request.notes) {
        updatedObjective = addObjectiveTag(updatedObjective, `note:${new Date().toISOString()}`);
      }

      await objectiveRepository.update(updatedObjective);

      return {
        success: true,
        isCompleted: isObjectiveCompleted(updatedObjective)
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };