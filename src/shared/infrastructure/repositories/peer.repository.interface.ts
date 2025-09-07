import type { PeerData, CreatePeerProps } from '@/modules/peers/domain/peer.entity';

export interface IPeerRepository {
  // Read operations
  getAll(): Promise<PeerData[]>;
  getById(id: string): Promise<PeerData | null>;
  getByTeamId(teamId: string): Promise<PeerData[]>;
  getByEmail(email: string): Promise<PeerData | null>;
  getByGithubUsername(githubUsername: string): Promise<PeerData | null>;
  
  // Write operations
  create(peer: CreatePeerProps): Promise<PeerData>;
  update(id: string, updates: Partial<CreatePeerProps>): Promise<PeerData>;
  delete(id: string): Promise<void>;
  
  // Helper operations
  isTeamLead(peerId: string): Promise<boolean>;
  getTeamLeads(): Promise<PeerData[]>;
}