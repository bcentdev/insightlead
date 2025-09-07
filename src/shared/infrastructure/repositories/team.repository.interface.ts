import type { TeamData, CreateTeamProps } from '@/modules/teams/domain/team.entity';

export interface ITeamRepository {
  // Read operations
  getAll(): Promise<TeamData[]>;
  getById(id: string): Promise<TeamData | null>;
  getByLeadId(leadId: string): Promise<TeamData[]>;
  
  // Write operations
  create(team: CreateTeamProps): Promise<TeamData>;
  update(id: string, updates: Partial<CreateTeamProps>): Promise<TeamData>;
  delete(id: string): Promise<void>;
  
  // Helper operations
  getMemberCount(teamId: string): Promise<number>;
  getTeamMembers(teamId: string): Promise<string[]>; // Returns member IDs
}