import { useState, useEffect } from 'react';
import { createCreateObjectiveUseCase, CreateObjectiveDependencies } from '@/modules/objectives/application/use-cases/create-objective.use-case';
import { ObjectiveData, isObjectiveCompleted, isObjectiveOverdue, getDaysUntilTarget } from '@/modules/objectives/domain/objective.entity';
import { createObjectiveProgress } from '@/modules/objectives/domain/objective-progress.vo';
import { getPeerRepository, getObjectiveRepository } from '@/shared/infrastructure/factories/repository.factory';
import { ObjectiveRepository } from '@/modules/objectives/domain/objective.repository';
import { PeerRepository } from '@/modules/peers/domain/peer.repository';

export type CreateObjectiveFormData = {
  readonly title: string;
  readonly description: string;
  readonly peerId: string;
  readonly category: string;
  readonly priority: string;
  readonly progress: number;
  readonly targetDate: Date;
  readonly tags: readonly string[];
};

export type ObjectiveWithPeer = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly progress: number;
  readonly targetDate: Date;
  readonly isCompleted: boolean;
  readonly isOverdue: boolean;
  readonly daysUntilTarget: number;
  readonly tags: string[];
  readonly peerName: string;
  readonly peerAvatar?: string;
  readonly createdAt: Date;
};



export const useObjectives = () => {
  const [objectives, setObjectives] = useState<ObjectiveWithPeer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<{
    objectiveRepository: ObjectiveRepository;
    peerRepository: PeerRepository;
  } | null>(null);

  useEffect(() => {
    initializeRepositories();
  }, []);

  const initializeRepositories = async () => {
    try {
      const objectiveRepository = await getObjectiveRepository();
      const peerRepository = await getPeerRepository();
      
      setRepositories({ objectiveRepository, peerRepository });
      await loadObjectives({ objectiveRepository, peerRepository });
    } catch (err) {
      setError('Failed to initialize repositories');
      setIsLoading(false);
    }
  };

  const loadObjectives = async (repos?: {
    objectiveRepository: ObjectiveRepository;
    peerRepository: PeerRepository;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentRepos = repos || repositories;
      if (!currentRepos) {
        throw new Error('Repositories not initialized');
      }
      
      const objectiveEntities = await currentRepos.objectiveRepository.findAll();
      const peers = await currentRepos.peerRepository.findAll();

      const objectivesWithPeers = objectiveEntities.map(objective => {
        const peer = peers.find(p => p.id === objective.peerId);
        
        return {
          id: objective.id,
          title: objective.title,
          description: objective.description,
          category: objective.category,
          priority: objective.priority as 'low' | 'medium' | 'high' | 'critical',
          progress: objective.progress as number,
          targetDate: objective.targetDate,
          isCompleted: isObjectiveCompleted(objective),
          isOverdue: isObjectiveOverdue(objective),
          daysUntilTarget: getDaysUntilTarget(objective),
          tags: [...objective.tags],
          peerName: peer?.name || 'Unknown',
          peerAvatar: peer?.avatar,
          createdAt: objective.createdAt
        };
      });

      setObjectives(objectivesWithPeers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load objectives');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewObjective = async (objectiveData: CreateObjectiveFormData) => {
    try {
      if (!repositories) {
        throw new Error('Repositories not initialized');
      }

      const createObjectiveDependencies: CreateObjectiveDependencies = {
        objectiveRepository: repositories.objectiveRepository,
        peerRepository: repositories.peerRepository
      };
      const createObjectiveUseCase = createCreateObjectiveUseCase(createObjectiveDependencies);

      const response = await createObjectiveUseCase({
        title: objectiveData.title,
        description: objectiveData.description,
        peerId: objectiveData.peerId,
        category: objectiveData.category as any,
        priority: objectiveData.priority as any,
        progress: createObjectiveProgress(objectiveData.progress),
        targetDate: objectiveData.targetDate,
        tags: objectiveData.tags
      });

      if (response.success) {
        await loadObjectives(); // Refresh objectives list
      } else {
        throw new Error(response.error || 'Failed to create objective');
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  };

  return {
    objectives,
    isLoading,
    error,
    createObjective: createNewObjective,
    refreshObjectives: loadObjectives
  } as const;
};