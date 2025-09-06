import { v4 as uuidv4 } from 'uuid';

export type SessionData = {
  readonly id: string;
  readonly userId: string;
  readonly token: string;
  readonly refreshToken?: string;
  readonly deviceInfo?: string;
  readonly ipAddress?: string;
  readonly isActive: boolean;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly lastAccessedAt: Date;
};

export type CreateSessionProps = {
  id?: string;
  userId: string;
  token: string;
  refreshToken?: string;
  deviceInfo?: string;
  ipAddress?: string;
  isActive?: boolean;
  expiresAt?: Date;
  createdAt?: Date;
  lastAccessedAt?: Date;
};

const validateSessionData = (data: Omit<SessionData, 'id' | 'createdAt' | 'lastAccessedAt'>): void => {
  if (!data.userId.trim()) {
    throw new Error('Session must be associated with a user');
  }
  if (!data.token.trim()) {
    throw new Error('Session token cannot be empty');
  }
  if (data.expiresAt <= new Date()) {
    throw new Error('Session expiration date must be in the future');
  }
};

export const createSession = (props: CreateSessionProps): SessionData => {
  const now = new Date();
  // Default expiration: 7 days from now
  const defaultExpiration = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
  
  const sessionData: SessionData = {
    id: props.id || uuidv4(),
    userId: props.userId,
    token: props.token,
    refreshToken: props.refreshToken,
    deviceInfo: props.deviceInfo,
    ipAddress: props.ipAddress,
    isActive: props.isActive ?? true,
    expiresAt: props.expiresAt || defaultExpiration,
    createdAt: props.createdAt || now,
    lastAccessedAt: props.lastAccessedAt || now
  };

  validateSessionData(sessionData);
  return sessionData;
};

export const updateLastAccessed = (session: SessionData): SessionData => ({
  ...session,
  lastAccessedAt: new Date()
});

export const deactivateSession = (session: SessionData): SessionData => ({
  ...session,
  isActive: false,
  lastAccessedAt: new Date()
});

export const refreshSession = (session: SessionData, newToken: string, newExpiration?: Date): SessionData => {
  const now = new Date();
  const defaultExpiration = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
  
  return {
    ...session,
    token: newToken,
    expiresAt: newExpiration || defaultExpiration,
    lastAccessedAt: now
  };
};

export const isSessionValid = (session: SessionData): boolean => {
  const now = new Date();
  return session.isActive && session.expiresAt > now;
};

export const isSessionExpired = (session: SessionData): boolean => {
  return session.expiresAt <= new Date();
};

export const getSessionTimeRemaining = (session: SessionData): number => {
  const now = new Date();
  const timeRemaining = session.expiresAt.getTime() - now.getTime();
  return Math.max(0, timeRemaining);
};

export const sessionToJSON = (session: SessionData): CreateSessionProps => ({
  id: session.id,
  userId: session.userId,
  token: session.token,
  refreshToken: session.refreshToken,
  deviceInfo: session.deviceInfo,
  ipAddress: session.ipAddress,
  isActive: session.isActive,
  expiresAt: session.expiresAt,
  createdAt: session.createdAt,
  lastAccessedAt: session.lastAccessedAt
});

// Type aliases for compatibility
export type Session = SessionData;
export type SessionProps = CreateSessionProps;