import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePeers } from './use-peers';
import { useObjectives } from './use-objectives';
import { useTeams } from './use-teams';
import { SettingsRepository } from '../../infrastructure/repositories/settings.repository';
import { initializeJiraConfig } from '../../infrastructure/services/jira-config.service';

type ConfigStatus = {
  hasToken: boolean;
  hasRepositories: boolean;
  repositoryCount: number;
  loading: boolean;
};

type DashboardData = {
  currentTeam: any;
  teamData: {
    teamName: string;
    teamLead: any;
    members: any[];
    averageCompletionRate: number;
    totalMembers: number;
  };
  allTeamMembers: string[];
  allJiraAssignees: string[];
  teamJiraProject: string | undefined;
  configStatus: ConfigStatus;
  repositories: string[];
  isLoading: boolean;
};

let configInitialized = false;

export const useDashboardData = (): DashboardData => {
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    hasToken: false,
    hasRepositories: false,
    repositoryCount: 0,
    loading: true
  });
  
  const [repositories, setRepositories] = useState<string[]>([]);

  // Initialize Jira config once globally with more aggressive caching
  useEffect(() => {
    let mounted = true;
    
    const initializeConfig = async () => {
      if (!configInitialized) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Dashboard: Initializing Jira config for the first time');
        }
        await initializeJiraConfig();
        configInitialized = true;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Dashboard: Jira config initialization complete');
        }
      } else if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Dashboard: Jira config already initialized, skipping');
      }
    };
    
    if (mounted) {
      initializeConfig();
    }
    
    return () => {
      mounted = false;
    };
  }, []);

  // Load configuration status once
  useEffect(() => {
    const loadConfigStatus = async () => {
      try {
        const settingsRepo = new SettingsRepository();
        const [settings, repositories] = await Promise.all([
          settingsRepo.getAppSettings(),
          settingsRepo.getGitHubRepositories()
        ]);
        
        setConfigStatus({
          hasToken: !!settings.githubToken,
          hasRepositories: repositories.length > 0,
          repositoryCount: repositories.length,
          loading: false
        });
        
        // Extract repository names for the filters
        const repoNames = repositories.map(repo => repo.fullName);
        setRepositories(repoNames);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Dashboard: Loaded repositories:', repoNames);
        }
      } catch (error) {
        console.error('Error checking configuration status:', error);
        setConfigStatus(prev => ({ ...prev, loading: false }));
      }
    };

    loadConfigStatus();
  }, []);

  // Use hooks with dependencies to avoid unnecessary re-renders
  const { peers, isLoading: peersLoading } = usePeers();
  const { isLoading: objectivesLoading } = useObjectives();
  const { teams, isLoading: teamsLoading } = useTeams();

  // Memoize computed values to avoid recalculation on every render
  const currentTeam = useMemo(() => teams[0], [teams]);

  const teamPeers = useMemo(() => {
    return currentTeam 
      ? peers.filter(peer => peer.teamName === currentTeam.name)
      : peers;
  }, [currentTeam, peers]);

  const teamLead = useMemo(() => {
    return currentTeam && currentTeam.leadName !== 'Unknown'
      ? teamPeers.find(peer => peer.name === currentTeam.leadName)
      : teamPeers.find(peer => peer.role.toLowerCase().includes('lead'));
  }, [currentTeam, teamPeers]);

  const teamData = useMemo(() => ({
    teamName: currentTeam?.name || 'Engineering Team Alpha',
    teamLead: teamLead || teamPeers[0] || {
      id: 'no-team-lead',
      name: 'No Team Lead',
      role: 'Team Lead',
      seniority: 'Senior',
      avatar: '',
      objectivesCompleted: 0,
      objectivesTotal: 0,
      completionRate: 0,
      jiraUsername: undefined
    },
    members: teamPeers.filter(peer => peer.id !== teamLead?.id),
    averageCompletionRate: teamPeers.length > 0 
      ? Math.round(teamPeers.reduce((sum, peer) => sum + peer.completionRate, 0) / teamPeers.length)
      : 0,
    totalMembers: teamPeers.length
  }), [currentTeam, teamLead, teamPeers]);

  // Memoize GitHub usernames
  const allTeamMembers = useMemo(() => {
    return [...teamData.members, teamData.teamLead]
      .filter(member => member && member.githubUsername)
      .map(member => member.githubUsername)
      .filter(Boolean);
  }, [teamData.members, teamData.teamLead]);

  // Memoize Jira assignees
  const allJiraAssignees = useMemo(() => {
    return [...teamData.members, teamData.teamLead]
      .filter(member => member && member.jiraUsername)
      .map(member => member.jiraUsername)
      .filter(Boolean);
  }, [teamData.members, teamData.teamLead]);

  const teamJiraProject = useMemo(() => currentTeam?.jiraProjectKey, [currentTeam]);

  const isLoading = peersLoading || objectivesLoading || teamsLoading;

  // Debug logging (only when data changes, not on every render)
  useEffect(() => {
    if (!isLoading && currentTeam && process.env.NODE_ENV === 'development') {
      console.log('🐛 Dashboard Debug (optimized):');
      console.log('- Current team:', currentTeam?.name);
      console.log('- Team project key:', teamJiraProject);
      console.log('- Team peers count:', teamPeers.length);
      console.log('- Team lead:', teamLead?.name);
      console.log('- Team members count:', teamData.members.length);
      console.log('- Jira assignees:', allJiraAssignees);
      console.log('- All peers with Jira usernames:', peers.filter(p => p.jiraUsername).map(p => ({ name: p.name, jiraUsername: p.jiraUsername })));
    }
  }, [currentTeam, teamJiraProject, teamPeers.length, teamLead?.name, teamData.members.length, allJiraAssignees, peers, isLoading]);

  return {
    currentTeam,
    teamData,
    allTeamMembers,
    allJiraAssignees,
    teamJiraProject,
    configStatus,
    repositories,
    isLoading
  };
};