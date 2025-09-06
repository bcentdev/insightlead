import { TeamData } from '../entities/team.entity';

export type TeamRepository = {
  readonly save: (team: TeamData) => Promise<TeamData>;
  readonly findById: (id: string) => Promise<TeamData | null>;
  readonly findByName: (name: string) => Promise<TeamData | null>;
  readonly findByLeadId: (leadId: string) => Promise<readonly TeamData[]>;
  readonly findByMemberId: (memberId: string) => Promise<readonly TeamData[]>;
  readonly findByDepartment: (department: string) => Promise<readonly TeamData[]>;
  readonly findAll: () => Promise<readonly TeamData[]>;
  readonly update: (team: TeamData) => Promise<void>;
  readonly delete: (id: string) => Promise<void>;
};