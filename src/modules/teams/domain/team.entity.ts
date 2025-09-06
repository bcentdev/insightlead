import { v4 as uuidv4 } from 'uuid';

export type TeamData = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly leadId: string | null;
  readonly memberIds: readonly string[];
  readonly department?: string;
  readonly jiraProjectKey?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateTeamProps = {
  id?: string;
  name: string;
  description: string;
  leadId?: string | null;
  memberIds?: string[];
  department?: string;
  jiraProjectKey?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateTeamDetailsProps = Partial<Pick<TeamData, 'name' | 'description' | 'department' | 'jiraProjectKey'>>;

const validateTeamData = (data: Omit<TeamData, 'id' | 'createdAt' | 'updatedAt'>): void => {
  if (!data.name.trim()) {
    throw new Error('Team name cannot be empty');
  }
  if (data.leadId && data.memberIds.length > 0 && !data.memberIds.includes(data.leadId)) {
    throw new Error('Team lead must be a member of the team');
  }
};

export const createTeam = (props: CreateTeamProps): TeamData => {
  const now = new Date();
  const teamData: TeamData = {
    id: props.id || uuidv4(),
    name: props.name,
    description: props.description,
    leadId: props.leadId || null,
    memberIds: props.memberIds || [],
    department: props.department,
    jiraProjectKey: props.jiraProjectKey,
    createdAt: props.createdAt || now,
    updatedAt: props.updatedAt || now
  };

  validateTeamData(teamData);
  return teamData;
};

export const updateTeamDetails = (team: TeamData, updates: UpdateTeamDetailsProps): TeamData => {
  const updatedTeam: TeamData = {
    ...team,
    ...updates,
    updatedAt: new Date()
  };

  validateTeamData(updatedTeam);
  return updatedTeam;
};

export const changeTeamLead = (team: TeamData, newLeadId: string | null): TeamData => {
  if (newLeadId && !team.memberIds.includes(newLeadId)) {
    throw new Error('New lead must be a member of the team');
  }
  
  return {
    ...team,
    leadId: newLeadId,
    updatedAt: new Date()
  };
};

export const addTeamMember = (team: TeamData, memberId: string): TeamData => {
  if (team.memberIds.includes(memberId)) {
    return team;
  }
  
  return {
    ...team,
    memberIds: [...team.memberIds, memberId],
    updatedAt: new Date()
  };
};

export const removeTeamMember = (team: TeamData, memberId: string): TeamData => {
  if (memberId === team.leadId) {
    throw new Error('Cannot remove team lead. Change lead first.');
  }
  
  return {
    ...team,
    memberIds: team.memberIds.filter(id => id !== memberId),
    updatedAt: new Date()
  };
};

export const getTeamMemberCount = (team: TeamData): number => team.memberIds.length;

export const isTeamMember = (team: TeamData, peerId: string): boolean => 
  team.memberIds.includes(peerId);

export const isTeamLead = (team: TeamData, peerId: string): boolean => 
  team.leadId === peerId;

export const teamToJSON = (team: TeamData): CreateTeamProps => ({
  id: team.id,
  name: team.name,
  description: team.description,
  leadId: team.leadId,
  memberIds: [...team.memberIds],
  department: team.department,
  jiraProjectKey: team.jiraProjectKey,
  createdAt: team.createdAt,
  updatedAt: team.updatedAt
});

// Type aliases for compatibility
export type Team = TeamData;
export type TeamProps = CreateTeamProps;