import { createDatabase } from '@/shared/infrastructure/database/indexeddb.helper';

export type GitHubRepository = {
  id: string;
  name: string;
  owner: string;
  fullName: string; // owner/name format
  url: string;
  description?: string;
  isPrivate: boolean;
  addedAt: Date;
}

export type AppSettings = {
  githubToken?: string;
  jiraUrl?: string;
  jiraUsername?: string;
  jiraToken?: string;
  jiraCloudId?: string;
  autoSync: boolean;
  syncInterval: number;
  githubRepositories: GitHubRepository[];
}

export type SettingsEntry = {
  key: string;
  value: any;
  updatedAt: Date;
}

// Store name constant
const STORE_NAME = 'settings';
const db = createDatabase();

// Pure function to create settings entry
const createSettingsEntry = (key: string, value: any): SettingsEntry => ({
  key,
  value,
  updatedAt: new Date()
});

// Pure function to transform entries to settings object
const entriesToSettings = (entries: SettingsEntry[]): Record<string, any> => {
  const settings: Record<string, any> = {};
  entries.forEach(entry => {
    settings[entry.key] = entry.value;
  });
  return settings;
};

// Pure function to create AppSettings from raw settings
const createAppSettings = (allSettings: Record<string, any>): AppSettings => ({
  githubToken: allSettings.githubToken,
  jiraUrl: allSettings.jiraUrl,
  jiraUsername: allSettings.jiraUsername,
  jiraToken: allSettings.jiraToken,
  jiraCloudId: allSettings.jiraCloudId,
  autoSync: allSettings.autoSync ?? true,
  syncInterval: allSettings.syncInterval ?? 60,
  githubRepositories: allSettings.githubRepositories ?? []
});

// Function to get a single setting
const getSetting = async <T = any>(key: string): Promise<T | null> => {
  try {
    const entry = await db.get<SettingsEntry>(STORE_NAME, key);
    return entry ? entry.value : null;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return null;
  }
};

// Function to set a single setting
const setSetting = async (key: string, value: any): Promise<void> => {
  try {
    const entry = createSettingsEntry(key, value);
    await db.put(STORE_NAME, entry);
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
};

// Function to get all settings
const getAllSettings = async (): Promise<Record<string, any>> => {
  try {
    const entries = await db.getAll<SettingsEntry>(STORE_NAME);
    return entriesToSettings(entries);
  } catch (error) {
    console.error('Error getting all settings:', error);
    return {};
  }
};

// Function to get app-specific settings
const getAppSettings = async (): Promise<AppSettings> => {
  const allSettings = await getAllSettings();
  return createAppSettings(allSettings);
};

// Function to save app settings
const saveAppSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  const promises = Object.entries(settings).map(([key, value]) =>
    setSetting(key, value)
  );
  await Promise.all(promises);
};

// Function to delete a setting
const deleteSetting = async (key: string): Promise<void> => {
  try {
    await db.delete(STORE_NAME, key);
  } catch (error) {
    console.error(`Error deleting setting ${key}:`, error);
    throw error;
  }
};

// Function to clear all settings
const clearAllSettings = async (): Promise<void> => {
  try {
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error('Error clearing all settings:', error);
    throw error;
  }
};

// Repository management functions
const getGitHubRepositories = async (): Promise<GitHubRepository[]> => {
  return await getSetting<GitHubRepository[]>('githubRepositories') ?? [];
};

const addGitHubRepository = async (repository: Omit<GitHubRepository, 'addedAt'>): Promise<void> => {
  const repositories = await getGitHubRepositories();
  const newRepository: GitHubRepository = {
    ...repository,
    addedAt: new Date()
  };
  
  // Check if repository already exists
  const exists = repositories.some(repo => repo.fullName === newRepository.fullName);
  if (exists) {
    throw new Error(`Repository ${newRepository.fullName} is already added`);
  }
  
  repositories.push(newRepository);
  await setSetting('githubRepositories', repositories);
};

