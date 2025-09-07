import type { ITeamRepository } from './team.repository.interface';
import type { IPeerRepository } from './peer.repository.interface';
import type { IObjectiveRepository } from './objective.repository.interface';
import type { IMetricRepository } from './metric.repository.interface';

// Cloud implementations
import { CloudTeamRepository } from './cloud/team.repository';
import { CloudPeerRepository } from './cloud/peer.repository';
import { CloudObjectiveRepository } from './cloud/objective.repository';
import { CloudMetricRepository } from './cloud/metric.repository';

// Local implementations
import { LocalTeamRepository } from './local/team.repository';
// TODO: We'll implement these next
// import { LocalPeerRepository } from './local/peer.repository';
// import { LocalObjectiveRepository } from './local/objective.repository';
// import { LocalMetricRepository } from './local/metric.repository';

export type StorageType = 'cloud' | 'local';

export interface RepositoryConfig {
  storageType: StorageType;
  apiBaseUrl?: string;
}

class RepositoryFactory {
  private config: RepositoryConfig;

  constructor(config: RepositoryConfig) {
    this.config = config;
  }

  updateConfig(newConfig: Partial<RepositoryConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  createTeamRepository(): ITeamRepository {
    if (this.config.storageType === 'cloud') {
      return new CloudTeamRepository(this.config.apiBaseUrl);
    }
    return new LocalTeamRepository();
  }

  createPeerRepository(): IPeerRepository {
    if (this.config.storageType === 'cloud') {
      return new CloudPeerRepository(this.config.apiBaseUrl);
    }
    // TODO: Implement LocalPeerRepository
    throw new Error('LocalPeerRepository not implemented yet');
  }

  createObjectiveRepository(): IObjectiveRepository {
    if (this.config.storageType === 'cloud') {
      return new CloudObjectiveRepository(this.config.apiBaseUrl);
    }
    // TODO: Implement LocalObjectiveRepository
    throw new Error('LocalObjectiveRepository not implemented yet');
  }

  createMetricRepository(): IMetricRepository {
    if (this.config.storageType === 'cloud') {
      return new CloudMetricRepository(this.config.apiBaseUrl);
    }
    // TODO: Implement LocalMetricRepository
    throw new Error('LocalMetricRepository not implemented yet');
  }
}

// Singleton instance
let factoryInstance: RepositoryFactory;

export const initializeRepositoryFactory = (config: RepositoryConfig) => {
  factoryInstance = new RepositoryFactory(config);
  return factoryInstance;
};

export const getRepositoryFactory = (): RepositoryFactory => {
  if (!factoryInstance) {
    // Default to local storage if not initialized
    factoryInstance = new RepositoryFactory({ 
      storageType: 'local' 
    });
  }
  return factoryInstance;
};

// Convenience functions
export const getTeamRepository = (): ITeamRepository => 
  getRepositoryFactory().createTeamRepository();

export const getPeerRepository = (): IPeerRepository => 
  getRepositoryFactory().createPeerRepository();

export const getObjectiveRepository = (): IObjectiveRepository => 
  getRepositoryFactory().createObjectiveRepository();

export const getMetricRepository = (): IMetricRepository => 
  getRepositoryFactory().createMetricRepository();