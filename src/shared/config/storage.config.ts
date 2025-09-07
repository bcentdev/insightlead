import { initializeRepositoryFactory, type StorageType, type RepositoryConfig } from '@/shared/infrastructure/repositories/repository.factory';

const getStorageType = (): StorageType => {
  const storageType = import.meta.env.VITE_STORAGE_TYPE;
  return storageType === 'cloud' ? 'cloud' : 'local';
};

const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || '';
};

export const createStorageConfig = (): RepositoryConfig => {
  const storageType = getStorageType();
  
  const config: RepositoryConfig = {
    storageType,
  };

  if (storageType === 'cloud') {
    config.apiBaseUrl = getApiBaseUrl();
  }

  return config;
};

// Initialize the repository factory on app startup
export const initializeStorage = () => {
  const config = createStorageConfig();
  
  console.log('🗄️ Storage initialized:', {
    type: config.storageType,
    apiUrl: config.apiBaseUrl || 'N/A (local storage)',
  });
  
  return initializeRepositoryFactory(config);
};

export const isCloudStorage = () => getStorageType() === 'cloud';
export const isLocalStorage = () => getStorageType() === 'local';