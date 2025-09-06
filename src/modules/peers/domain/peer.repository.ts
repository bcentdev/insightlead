import { PeerData } from './peer.entity';

export interface PeerRepository {
  save(peer: PeerData): Promise<void>;
  findById(id: string): Promise<PeerData | null>;
  findByGitHubUsername(username: string): Promise<PeerData | null>;
  findByTeamId(teamId: string): Promise<PeerData[]>;
  findAll(): Promise<PeerData[]>;
  update(peer: PeerData): Promise<void>;
  delete(id: string): Promise<void>;
  findByIds(ids: string[]): Promise<PeerData[]>;
}