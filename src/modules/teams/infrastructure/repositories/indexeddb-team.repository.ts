import { TeamData } from '@/modules/teams/domain/team.entity';
import { TeamRepository } from '@/modules/teams/domain/team.repository';
import { createDatabase } from '@/shared/infrastructure/database/indexeddb.helper';

export class IndexedDBTeamRepository implements TeamRepository {
  private readonly storeName = 'teams';
  private db = createDatabase();

  async save(team: TeamData): Promise<TeamData> {
    try {
      const teamData = {
        ...team,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString()
      };
      await this.db.put(this.storeName, teamData);
      return team;
    } catch (error) {
      throw error;
    }
  }

  async findById(id: string): Promise<TeamData | null> {
    try {
      const teamData = await this.db.get<any>(this.storeName, id);
      
      if (!teamData) return null;
      
      return this.toTeamEntity(teamData);
    } catch (error) {
      return null;
    }
  }

  async findByLeadId(leadId: string): Promise<TeamData[]> {
    try {
      const teamsData = await this.db.getAllByIndex<any>(this.storeName, 'leadId', leadId);
      
      return teamsData.map(data => this.toTeamEntity(data));
    } catch (error) {
      return [];
    }
  }

  async findByMemberId(memberId: string): Promise<TeamData[]> {
    try {
      const teamsData = await this.db.getAll<any>(this.storeName);
      
      return teamsData
        .filter(team => team.memberIds.includes(memberId))
        .map(data => this.toTeamEntity(data));
    } catch (error) {
      return [];
    }
  }

  async findByDepartment(department: string): Promise<TeamData[]> {
    try {
      const teamsData = await this.db.getAllByIndex<any>(this.storeName, 'department', department);
      
      return teamsData.map(data => this.toTeamEntity(data));
    } catch (error) {
      return [];
    }
  }

  async findByName(name: string): Promise<TeamData | null> {
    try {
      const teamsData = await this.db.getAll<any>(this.storeName);
      
      const teamData = teamsData.find(team => team.name === name);
      if (!teamData) return null;
      
      return this.toTeamEntity(teamData);
    } catch (error) {
      return null;
    }
  }

  async findAll(): Promise<TeamData[]> {
    try {
      const teamsData = await this.db.getAll<any>(this.storeName);
      
      return teamsData.map(data => this.toTeamEntity(data));
    } catch (error) {
      return [];
    }
  }

  async update(team: TeamData): Promise<void> {
    await this.save(team); // IndexedDB put() works as upsert
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.delete(this.storeName, id);
    } catch (error) {
      throw error;
    }
  }

  private toTeamEntity(data: any): TeamData {
    return {
      ...data,
      createdAt: typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt,
      updatedAt: typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : data.updatedAt
    };
  }
}