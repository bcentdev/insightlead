import type { PeerData, CreatePeerProps } from '@/modules/peers/domain/peer.entity';
import type { IPeerRepository } from '../peer.repository.interface';

export class CloudPeerRepository implements IPeerRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/api/peers${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getAll(): Promise<PeerData[]> {
    return this.fetchApi('');
  }

  async getById(id: string): Promise<PeerData | null> {
    try {
      return await this.fetchApi<PeerData>(`/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getByTeamId(teamId: string): Promise<PeerData[]> {
    return this.fetchApi(`?teamId=${teamId}`);
  }

  async getByEmail(email: string): Promise<PeerData | null> {
    const peers = await this.getAll();
    return peers.find(peer => peer.email === email) || null;
  }

  async getByGithubUsername(githubUsername: string): Promise<PeerData | null> {
    const peers = await this.getAll();
    return peers.find(peer => peer.githubUsername === githubUsername) || null;
  }

  async create(peer: CreatePeerProps): Promise<PeerData> {
    return this.fetchApi('', {
      method: 'POST',
      body: JSON.stringify(peer),
    });
  }

  async update(id: string, updates: Partial<CreatePeerProps>): Promise<PeerData> {
    return this.fetchApi(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async delete(id: string): Promise<void> {
    await this.fetchApi(`/${id}`, {
      method: 'DELETE',
    });
  }

  async isTeamLead(peerId: string): Promise<boolean> {
    // We'll need to get teams and check if this peer is a lead
    const teamsResponse = await fetch(`${this.baseUrl}/api/teams`);
    if (!teamsResponse.ok) return false;
    
    const teams = await teamsResponse.json();
    return teams.some((team: any) => team.leadId === peerId);
  }

  async getTeamLeads(): Promise<PeerData[]> {
    const peers = await this.getAll();
    const leads: PeerData[] = [];
    
    for (const peer of peers) {
      if (await this.isTeamLead(peer.id)) {
        leads.push(peer);
      }
    }
    
    return leads;
  }
}