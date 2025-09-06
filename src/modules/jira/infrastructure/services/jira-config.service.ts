import { jiraService } from './jira.service';
import { SettingsRepository } from '../repositories/settings.repository';
import { createJiraGraphQLClient } from '../adapters/jira/jira-graphql-client';

type JiraConfigSettings = {
  readonly baseUrl: string;
  readonly email: string;
  readonly apiToken: string;
  readonly cloudId?: string;
  readonly useGraphQL?: boolean;
};

// Global Jira configuration service
let configurationLoaded = false;

// Function to detect cloud ID from base URL
const extractCloudIdFromUrl = (baseUrl: string): string | null => {
  // Try to extract subdomain from Atlassian URL (e.g., https://holded.atlassian.net -> holded)
  const match = baseUrl.match(/https:\/\/([^.]+)\.atlassian\.net/);
  const cloudId = match ? match[1] : null;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Extracting cloud ID from URL:', {
      baseUrl,
      extractedCloudId: cloudId
    });
  }
  
  return cloudId;
};

// Function to get real cloud ID from Atlassian GraphQL API
const getCloudIdFromAtlassian = async (email: string, apiToken: string, baseUrl: string): Promise<string | null> => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Attempting to get cloud ID from Atlassian GraphQL API for:', email);
    }
    
    // Use the GraphQL client to discover cloud ID
    const tempClient = createJiraGraphQLClient({
      baseUrl,
      email,
      apiToken
    });
    
    const cloudId = await tempClient.discoverCloudId();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Retrieved cloud ID from GraphQL API:', cloudId);
    }
    
    return cloudId;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🔍 Failed to get cloud ID from GraphQL API:', error);
    }
    return null;
  }
};

export const initializeJiraConfig = async (): Promise<void> => {
  if (configurationLoaded) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Jira configuration already loaded, skipping initialization');
    }
    return;
  }
  
  try {
    const settingsRepo = new SettingsRepository();
    const settings = await settingsRepo.getAppSettings();
    
    // Configure the Jira service with saved settings
    if (settings.jiraUrl && settings.jiraUsername && settings.jiraToken) {
      // Try to get real cloud ID from Atlassian API
      let cloudId: string | null = null;
      
      try {
        cloudId = await getCloudIdFromAtlassian(settings.jiraUsername, settings.jiraToken, settings.jiraUrl);
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Got cloud ID from Atlassian API:', cloudId);
        }
        
        // Save cloud ID to settings if discovered
        if (cloudId && cloudId !== settings.jiraCloudId) {
          await settingsRepo.setSetting('jiraCloudId', cloudId);
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Saved cloud ID to settings:', cloudId);
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Failed to get cloud ID from API:', error);
        }
      }
      
      // If no cloud ID discovered, GraphQL will auto-discover it
      // but we should still try to get it initially if possible
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Cloud ID status:', {
          hasCloudId: !!cloudId,
          cloudId: cloudId,
          willUseGraphQL: true
        });
      }
      
      const config: JiraConfigSettings = {
        baseUrl: settings.jiraUrl,
        email: settings.jiraUsername,
        apiToken: settings.jiraToken,
        cloudId: cloudId || undefined,
        useGraphQL: true
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Initializing Jira with config:', {
          baseUrl: config.baseUrl,
          email: config.email,
          hasToken: !!config.apiToken,
          cloudId: config.cloudId,
          useGraphQL: config.useGraphQL,
          finalCloudId: cloudId
        });
      }

      jiraService.setConfiguration(config);
      
      // Test connection
      const isConnected = await jiraService.testConnection();
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Jira connection test:', isConnected ? 'SUCCESS' : 'FAILED');
      }
      
      // If connection successful and we don't have cloudId, try to get the discovered one
      if (isConnected && !cloudId) {
        try {
          const discoveredCloudId = await jiraService.getDiscoveredCloudId();
          if (discoveredCloudId && discoveredCloudId !== settings.jiraCloudId) {
            await settingsRepo.setSetting('jiraCloudId', discoveredCloudId);
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 Saved discovered cloud ID to settings:', discoveredCloudId);
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Failed to save discovered cloud ID:', error);
          }
        }
      }
    }
    
    configurationLoaded = true;
  } catch (error) {
    console.error('Failed to initialize Jira configuration:', error);
  }
};

// Function to enable GraphQL API
export const enableJiraGraphQL = async (): Promise<boolean> => {
  try {
    const settingsRepo = new SettingsRepository();
    const settings = await settingsRepo.getAppSettings();
    
    if (!settings.jiraUrl || !settings.jiraUsername || !settings.jiraToken) {
      throw new Error('Jira basic configuration missing');
    }

    const cloudId = await getCloudIdFromAtlassian(settings.jiraUsername, settings.jiraToken, settings.jiraUrl);
    if (!cloudId) {
      throw new Error('Could not retrieve cloud ID from Atlassian API');
    }

    const config: JiraConfigSettings = {
      baseUrl: settings.jiraUrl,
      email: settings.jiraUsername,
      apiToken: settings.jiraToken,
      cloudId: cloudId,
      useGraphQL: true
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Enabling Jira GraphQL API with cloud ID:', cloudId);
    }

    jiraService.setConfiguration(config);
    
    // Test GraphQL connection
    const isConnected = await jiraService.testConnection();
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Jira GraphQL connection test:', isConnected ? 'SUCCESS' : 'FAILED');
    }
    
    return isConnected;
  } catch (error) {
    console.error('Failed to enable Jira GraphQL:', error);
    return false;
  }
};

// Function to disable GraphQL is no longer supported - GraphQL is required
export const disableJiraGraphQL = async (): Promise<void> => {
  throw new Error('GraphQL cannot be disabled - it is required for Jira integration');
};

export const resetJiraConfig = (): void => {
  configurationLoaded = false;
};

export const isJiraConfigLoaded = (): boolean => configurationLoaded;

// Function to get current configuration status
export const getJiraConfigStatus = () => ({
  isConfigured: jiraService.isConfigured(),
  configurationLoaded
});

export type { JiraConfigSettings };