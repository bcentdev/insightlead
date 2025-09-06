import { TeamRepository } from '../../../domain/repositories/team.repository';
import { PeerRepository } from '../../../domain/repositories/peer.repository';
import { changeTeamLead, TeamData } from '../../../domain/entities/team.entity';

export type AssignTeamLeadRequest = {
  readonly teamId: string;
  readonly leadId: string | null;
};

export type AssignTeamLeadResponse = {
  readonly success: boolean;
  readonly data?: TeamData;
  readonly error?: string;
};

export type AssignTeamLeadDependencies = {
  readonly teamRepository: TeamRepository;
  readonly peerRepository: PeerRepository;
};

export const createAssignTeamLeadUseCase = (dependencies: AssignTeamLeadDependencies) =>
  async (request: AssignTeamLeadRequest): Promise<AssignTeamLeadResponse> => {
    const { teamRepository, peerRepository } = dependencies;

    try {
      // Find the team
      const team = await teamRepository.findById(request.teamId);
      if (!team) {
        return {
          success: false,
          error: 'Team not found'
        };
      }

      // If leadId is provided, validate that the peer exists and is a team member
      if (request.leadId) {
        const peer = await peerRepository.findById(request.leadId);
        if (!peer) {
          return {
            success: false,
            error: 'Peer not found'
          };
        }

        if (!team.memberIds.includes(request.leadId)) {
          return {
            success: false,
            error: 'Peer must be a team member to become team lead'
          };
        }
      }

      // Change team lead
      const updatedTeam = changeTeamLead(team, request.leadId);

      // Save updated team
      await teamRepository.update(updatedTeam);

      return {
        success: true,
        data: updatedTeam
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };