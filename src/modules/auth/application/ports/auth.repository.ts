import { User } from '@/modules/auth/domain/user.entity';
import { Session } from '@/modules/auth/domain/session.entity';

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterCredentials = {
  email: string;
  password: string;
  name: string;
};

export type AuthResult = {
  user: User;
  session: Session;
};

export interface AuthRepository {
  // User management
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  createUser(userData: RegisterCredentials): Promise<User>;
  updateUser(user: User): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Authentication
  login(credentials: LoginCredentials): Promise<AuthResult>;
  register(credentials: RegisterCredentials): Promise<AuthResult>;
  logout(sessionId: string): Promise<void>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  
  // Session management
  findSessionById(id: string): Promise<Session | null>;
  findSessionByToken(token: string): Promise<Session | null>;
  findSessionsByUserId(userId: string): Promise<Session[]>;
  createSession(session: Session): Promise<Session>;
  updateSession(session: Session): Promise<Session>;
  deleteSession(id: string): Promise<void>;
  deleteAllUserSessions(userId: string): Promise<void>;
  
  // Password management
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
  
  // Token management
  generateToken(userId: string): Promise<string>;
  validateToken(token: string): Promise<{ userId: string; sessionId: string } | null>;
  generateRefreshToken(): Promise<string>;
}

export interface AuthPort extends AuthRepository {}