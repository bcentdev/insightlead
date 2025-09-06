import { v4 as uuidv4 } from 'uuid';
import { GitHubUsername } from '@/modules/peers/domain/value-objects/github-username.vo';

export const PEER_ROLES = {
  FRONTEND_DEVELOPER: 'frontend_developer',
  BACKEND_DEVELOPER: 'backend_developer',
  FULLSTACK_DEVELOPER: 'fullstack_developer',
  QA_ENGINEER: 'qa_engineer',
  DEVOPS_ENGINEER: 'devops_engineer',
  PRODUCT_MANAGER: 'product_manager',
  UI_UX_DESIGNER: 'ui_ux_designer'
} as const;

export type PeerRole = typeof PEER_ROLES[keyof typeof PEER_ROLES];

export const SENIORITY_LEVELS = {
  JUNIOR: 'junior',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  PRINCIPAL: 'principal'
} as const;

export type Seniority = typeof SENIORITY_LEVELS[keyof typeof SENIORITY_LEVELS];

export type PeerData = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly githubUsername: GitHubUsername;
  readonly jiraUsername?: string;
  readonly teamId: string;
  readonly role: PeerRole;
  readonly seniority: Seniority;
  readonly avatar?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreatePeerProps = {
  id?: string;
  name: string;
  email: string;
  githubUsername: GitHubUsername;
  jiraUsername?: string;
  teamId: string;
  role: PeerRole;
  seniority: Seniority;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdatePeerProfileProps = Partial<Pick<PeerData, 'name' | 'email' | 'avatar' | 'role' | 'seniority' | 'jiraUsername'>>;

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePeerData = (data: Omit<PeerData, 'id' | 'createdAt' | 'updatedAt'>): void => {
  if (!data.name.trim()) {
    throw new Error('Peer name cannot be empty');
  }
  if (!data.email.trim()) {
    throw new Error('Peer email cannot be empty');
  }
  if (!data.teamId.trim()) {
    throw new Error('Peer must belong to a team');
  }
  if (!isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }
};

export const createPeer = (props: CreatePeerProps): PeerData => {
  const now = new Date();
  const peerData: PeerData = {
    id: props.id || uuidv4(),
    name: props.name,
    email: props.email,
    githubUsername: props.githubUsername,
    jiraUsername: props.jiraUsername,
    teamId: props.teamId,
    role: props.role,
    seniority: props.seniority,
    avatar: props.avatar,
    createdAt: props.createdAt || now,
    updatedAt: props.updatedAt || now
  };

  validatePeerData(peerData);
  return peerData;
};

export const updatePeerProfile = (peer: PeerData, updates: UpdatePeerProfileProps): PeerData => {
  const updatedPeer: PeerData = {
    ...peer,
    ...updates,
    updatedAt: new Date()
  };

  validatePeerData(updatedPeer);
  return updatedPeer;
};

export const updatePeerGitHubUsername = (peer: PeerData, githubUsername: GitHubUsername): PeerData => ({
  ...peer,
  githubUsername,
  updatedAt: new Date()
});

export const updatePeerJiraUsername = (peer: PeerData, jiraUsername: string): PeerData => ({
  ...peer,
  jiraUsername,
  updatedAt: new Date()
});

export const peerToJSON = (peer: PeerData): CreatePeerProps => ({
  id: peer.id,
  name: peer.name,
  email: peer.email,
  githubUsername: peer.githubUsername,
  jiraUsername: peer.jiraUsername,
  teamId: peer.teamId,
  role: peer.role,
  seniority: peer.seniority,
  avatar: peer.avatar,
  createdAt: peer.createdAt,
  updatedAt: peer.updatedAt
});

// Type aliases for compatibility
export type Peer = PeerData;
export type PeerProps = CreatePeerProps;