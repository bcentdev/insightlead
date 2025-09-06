import { useState, useEffect } from 'react';
import { createCreateTeamUseCase, CreateTeamDependencies } from '../../application/use-cases/teams/create-team.use-case';
import { createGetTeamsUseCase, GetTeamsDependencies, TeamSummary } from '../../application/use-cases/teams/get-teams.use-case';
import { createAssignTeamLeadUseCase, AssignTeamLeadDependencies } from '../../application/use-cases/teams/assign-team-lead.use-case';
import { updateTeamDetails } from '../../domain/entities/team.entity';
import { getPeerRepository, getTeamRepository } from '../../infrastructure/factories/repository.factory';
import { PeerRepository } from '../../domain/repositories/peer.repository';
import { TeamRepository } from '../../domain/repositories/team.repository';

export type CreateTeamFormData = {
  readonly id?: string;
  readonly name: string;
  readonly description: string;
  readonly leadId?: string;
  readonly memberIds: readonly string[];
  readonly department?: string;
  readonly jiraProjectKey?: string;
};

export const useTeams = () => {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<{
    teamRepository: TeamRepository;
    peerRepository: PeerRepository;
  } | null>(null);

  useEffect(() => {
    initializeRepositories();
  }, []);

  const initializeRepositories = async () => {
    try {
      const teamRepository = await getTeamRepository();
      const peerRepository = await getPeerRepository();
      
      setRepositories({ teamRepository, peerRepository });
      await loadTeams({ teamRepository, peerRepository });
    } catch (err) {
      setError('Failed to initialize repositories');
      setIsLoading(false);
    }
  };

  const loadTeams = async (repos?: {
    teamRepository: TeamRepository;
    peerRepository: PeerRepository;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentRepos = repos || repositories;
      if (!currentRepos) {
        throw new Error('Repositories not initialized');
      }

      const getTeamsDependencies: GetTeamsDependencies = { 
        teamRepository: currentRepos.teamRepository, 
        peerRepository: currentRepos.peerRepository 
      };
      const getTeamsUseCase = createGetTeamsUseCase(getTeamsDependencies);
      
      const response = await getTeamsUseCase();
      
      if (response.success && response.data) {
        setTeams([...response.data]);
      } else {
        setError(response.error || 'Failed to load teams');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createTeam = async (teamData: CreateTeamFormData) => {
    try {
      if (!repositories) {
        throw new Error('Repositories not initialized');
      }

      const createTeamDependencies: CreateTeamDependencies = { 
        teamRepository: repositories.teamRepository, 
        peerRepository: repositories.peerRepository 
      };
      const createTeamUseCase = createCreateTeamUseCase(createTeamDependencies);

      const response = await createTeamUseCase({
        name: teamData.name,
        description: teamData.description,
        leadId: teamData.leadId,
        memberIds: teamData.memberIds,
        department: teamData.department,
        jiraProjectKey: teamData.jiraProjectKey
      });

      if (response.success) {
        await loadTeams(); // Refresh teams list
      } else {
        throw new Error(response.error || 'Failed to create team');
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  };

  const assignTeamLead = async (teamId: string, leadId: string | null) => {
    try {
      if (!repositories) {
        throw new Error('Repositories not initialized');
      }

      const assignTeamLeadDependencies: AssignTeamLeadDependencies = { 
        teamRepository: repositories.teamRepository, 
        peerRepository: repositories.peerRepository 
      };
      const assignTeamLeadUseCase = createAssignTeamLeadUseCase(assignTeamLeadDependencies);

      const response = await assignTeamLeadUseCase({ teamId, leadId });

      if (response.success) {
        await loadTeams(); // Refresh teams list
      } else {
        throw new Error(response.error || 'Failed to assign team lead');
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  };

  const updateTeam = async (teamData: CreateTeamFormData) => {
    try {
      if (!repositories) {
        throw new Error('Repositories not initialized');
      }

      if (!teamData.id) {
        throw new Error('Team ID is required for update');
      }

      // Get the current team
      const currentTeam = await repositories.teamRepository.findById(teamData.id);
      if (!currentTeam) {
        throw new Error('Team not found');
      }

      // Update the team details
      const updatedTeam = updateTeamDetails(currentTeam, {
        name: teamData.name,
        description: teamData.description,
        department: teamData.department,
        jiraProjectKey: teamData.jiraProjectKey
      });

      // Save the updated team
      await repositories.teamRepository.save(updatedTeam);

      // Update team lead if changed
      if (currentTeam.leadId !== teamData.leadId) {
        const assignTeamLeadDependencies: AssignTeamLeadDependencies = { 
          teamRepository: repositories.teamRepository, 
          peerRepository: repositories.peerRepository 
        };
        const assignTeamLeadUseCase = createAssignTeamLeadUseCase(assignTeamLeadDependencies);

        const response = await assignTeamLeadUseCase({ 
          teamId: teamData.id, 
          leadId: teamData.leadId || null 
        });
        if (!response.success) {
          throw new Error(response.error || 'Failed to update team lead');
        }
      }

      await loadTeams(); // Refresh teams list
    } catch (err) {
      throw err instanceof Error ? err : new Error('An error occurred');
    }
  };

  return {
    teams,
    isLoading,
    error,
    createTeam,
    updateTeam,
    assignTeamLead,
    refreshTeams: loadTeams
  } as const;
};