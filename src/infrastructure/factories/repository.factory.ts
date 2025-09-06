import { PeerRepository } from '../../domain/repositories/peer.repository';
import { TeamRepository } from '../../domain/repositories/team.repository';
import { ObjectiveRepository } from '../../domain/repositories/objective.repository';

import { IndexedDBPeerRepository } from '../repositories/indexeddb-peer.repository';
import { IndexedDBTeamRepository } from '../repositories/indexeddb-team.repository';
import { IndexedDBObjectiveRepository } from '../repositories/indexeddb-objective.repository';

import { createMockPeerRepository, clearMockPeersData } from '../repositories/mock-peer.repository';
import { createMockTeamRepository, clearMockTeamsData } from '../repositories/mock-team.repository';
import { createMockObjectiveRepository, clearMockObjectivesData } from '../repositories/mock-objective.repository';
import { seedMockData } from '../seeders/mock-data.seeder';
import { seedIndexedDB } from '../seeders/indexeddb-seeder';

export interface RepositoryContainer {
  peerRepository: PeerRepository;
  teamRepository: TeamRepository;
  objectiveRepository: ObjectiveRepository;
}

// Global state for singleton behavior
let repositoryInstance: RepositoryContainer | null = null;
let mockDataSeeded = false;
let indexedDBSeeded = false;

const createRepositories = async (): Promise<RepositoryContainer> => {
  if (repositoryInstance) {
    return repositoryInstance;
  }

  const envValue = import.meta.env.VITE_USE_MOCK_DATA;
  const useMockData = envValue === 'true';
  
  console.log('🔍 Repository Factory Debug:');
  console.log('- VITE_USE_MOCK_DATA raw value:', envValue);
  console.log('- useMockData computed:', useMockData);
  console.log('- Using', useMockData ? 'MOCK' : 'INDEXEDDB', 'repositories');
  
  if (!useMockData) {
    const shouldSeedIndexedDB = import.meta.env.VITE_SEED_INDEXEDDB === 'true';
    console.log('- VITE_SEED_INDEXEDDB:', import.meta.env.VITE_SEED_INDEXEDDB);
    console.log('- IndexedDB seeding enabled:', shouldSeedIndexedDB);
  }

  if (useMockData) {
    const peerRepository = createMockPeerRepository();
    const teamRepository = createMockTeamRepository();
    const objectiveRepository = createMockObjectiveRepository();

    repositoryInstance = {
      peerRepository,
      teamRepository,
      objectiveRepository
    };

    // Seed mock data if not already seeded
    if (!mockDataSeeded) {
      await seedMockData(peerRepository, teamRepository, objectiveRepository);
      mockDataSeeded = true;
    }
  } else {
    repositoryInstance = {
      peerRepository: new IndexedDBPeerRepository(),
      teamRepository: new IndexedDBTeamRepository(),
      objectiveRepository: new IndexedDBObjectiveRepository()
    };

    // Seed IndexedDB data if not already seeded and seeding is enabled
    const shouldSeedIndexedDB = import.meta.env.VITE_SEED_INDEXEDDB === 'true';
    if (!indexedDBSeeded && shouldSeedIndexedDB) {
      try {
        await seedIndexedDB();
        indexedDBSeeded = true;
      } catch (error) {
        console.warn('Failed to seed IndexedDB data:', error);
      }
    }
  }

  return repositoryInstance;
};

// Reset function for testing or environment changes
export const resetRepositories = (): void => {
  console.log('🔄 Resetting repositories...');
  repositoryInstance = null;
  mockDataSeeded = false;
  indexedDBSeeded = false;
};

// Convenience functions for getting individual repositories
export const getPeerRepository = async (): Promise<PeerRepository> => {
  const repositories = await createRepositories();
  return repositories.peerRepository;
};

export const getTeamRepository = async (): Promise<TeamRepository> => {
  const repositories = await createRepositories();
  return repositories.teamRepository;
};

export const getObjectiveRepository = async (): Promise<ObjectiveRepository> => {
  const repositories = await createRepositories();
  return repositories.objectiveRepository;
};

export const getRepositories = createRepositories;

// Clear all data function
export const clearAllData = async (): Promise<void> => {
  console.log('🗑️ Clearing all data...');
  
  const envValue = import.meta.env.VITE_USE_MOCK_DATA;
  const useMockData = envValue === 'true';
  
  if (useMockData) {
    // Clear mock data
    clearMockPeersData();
    clearMockTeamsData();
    clearMockObjectivesData();
    console.log('✅ Mock data cleared');
  } else {
    // Clear IndexedDB data
    const repositories = await createRepositories();
    
    // Clear all entities
    const peers = await repositories.peerRepository.findAll();
    const teams = await repositories.teamRepository.findAll();
    const objectives = await repositories.objectiveRepository.findAll();
    
    // Delete all peers
    for (const peer of peers) {
      await repositories.peerRepository.delete(peer.id);
    }
    
    // Delete all teams
    for (const team of teams) {
      await repositories.teamRepository.delete(team.id);
    }
    
    // Delete all objectives
    for (const objective of objectives) {
      await repositories.objectiveRepository.delete(objective.id);
    }
    
    console.log('✅ IndexedDB data cleared');
  }
  
  // Reset repositories to force reinitialization
  resetRepositories();
};