import { TeamRepository } from '../../domain/repositories/team.repository';
import { TeamData } from '../../domain/entities/team.entity';

// Shared state across all repository instances
let mockTeamsData: TeamData[] = [];

const findAll = async (): Promise<TeamData[]> => {
  return [...mockTeamsData];
};

const findById = async (id: string): Promise<TeamData | null> => {
  return mockTeamsData.find(team => team.id === id) || null;
};

const save = async (team: TeamData): Promise<void> => {
  const existingIndex = mockTeamsData.findIndex(t => t.id === team.id);
  if (existingIndex >= 0) {
    mockTeamsData[existingIndex] = team;
  } else {
    mockTeamsData.push(team);
  }
};

const update = async (team: TeamData): Promise<void> => {
  const index = mockTeamsData.findIndex(t => t.id === team.id);
  if (index >= 0) {
    mockTeamsData[index] = team;
  } else {
    throw new Error(`Team with id ${team.id} not found`);
  }
};

const deleteTeam = async (id: string): Promise<void> => {
  mockTeamsData = mockTeamsData.filter(team => team.id !== id);
};

export const clearMockTeamsData = (): void => {
  mockTeamsData = [];
};

export const createMockTeamRepository = (): TeamRepository => ({
  findAll,
  findById,
  save,
  update,
  delete: deleteTeam
});