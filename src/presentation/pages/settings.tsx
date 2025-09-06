import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Switch,
  Divider,
  Tab,
  Tabs,
  Chip,
  Link
} from '@heroui/react';
import { Github, AtSign, TestTube, Save, AlertCircle, CheckCircle, RefreshCw, Clock, ExternalLink, Trash2, Search, Plus, X, GitBranch } from 'lucide-react';
import { SettingsRepository, GitHubRepository } from '../../infrastructure/repositories/settings.repository';
import { githubService } from '../../infrastructure/services/github.service';
import { jiraService } from '../../infrastructure/services/jira.service';
import { clearAllData } from '../../infrastructure/factories/repository.factory';

export default function SettingsPage() {
  const [githubToken, setGithubToken] = useState('');
  const [jiraUrl, setJiraUrl] = useState('');
  const [jiraUsername, setJiraUsername] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [jiraCloudId, setJiraCloudId] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState('60');
  const [isSaving, setIsSaving] = useState(false);
  const [testingGithub, setTestingGithub] = useState(false);
  const [testingJira, setTestingJira] = useState(false);
  const [githubTestResult, setGithubTestResult] = useState<boolean | null>(null);
  const [jiraTestResult, setJiraTestResult] = useState<boolean | null>(null);
  const [testErrors, setTestErrors] = useState<{ github?: string; jira?: string }>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  
  // Repository management state
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddRepo, setShowAddRepo] = useState(false);

  const settingsRepo = new SettingsRepository();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await settingsRepo.getAppSettings();
      const repos = await settingsRepo.getGitHubRepositories();
      // TODO: Implement sync service integration
      const lastSync = null;
      
      setGithubToken(settings.githubToken || '');
      setJiraUrl(settings.jiraUrl || '');
      setJiraUsername(settings.jiraUsername || '');
      setJiraToken(settings.jiraToken || '');
      setJiraCloudId(settings.jiraCloudId || '');
      setAutoSync(settings.autoSync);
      setSyncInterval(settings.syncInterval.toString());
      setRepositories(repos);
      setLastSyncTime(lastSync);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await settingsRepo.saveAppSettings({
        githubToken,
        jiraUrl,
        jiraUsername,
        jiraToken,
        autoSync,
        syncInterval: parseInt(syncInterval, 10)
      });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const testGithubConnection = async () => {
    if (!githubToken.trim()) {
      setTestErrors(prev => ({ ...prev, github: 'Please enter a GitHub token before testing' }));
      setGithubTestResult(false);
      return;
    }

    setTestingGithub(true);
    setGithubTestResult(null);
    setTestErrors(prev => ({ ...prev, github: undefined }));

    try {
      // Update the service with the current token
      githubService.setToken(githubToken.trim());
      
      // Test the connection
      const isConnected = await githubService.testConnection();
      
      if (isConnected) {
        console.log('✅ GitHub connection successful');
        setGithubTestResult(true);
        setTestErrors(prev => ({ ...prev, github: undefined }));
      } else {
        console.error('❌ GitHub connection failed');
        setGithubTestResult(false);
        setTestErrors(prev => ({ ...prev, github: 'Connection failed. Please check your token.' }));
      }
    } catch (error) {
      console.error('❌ GitHub test error:', error);
      setGithubTestResult(false);
      
      let errorMessage = 'Connection failed. ';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage += 'Invalid token (401 Unauthorized).';
        } else if (error.message.includes('403')) {
          errorMessage += 'Token lacks required permissions (403 Forbidden).';
        } else if (error.message.includes('rate limit')) {
          errorMessage += 'Rate limit exceeded. Try again later.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      setTestErrors(prev => ({ ...prev, github: errorMessage }));
    } finally {
      setTestingGithub(false);
    }
  };

  const testJiraConnection = async () => {
    if (!jiraUrl.trim() || !jiraUsername.trim() || !jiraToken.trim()) {
      setTestErrors(prev => ({ ...prev, jira: 'Please fill in all Jira fields before testing' }));
      setJiraTestResult(false);
      return;
    }

    setTestingJira(true);
    setJiraTestResult(null);
    setTestErrors(prev => ({ ...prev, jira: undefined }));

    try {
      // Configure the Jira service with current form values
      jiraService.setConfiguration({
        baseUrl: jiraUrl.trim(),
        email: jiraUsername.trim(),
        apiToken: jiraToken.trim()
      });

      // Test the connection
      const isConnected = await jiraService.testConnection();
      
      if (isConnected) {
        console.log('✅ Jira connection successful');
        setJiraTestResult(true);
        setTestErrors(prev => ({ ...prev, jira: undefined }));
        
        // Reload settings to get the updated cloud ID
        await loadSettings();
      } else {
        console.error('❌ Jira connection failed');
        setJiraTestResult(false);
        setTestErrors(prev => ({ ...prev, jira: 'Connection failed. Please check your credentials and URL.' }));
      }
    } catch (error) {
      console.error('❌ Jira test error:', error);
      setJiraTestResult(false);
      
      let errorMessage = 'Connection failed. ';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage += 'Invalid credentials (401 Unauthorized).';
        } else if (error.message.includes('403')) {
          errorMessage += 'Access forbidden (403). Check your permissions.';
        } else if (error.message.includes('404')) {
          errorMessage += 'Jira instance not found (404). Check the URL.';
        } else if (error.message.includes('CORS')) {
          errorMessage += 'CORS error. Make sure the proxy is configured correctly.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      setTestErrors(prev => ({ ...prev, jira: errorMessage }));
    } finally {
      setTestingJira(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      // TODO: Implement sync functionality
      const result = { success: true, peerssynced: 0, metricsCollected: 0, errors: [] };
      if (result.success) {
        console.log(`Sync completed: ${result.peerssynced} peers, ${result.metricsCollected} metrics`);
        // TODO: Set last sync time
        setLastSyncTime(new Date());
      } else {
        console.error('Sync failed:', result.errors);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }
    
    setIsClearing(true);
    try {
      await clearAllData();
      console.log('All data has been cleared successfully');
      
      // Refresh the page to show the cleared state
      window.location.reload();
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Repository management functions
  const searchRepositories = async () => {
    if (!searchQuery.trim() || !githubToken) return;
    
    setIsSearching(true);
    try {
      githubService.setToken(githubToken);
      const results = await githubService.searchRepositories(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching repositories:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addRepository = async (repo: any) => {
    try {
      const newRepo: Omit<GitHubRepository, 'addedAt'> = {
        id: repo.id.toString(),
        name: repo.name,
        owner: repo.owner.login,
        fullName: repo.full_name,
        url: repo.html_url,
        description: repo.description || '',
        isPrivate: repo.private
      };

      await settingsRepo.addGitHubRepository(newRepo);
      await loadSettings(); // Reload to update the list
      setSearchQuery('');
      setSearchResults([]);
      setShowAddRepo(false);
    } catch (error) {
      console.error('Error adding repository:', error);
      alert('Error adding repository: ' + (error as Error).message);
    }
  };

  const removeRepository = async (repoId: string) => {
    if (!window.confirm('Are you sure you want to remove this repository?')) {
      return;
    }

    try {
      await settingsRepo.removeGitHubRepository(repoId);
      await loadSettings(); // Reload to update the list
    } catch (error) {
      console.error('Error removing repository:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Configure your integrations and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <Chip color="success" variant="flat" startContent={<CheckCircle className="w-4 h-4" />}>
              Saved!
            </Chip>
          )}
          <Button
            color="primary"
            startContent={<Save className="w-4 h-4" />}
            isLoading={isSaving}
            onPress={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs aria-label="Settings sections" color="primary" variant="underlined">
        <Tab key="integrations" title="Integrations">
          <div className="space-y-6">
            {/* GitHub Integration */}
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-black rounded-lg">
                  <Github className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">GitHub Integration</p>
                  <p className="text-small text-gray-500">
                    Connect to GitHub to track pull requests, commits, and reviews
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <div style={{ marginBottom: '1rem' }}>
                  <Card style={{ border: 'none', backgroundColor: 'rgb(239 246 255)' }}>
                    <CardBody style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div style={{
                          width: '2rem',
                          height: '2rem',
                          backgroundColor: 'rgb(219 234 254)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Github style={{ width: '1rem', height: '1rem', color: 'rgb(37 99 235)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h4 style={{ fontWeight: 500, color: 'rgb(30 58 138)' }}>How to get your GitHub token:</h4>
                          <ol style={{ fontSize: '0.875rem', color: 'rgb(30 64 175)', margin: 0, paddingLeft: '1rem' }}>
                            <li style={{ marginBottom: '0.25rem' }}>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                            <li style={{ marginBottom: '0.25rem' }}>Click "Generate new token (classic)"</li>
                            <li style={{ marginBottom: '0.25rem' }}>
                              Select the following scopes:{' '}
                              <code style={{ backgroundColor: 'rgb(196 181 253)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>repo</code>
                              {', '}
                              <code style={{ backgroundColor: 'rgb(196 181 253)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>user</code>
                            </li>
                            <li>Copy the generated token and paste it below</li>
                          </ol>
                          <Link
                            href="https://github.com/settings/tokens"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '0.875rem', color: 'rgb(37 99 235)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            Open GitHub Token Settings
                            <ExternalLink style={{ width: '0.75rem', height: '0.75rem' }} />
                          </Link>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Input
                    type="password"
                    label="GitHub Personal Access Token"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubToken}
                    onValueChange={(value) => {
                      setGithubToken(value);
                      setGithubTestResult(null);
                      setTestErrors(prev => ({ ...prev, github: undefined }));
                    }}
                    description="Required scopes: repo, user:email"
                    classNames={{
                      input: "font-mono text-sm",
                    }}
                  />
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="flat"
                        startContent={<TestTube className="w-4 h-4" />}
                        isLoading={testingGithub}
                        onPress={testGithubConnection}
                      >
                        Test Connection
                      </Button>
                      
                      {githubTestResult === true && (
                        <Chip color="success" variant="flat" startContent={<CheckCircle className="w-3 h-3" />}>
                          Connection Successful
                        </Chip>
                      )}
                      
                      {githubTestResult === false && (
                        <Chip color="danger" variant="flat" startContent={<AlertCircle className="w-3 h-3" />}>
                          Connection Failed
                        </Chip>
                      )}
                    </div>
                    
                    {testErrors.github && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        {testErrors.github}
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Jira Integration */}
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                  <AtSign className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">Jira Integration</p>
                  <p className="text-small text-gray-500">
                    Connect to Jira to track issues, stories, and time metrics
                  </p>
                </div>
              </CardHeader>
              <CardBody>
                <div style={{ marginBottom: '1rem' }}>
                  <Card style={{ border: 'none', backgroundColor: 'rgb(239 246 255)' }}>
                    <CardBody style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div style={{
                          width: '2rem',
                          height: '2rem',
                          backgroundColor: 'rgb(219 234 254)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <AtSign style={{ width: '1rem', height: '1rem', color: 'rgb(37 99 235)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h4 style={{ fontWeight: 500, color: 'rgb(30 58 138)' }}>How to get your Jira API token:</h4>
                          <ol style={{ fontSize: '0.875rem', color: 'rgb(30 64 175)', margin: 0, paddingLeft: '1rem' }}>
                            <li style={{ marginBottom: '0.25rem' }}>Go to Atlassian Account Settings → Security → API tokens</li>
                            <li style={{ marginBottom: '0.25rem' }}>Click "Create API token"</li>
                            <li style={{ marginBottom: '0.25rem' }}>Give your token a descriptive name like "InsightLead Integration"</li>
                            <li style={{ marginBottom: '0.25rem' }}>Copy the generated token immediately (you won't see it again)</li>
                            <li style={{ marginBottom: '0.25rem' }}>Use your Atlassian account email as the username</li>
                            <li>Your Base URL should be: <code style={{ backgroundColor: 'rgb(196 181 253)', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>https://yourcompany.atlassian.net</code></li>
                          </ol>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                            <Link
                              href="https://id.atlassian.com/manage-profile/security/api-tokens"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '0.875rem', color: 'rgb(37 99 235)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              Create Jira API Token
                              <ExternalLink style={{ width: '0.75rem', height: '0.75rem' }} />
                            </Link>
                            <div style={{ 
                              fontSize: '0.75rem', 
                              color: 'rgb(107 114 128)', 
                              backgroundColor: 'rgb(249 250 251)', 
                              padding: '0.5rem', 
                              borderRadius: '0.375rem',
                              border: '1px solid rgb(229 231 235)',
                              marginTop: '0.5rem'
                            }}>
                              <strong>Required Permissions:</strong> Your Jira user needs "Browse Projects" permission for the projects you want to track.
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Jira Base URL"
                    placeholder="https://yourcompany.atlassian.net"
                    value={jiraUrl}
                    onValueChange={(value) => {
                      setJiraUrl(value);
                      setJiraTestResult(null);
                      setTestErrors(prev => ({ ...prev, jira: undefined }));
                    }}
                    description="Your Jira instance URL (found in your browser when accessing Jira)"
                  />
                  <Input
                    label="Username/Email"
                    placeholder="your.email@company.com"
                    value={jiraUsername}
                    onValueChange={(value) => {
                      setJiraUsername(value);
                      setJiraTestResult(null);
                      setTestErrors(prev => ({ ...prev, jira: undefined }));
                    }}
                    description="Your Atlassian account email address"
                  />
                  <Input
                    type="password"
                    label="API Token"
                    placeholder="ATATT3xFfGF0..."
                    value={jiraToken}
                    onValueChange={(value) => {
                      setJiraToken(value);
                      setJiraTestResult(null);
                      setTestErrors(prev => ({ ...prev, jira: undefined }));
                    }}
                    description="The API token you created above"
                    classNames={{
                      input: "font-mono text-sm",
                    }}
                  />
                  
                  {/* Cloud ID Display */}
                  {jiraCloudId && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">GraphQL API Ready</p>
                        <p className="text-xs text-green-700">
                          Cloud ID: <code className="bg-green-100 px-1 py-0.5 rounded font-mono text-xs">{jiraCloudId}</code>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center">
                      <Button
                        variant="flat"
                        startContent={<TestTube className="w-4 h-4" />}
                        isLoading={testingJira}
                        onPress={testJiraConnection}
                      >
                        Test Connection
                      </Button>
                      
                      {jiraTestResult === true && (
                        <Chip color="success" variant="flat" startContent={<CheckCircle className="w-3 h-3" />}>
                          Connection Successful
                        </Chip>
                      )}
                      
                      {jiraTestResult === false && (
                        <Chip color="danger" variant="flat" startContent={<AlertCircle className="w-3 h-3" />}>
                          Connection Failed
                        </Chip>
                      )}
                    </div>
                    
                    {testErrors.jira && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                        {testErrors.jira}
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="sync" title="Sync Settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <p className="text-lg font-semibold">Data Synchronization</p>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-sync data</p>
                    <p className="text-small text-gray-500">
                      Automatically fetch new data from integrations
                    </p>
                  </div>
                  <Switch
                    isSelected={autoSync}
                    onValueChange={setAutoSync}
                    color="primary"
                  />
                </div>
                
                {autoSync && (
                  <>
                    <Divider />
                    <Input
                      type="number"
                      label="Sync Interval (minutes)"
                      value={syncInterval}
                      onValueChange={setSyncInterval}
                      min="5"
                      max="1440"
                      description="How often to check for new data (5-1440 minutes)"
                    />
                  </>
                )}

                <Divider />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Manual Sync</p>
                      <p className="text-small text-gray-500">
                        Manually fetch latest data from GitHub and Jira
                      </p>
                    </div>
                    <Button
                      color="secondary"
                      variant="flat"
                      startContent={<RefreshCw className="w-4 h-4" />}
                      onPress={handleSyncData}
                      isLoading={isSyncing}
                    >
                      Sync Now
                    </Button>
                  </div>

                  {lastSyncTime && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Last sync: {lastSyncTime.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <p className="text-lg font-semibold">Data Management</p>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Clear All Data</p>
                    <p className="text-small text-gray-500">
                      Remove all peers, teams, objectives, and settings data
                    </p>
                  </div>
                  <Button
                    color="danger"
                    variant="flat"
                    startContent={<Trash2 className="w-4 h-4" />}
                    onPress={handleClearAllData}
                    isLoading={isClearing}
                  >
                    Clear Data
                  </Button>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Warning</p>
                    <p className="text-small text-red-700">
                      This action will permanently delete all your data including peers, teams, objectives, and settings. 
                      This cannot be undone. {import.meta.env.VITE_USE_MOCK_DATA === 'true' ? 'Currently using mock data.' : 'Currently using persistent storage.'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="repositories" title="Repositories">
          <div className="space-y-6">
            {/* Current Repositories */}
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-lg">
                  <GitBranch className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-semibold">GitHub Repositories</p>
                  <p className="text-small text-gray-500">
                    Manage which repositories to track for metrics and analytics
                  </p>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Tracked Repositories ({repositories.length})</h4>
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={() => setShowAddRepo(!showAddRepo)}
                    isDisabled={!githubToken}
                  >
                    Add Repository
                  </Button>
                </div>

                {!githubToken && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">GitHub Token Required</p>
                      <p className="text-small text-yellow-700">
                        Please configure your GitHub token in the Integrations tab to manage repositories.
                      </p>
                    </div>
                  </div>
                )}

                {/* Repository List */}
                {repositories.length > 0 ? (
                  <div className="space-y-3">
                    {repositories.map((repo) => (
                      <div
                        key={repo.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Github className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium">{repo.fullName}</h5>
                              {repo.isPrivate && (
                                <Chip size="sm" color="warning" variant="flat">
                                  Private
                                </Chip>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-small text-gray-600 mt-1">{repo.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Added {new Date(repo.addedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            as={Link}
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="sm"
                            variant="flat"
                            startContent={<ExternalLink className="w-3 h-3" />}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="flat"
                            startContent={<X className="w-3 h-3" />}
                            onPress={() => removeRepository(repo.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No repositories added yet</p>
                    <p className="text-small">Add repositories to start tracking metrics</p>
                  </div>
                )}

                {/* Add Repository Section */}
                {showAddRepo && githubToken && (
                  <Card className="border border-blue-200 bg-blue-50">
                    <CardBody className="space-y-4">
                      <h4 className="font-medium text-blue-800">Search & Add Repository</h4>
                      
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search repositories (e.g., facebook/react, my-org)"
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                          onKeyPress={(e) => e.key === 'Enter' && searchRepositories()}
                          startContent={<Search className="w-4 h-4 text-gray-400" />}
                        />
                        <Button
                          color="primary"
                          variant="flat"
                          onPress={searchRepositories}
                          isLoading={isSearching}
                          isDisabled={!searchQuery.trim()}
                        >
                          Search
                        </Button>
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          <p className="text-small font-medium text-gray-700">Search Results:</p>
                          {searchResults.map((repo) => (
                            <div
                              key={repo.id}
                              className="flex items-center justify-between p-3 bg-white rounded border"
                            >
                              <div className="flex items-center gap-3">
                                <Github className="w-4 h-4 text-gray-600" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{repo.full_name}</span>
                                    {repo.private && (
                                      <Chip size="sm" color="warning" variant="flat">
                                        Private
                                      </Chip>
                                    )}
                                  </div>
                                  {repo.description && (
                                    <p className="text-xs text-gray-600">{repo.description}</p>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                onPress={() => addRepository(repo)}
                                isDisabled={repositories.some(r => r.fullName === repo.full_name)}
                              >
                                {repositories.some(r => r.fullName === repo.full_name) ? 'Added' : 'Add'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="notifications" title="Notifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <p className="text-lg font-semibold">Notification Preferences</p>
              </CardHeader>
              <CardBody>
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Coming Soon</p>
                    <p className="text-small text-blue-700">
                      Configure email notifications, Slack integrations, and alert preferences.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}