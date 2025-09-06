import { ObjectiveRepository } from '@/modules/objectives/domain/objective.repository';
import { ObjectiveData } from '@/modules/objectives/domain/objective.entity';

// Shared state across all repository instances
let mockObjectivesData: ObjectiveData[] = [];

const findAll = async (): Promise<ObjectiveData[]> => {
  return [...mockObjectivesData];
};

const findById = async (id: string): Promise<ObjectiveData | null> => {
  return mockObjectivesData.find(obj => obj.id === id) || null;
};

const save = async (objective: ObjectiveData): Promise<void> => {
  const existingIndex = mockObjectivesData.findIndex(obj => obj.id === objective.id);
  if (existingIndex >= 0) {
    mockObjectivesData[existingIndex] = objective;
  } else {
    mockObjectivesData.push(objective);
  }
};

const update = async (objective: ObjectiveData): Promise<void> => {
  const index = mockObjectivesData.findIndex(obj => obj.id === objective.id);
  if (index >= 0) {
    mockObjectivesData[index] = objective;
  } else {
    throw new Error(`Objective with id ${objective.id} not found`);
  }
};

const deleteObjective = async (id: string): Promise<void> => {
  mockObjectivesData = mockObjectivesData.filter(obj => obj.id !== id);
};

const findByPeerId = async (peerId: string): Promise<ObjectiveData[]> => {
  return mockObjectivesData.filter(obj => obj.peerId === peerId);
};

export const clearMockObjectivesData = (): void => {
  mockObjectivesData = [];
};

export const createMockObjectiveRepository = (): ObjectiveRepository => ({
  findAll,
  findById,
  save,
  update,
  delete: deleteObjective,
  findByPeerId
});