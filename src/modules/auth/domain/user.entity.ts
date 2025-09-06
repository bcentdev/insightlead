import { v4 as uuidv4 } from 'uuid';

export const USER_ROLES = {
  ADMIN: 'admin',
  TEAM_LEAD: 'team_lead', 
  MEMBER: 'member'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
} as const;

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];

export type UserData = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatar?: string;
  readonly role: UserRole;
  readonly teamIds: readonly string[]; // Teams user belongs to
  readonly ownedTeamIds: readonly string[]; // Teams user owns/leads
  readonly subscriptionTier: SubscriptionTier;
  readonly isEmailVerified: boolean;
  readonly lastLoginAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type CreateUserProps = {
  id?: string;
  email: string;
  name: string;
  avatar?: string;
  role?: UserRole;
  teamIds?: string[];
  ownedTeamIds?: string[];
  subscriptionTier?: SubscriptionTier;
  isEmailVerified?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateUserProfileProps = Partial<Pick<UserData, 'name' | 'avatar'>>;

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateUserData = (data: Omit<UserData, 'id' | 'createdAt' | 'updatedAt'>): void => {
  if (!data.email.trim()) {
    throw new Error('User email cannot be empty');
  }
  if (!data.name.trim()) {
    throw new Error('User name cannot be empty');
  }
  if (!isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }
  if (data.name.length < 2) {
    throw new Error('User name must be at least 2 characters long');
  }
  if (data.name.length > 100) {
    throw new Error('User name cannot exceed 100 characters');
  }
};

export const createUser = (props: CreateUserProps): UserData => {
  const now = new Date();
  const userData: UserData = {
    id: props.id || uuidv4(),
    email: props.email.toLowerCase().trim(),
    name: props.name.trim(),
    avatar: props.avatar,
    role: props.role || USER_ROLES.MEMBER,
    teamIds: props.teamIds || [],
    ownedTeamIds: props.ownedTeamIds || [],
    subscriptionTier: props.subscriptionTier || SUBSCRIPTION_TIERS.FREE,
    isEmailVerified: props.isEmailVerified || false,
    lastLoginAt: props.lastLoginAt,
    createdAt: props.createdAt || now,
    updatedAt: props.updatedAt || now
  };

  validateUserData(userData);
  return userData;
};

export const updateUserProfile = (user: UserData, updates: UpdateUserProfileProps): UserData => {
  const updatedUser: UserData = {
    ...user,
    ...updates,
    updatedAt: new Date()
  };

  if (updates.name) {
    updatedUser.name = updates.name.trim();
  }

  validateUserData(updatedUser);
  return updatedUser;
};

export const addUserToTeam = (user: UserData, teamId: string): UserData => {
  if (user.teamIds.includes(teamId)) {
    return user;
  }
  
  return {
    ...user,
    teamIds: [...user.teamIds, teamId],
    updatedAt: new Date()
  };
};

export const removeUserFromTeam = (user: UserData, teamId: string): UserData => {
  return {
    ...user,
    teamIds: user.teamIds.filter(id => id !== teamId),
    ownedTeamIds: user.ownedTeamIds.filter(id => id !== teamId),
    updatedAt: new Date()
  };
};

export const promoteToTeamLead = (user: UserData, teamId: string): UserData => {
  if (!user.teamIds.includes(teamId)) {
    throw new Error('User must be a member of the team to become a lead');
  }
  
  return {
    ...user,
    role: USER_ROLES.TEAM_LEAD,
    ownedTeamIds: user.ownedTeamIds.includes(teamId) 
      ? user.ownedTeamIds 
      : [...user.ownedTeamIds, teamId],
    updatedAt: new Date()
  };
};

export const updateSubscriptionTier = (user: UserData, tier: SubscriptionTier): UserData => ({
  ...user,
  subscriptionTier: tier,
  updatedAt: new Date()
});

export const markEmailAsVerified = (user: UserData): UserData => ({
  ...user,
  isEmailVerified: true,
  updatedAt: new Date()
});

export const updateLastLogin = (user: UserData): UserData => ({
  ...user,
  lastLoginAt: new Date(),
  updatedAt: new Date()
});

export const canManageTeam = (user: UserData, teamId: string): boolean => 
  user.role === USER_ROLES.ADMIN || user.ownedTeamIds.includes(teamId);

export const canAccessTeam = (user: UserData, teamId: string): boolean =>
  user.role === USER_ROLES.ADMIN || user.teamIds.includes(teamId);

export const hasSubscriptionFeature = (user: UserData, feature: string): boolean => {
  const tierFeatures = {
    [SUBSCRIPTION_TIERS.FREE]: ['basic_dashboard', 'local_storage'],
    [SUBSCRIPTION_TIERS.PRO]: ['basic_dashboard', 'local_storage', 'cloud_sync', 'team_collaboration', 'notifications'],
    [SUBSCRIPTION_TIERS.ENTERPRISE]: ['basic_dashboard', 'local_storage', 'cloud_sync', 'team_collaboration', 'notifications', 'sso', 'api_access', 'advanced_analytics']
  };
  
  return tierFeatures[user.subscriptionTier]?.includes(feature) || false;
};

export const userToJSON = (user: UserData): CreateUserProps => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatar: user.avatar,
  role: user.role,
  teamIds: [...user.teamIds],
  ownedTeamIds: [...user.ownedTeamIds],
  subscriptionTier: user.subscriptionTier,
  isEmailVerified: user.isEmailVerified,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

// Type aliases for compatibility
export type User = UserData;
export type UserProps = CreateUserProps;