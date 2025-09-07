import type { TeamData, CreateTeamProps } from '@/modules/teams/domain/team.entity';
import type { ITeamRepository } from '../team.repository.interface';
import { IndexedDBTeamRepository } from '@/modules/teams/infrastructure/repositories/indexeddb-team.repository';
import { createTeam } from '@/modules/teams/domain/team.entity';

export class LocalTeamRepository implements ITeamRepository {
  private repository = new IndexedDBTeamRepository();

  async getAll(): Promise<TeamData[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<TeamData | null> {
    return this.repository.findById(id);
  }

  async getByLeadId(leadId: string): Promise<TeamData[]> {
    return this.repository.findByLeadId(leadId);
  }

  async create(teamProps: CreateTeamProps): Promise<TeamData> {
    const team = createTeam(teamProps);
    return this.repository.save(team);
  }

  async update(id: string, updates: Partial<CreateTeamProps>): Promise<TeamData> {
    const existingTeam = await this.repository.findById(id);
    if (!existingTeam) {
      throw new Error('Team not found');
    }

    const updatedTeam: TeamData = {
      ...existingTeam,
      ...updates,
      updatedAt: new Date(),
    };

    await this.repository.update(updatedTeam);
    return updatedTeam;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async getMemberCount(teamId: string): Promise<number> {
    const team = await this.repository.findById(teamId);
    return team?.memberIds.length || 0;
  }

  async getTeamMembers(teamId: string): Promise<string[]> {
    const team = await this.repository.findById(teamId);
    return team?.memberIds || [];
  }
}