const removeGitHubRepository = async (repositoryId: string): Promise<void> => {
  const repositories = await getGitHubRepositories();
  const filteredRepositories = repositories.filter(repo => repo.id !== repositoryId);
  await setSetting('githubRepositories', filteredRepositories);
};

const updateGitHubRepository = async (repositoryId: string, updates: Partial<GitHubRepository>): Promise<void> => {
  const repositories = await getGitHubRepositories();
  const index = repositories.findIndex(repo => repo.id === repositoryId);
  
  if (index === -1) {
    throw new Error(`Repository with ID ${repositoryId} not found`);
  }
  
  repositories[index] = { ...repositories[index], ...updates };
  await setSetting('githubRepositories', repositories);
};

// Settings repository type for compatibility
export type SettingsRepositoryType = {
  getSetting: <T = any>(key: string) => Promise<T | null>;
  setSetting: (key: string, value: any) => Promise<void>;
  getAllSettings: () => Promise<Record<string, any>>;
  getAppSettings: () => Promise<AppSettings>;
  saveAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
  deleteSetting: (key: string) => Promise<void>;
  clearAllSettings: () => Promise<void>;
  getGitHubRepositories: () => Promise<GitHubRepository[]>;
  addGitHubRepository: (repository: Omit<GitHubRepository, 'addedAt'>) => Promise<void>;
  removeGitHubRepository: (repositoryId: string) => Promise<void>;
  updateGitHubRepository: (repositoryId: string, updates: Partial<GitHubRepository>) => Promise<void>;
};

// Factory function to create settings repository
export const createSettingsRepository = (): SettingsRepositoryType => ({
  getSetting,
  setSetting,
  getAllSettings,
  getAppSettings,
  saveAppSettings,
  deleteSetting,
  clearAllSettings,
  getGitHubRepositories,
  addGitHubRepository,
  removeGitHubRepository,
  updateGitHubRepository
});

// Functional exports
export { 
  getSetting, 
  setSetting, 
  getAllSettings, 
  getAppSettings, 
  saveAppSettings, 
  deleteSetting, 
  clearAllSettings,
  getGitHubRepositories,
  addGitHubRepository,
  removeGitHubRepository,
  updateGitHubRepository
};

// Class-based repository for backwards compatibility
export class SettingsRepository implements SettingsRepositoryType {
  private repository: SettingsRepositoryType;

  constructor() {
    this.repository = createSettingsRepository();
  }

  async getSetting<T = any>(key: string): Promise<T | null> {
    return this.repository.getSetting<T>(key);
  }

  async setSetting(key: string, value: any): Promise<void> {
    return this.repository.setSetting(key, value);
  }

  async getAllSettings(): Promise<Record<string, any>> {
    return this.repository.getAllSettings();
  }

  async getAppSettings(): Promise<AppSettings> {
    return this.repository.getAppSettings();
  }

  async saveAppSettings(settings: Partial<AppSettings>): Promise<void> {
    return this.repository.saveAppSettings(settings);
  }

  async deleteSetting(key: string): Promise<void> {
    return this.repository.deleteSetting(key);
  }

  async clearAllSettings(): Promise<void> {
    return this.repository.clearAllSettings();
  }

  async getGitHubRepositories(): Promise<GitHubRepository[]> {
    return this.repository.getGitHubRepositories();
  }

  async addGitHubRepository(repository: Omit<GitHubRepository, 'addedAt'>): Promise<void> {
    return this.repository.addGitHubRepository(repository);
  }

  async removeGitHubRepository(repositoryId: string): Promise<void> {
    return this.repository.removeGitHubRepository(repositoryId);
  }

  async updateGitHubRepository(repositoryId: string, updates: Partial<GitHubRepository>): Promise<void> {
    return this.repository.updateGitHubRepository(repositoryId, updates);
  }
}