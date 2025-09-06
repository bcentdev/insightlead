import { TeamRepository } from '@/modules/teams/domain/team.repository';
import { PeerRepository } from '@/modules/peers/domain/peer.repository';
import { TeamData } from '@/modules/teams/domain/team.entity';

export type TeamSummary = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly department?: string;
  readonly jiraProjectKey?: string;
  readonly leadName: string;
  readonly leadAvatar?: string;
  readonly memberCount: number;
  readonly createdAt: Date;
};

export type GetTeamsResponse = {
  readonly success: boolean;
  readonly data?: readonly TeamSummary[];
  readonly error?: string;
};

export type GetTeamsDependencies = {
  readonly teamRepository: TeamRepository;
  readonly peerRepository: PeerRepository;
};

const createTeamSummary = (peerRepository: PeerRepository) => 
  async (team: TeamData): Promise<TeamSummary> => {
    const lead = team.leadId ? await peerRepository.findById(team.leadId) : null;
    
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      department: team.department,
      jiraProjectKey: team.jiraProjectKey,
      leadName: lead?.name || 'Unknown',
      leadAvatar: lead?.avatar,
      memberCount: team.memberIds.length,
      createdAt: team.createdAt
    };
  };

export const createGetTeamsUseCase = (dependencies: GetTeamsDependencies) =>
  async (): Promise<GetTeamsResponse> => {
    const { teamRepository, peerRepository } = dependencies;

    try {
      const teams = await teamRepository.findAll();
      
      const teamSummaries = await Promise.all(
        teams.map(createTeamSummary(peerRepository))
      );

      return {
        success: true,
        data: teamSummaries
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };