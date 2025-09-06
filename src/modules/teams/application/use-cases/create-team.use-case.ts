import { TeamRepository } from '../../../domain/repositories/team.repository';
import { PeerRepository } from '../../../domain/repositories/peer.repository';
import { createTeam, TeamData } from '../../../domain/entities/team.entity';

export type CreateTeamRequest = {
  readonly name: string;
  readonly description: string;
  readonly leadId?: string;
  readonly memberIds?: readonly string[];
  readonly department?: string;
  readonly jiraProjectKey?: string;
};

export type CreateTeamResponse = {
  readonly success: boolean;
  readonly data?: TeamData;
  readonly error?: string;
};

export type CreateTeamDependencies = {
  readonly teamRepository: TeamRepository;
  readonly peerRepository: PeerRepository;
};

export const createCreateTeamUseCase = (dependencies: CreateTeamDependencies) =>
  async (request: CreateTeamRequest): Promise<CreateTeamResponse> => {
    const { teamRepository, peerRepository } = dependencies;

    try {
      // Validate that lead exists (if provided)
      if (request.leadId) {
        const lead = await peerRepository.findById(request.leadId);
        if (!lead) {
          return {
            success: false,
            error: 'Team lead not found'
          };
        }
      }

      // Validate that all members exist (if provided)
      if (request.memberIds && request.memberIds.length > 0) {
        const members = await peerRepository.findByIds([...request.memberIds]);
        if (members.length !== request.memberIds.length) {
          return {
            success: false,
            error: 'One or more team members not found'
          };
        }
      }

      // Check if team name already exists
      const existingTeam = await teamRepository.findByName(request.name);
      if (existingTeam) {
        return {
          success: false,
          error: 'Team name already exists'
        };
      }

      // Create team
      const teamData = createTeam({
        name: request.name,
        description: request.description,
        leadId: request.leadId,
        memberIds: request.memberIds ? [...request.memberIds] : [],
        department: request.department,
        jiraProjectKey: request.jiraProjectKey
      });

      // Save team
      const savedTeam = await teamRepository.save(teamData);

      return {
        success: true,
        data: savedTeam
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };