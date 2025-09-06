import { createObjective, ObjectiveCategory, ObjectivePriority, ObjectiveData } from '@/modules/objectives/domain/objective.entity';
import { ObjectiveProgress } from '@/shared/domain/value-objects/objective-progress.vo';
import { ObjectiveRepository } from '@/modules/objectives/domain/objective.repository';
import { PeerRepository } from '@/modules/peers/domain/peer.repository';

export type CreateObjectiveRequest = {
  readonly title: string;
  readonly description: string;
  readonly peerId: string;
  readonly category: ObjectiveCategory;
  readonly priority: ObjectivePriority;
  readonly progress: ObjectiveProgress;
  readonly targetDate: Date;
  readonly tags?: readonly string[];
};

export type CreateObjectiveResponse = {
  readonly success: boolean;
  readonly data?: ObjectiveData;
  readonly error?: string;
};

export type CreateObjectiveDependencies = {
  readonly objectiveRepository: ObjectiveRepository;
  readonly peerRepository: PeerRepository;
};

export const createCreateObjectiveUseCase = (dependencies: CreateObjectiveDependencies) =>
  async (request: CreateObjectiveRequest): Promise<CreateObjectiveResponse> => {
    const { objectiveRepository, peerRepository } = dependencies;

    try {
      const peer = await peerRepository.findById(request.peerId);
      if (!peer) {
        return {
          success: false,
          error: 'Peer not found'
        };
      }

      const objective = createObjective({
        title: request.title,
        description: request.description,
        peerId: request.peerId,
        category: request.category,
        priority: request.priority,
        progress: request.progress,
        targetDate: request.targetDate,
        tags: request.tags ? [...request.tags] : undefined
      });

      const savedObjective = await objectiveRepository.save(objective);

      return {
        success: true,
        data: savedObjective
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };