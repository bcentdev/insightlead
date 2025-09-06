import { createPeer, PeerRole, Seniority } from '../../../domain/entities/peer.entity';
import { createGitHubUsername } from '../../../domain/value-objects/github-username.vo';
import { addTeamMember } from '../../../domain/entities/team.entity';
import { PeerRepository } from '../../../domain/repositories/peer.repository';
import { TeamRepository } from '../../../domain/repositories/team.repository';

export type AddPeerRequest = {
  readonly name: string;
  readonly email: string;
  readonly githubUsername: string;
  readonly jiraUsername?: string;
  readonly teamId: string;
  readonly role: PeerRole;
  readonly seniority: Seniority;
  readonly avatar?: string;
};

export type AddPeerResponse = {
  readonly success: boolean;
  readonly peerId?: string;
  readonly error?: string;
};

export type AddPeerDependencies = {
  readonly peerRepository: PeerRepository;
  readonly teamRepository: TeamRepository;
};

export const createAddPeerUseCase = (dependencies: AddPeerDependencies) => 
  async (request: AddPeerRequest): Promise<AddPeerResponse> => {
    const { peerRepository, teamRepository } = dependencies;
    
    try {
      const team = await teamRepository.findById(request.teamId);
      if (!team) {
        return {
          success: false,
          error: 'Team not found'
        };
      }

      const existingPeer = await peerRepository.findByGitHubUsername(request.githubUsername);
      if (existingPeer) {
        return {
          success: false,
          error: 'GitHub username already exists'
        };
      }

      const githubUsername = createGitHubUsername(request.githubUsername);

      const peer = createPeer({
        name: request.name,
        email: request.email,
        githubUsername,
        jiraUsername: request.jiraUsername,
        teamId: request.teamId,
        role: request.role,
        seniority: request.seniority,
        avatar: request.avatar
      });

      await peerRepository.save(peer);

      const updatedTeam = addTeamMember(team, peer.id);
      await teamRepository.update(updatedTeam);

      return {
        success: true,
        peerId: peer.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

// Export type alias for compatibility
export type AddPeerUseCase = ReturnType<typeof createAddPeerUseCase>;