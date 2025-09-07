import type { TeamData, CreateTeamProps } from '@/modules/teams/domain/team.entity';
import type { ITeamRepository } from '../team.repository.interface';

export class CloudTeamRepository implements ITeamRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/api/teams${endpoint}`;
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

  async getAll(): Promise<TeamData[]> {
    return this.fetchApi('');
  }

  async getById(id: string): Promise<TeamData | null> {
    try {
      const team = await this.fetchApi<TeamData & { memberIds: string[] }>(`/${id}`);
      return {
        ...team,
        memberIds: team.memberIds || [],
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getByLeadId(leadId: string): Promise<TeamData[]> {
    const teams = await this.getAll();
    return teams.filter(team => team.leadId === leadId);
  }

  async create(team: CreateTeamProps): Promise<TeamData> {
    return this.fetchApi('', {
      method: 'POST',
      body: JSON.stringify(team),
    });
  }

  async update(id: string, updates: Partial<CreateTeamProps>): Promise<TeamData> {
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

  async getMemberCount(teamId: string): Promise<number> {
    const team = await this.getById(teamId);
    return team?.memberIds.length || 0;
  }

  async getTeamMembers(teamId: string): Promise<string[]> {
    const team = await this.getById(teamId);
    return team?.memberIds || [];
  }
}