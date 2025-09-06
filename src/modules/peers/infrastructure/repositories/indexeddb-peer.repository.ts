import { PeerData } from '@/modules/peers/domain/peer.entity';
import { PeerRepository } from '@/modules/peers/domain/peer.repository';
import { gitHubUsernameToString, createGitHubUsername } from '@/shared/domain/value-objects/github-username.vo';
import { createDatabase } from '@/shared/infrastructure/database/indexeddb.helper';

export class IndexedDBPeerRepository implements PeerRepository {
  private readonly storeName = 'peers';
  private db = createDatabase();

  async save(peer: PeerData): Promise<void> {
    try {
      const peerData = {
        ...peer,
        githubUsername: gitHubUsernameToString(peer.githubUsername),
        createdAt: peer.createdAt.toISOString(),
        updatedAt: peer.updatedAt.toISOString()
      };
      await this.db.put(this.storeName, peerData);
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string): Promise<PeerData | null> {
    try {
      const peerData = await this.db.get<any>(this.storeName, id);
      
      if (!peerData) return null;
      
      return this.toPeerEntity(peerData);
    } catch (error) {
      return null;
    }
  }

  async findByGitHubUsername(username: string): Promise<PeerData | null> {
    try {
      const peerData = await this.db.getByIndex<any>(this.storeName, 'githubUsername', username);
      
      if (!peerData) return null;
      
      return this.toPeerEntity(peerData);
    } catch (error) {
      return null;
    }
  }

  async findByTeamId(teamId: string): Promise<PeerData[]> {
    try {
      const peersData = await this.db.getAllByIndex<any>(this.storeName, 'teamId', teamId);
      
      return peersData.map(data => this.toPeerEntity(data));
    } catch (error) {
      return [];
    }
  }

  async findAll(): Promise<PeerData[]> {
    try {
      const peersData = await this.db.getAll<any>(this.storeName);
      
      return peersData.map(data => this.toPeerEntity(data));
    } catch (error) {
      return [];
    }
  }

  async update(peer: PeerData): Promise<void> {
    await this.save(peer); // IndexedDB put() works as upsert
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.delete(this.storeName, id);
    } catch (error) {
      throw error;
    }
  }

  async findByIds(ids: string[]): Promise<PeerData[]> {
    try {
      const peers: PeerData[] = [];
      
      for (const id of ids) {
        const peer = await this.db.get<any>(this.storeName, id);
        if (peer) {
          peers.push(this.toPeerEntity(peer));
        }
      }
      
      return peers;
    } catch (error) {
      return [];
    }
  }

  private toPeerEntity(data: any): PeerData {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      githubUsername: createGitHubUsername(data.githubUsername),
      jiraUsername: data.jiraUsername,
      teamId: data.teamId,
      role: data.role,
      seniority: data.seniority,
      avatar: data.avatar,
      createdAt: typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt,
      updatedAt: typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : data.updatedAt
    };
  }
}