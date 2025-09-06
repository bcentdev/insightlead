import { 
  AuthRepository, 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResult 
} from '@/modules/auth/application/ports/auth.repository';
import { User, createUser } from '@/modules/auth/domain/user.entity';
import { Session, createSession } from '@/modules/auth/domain/session.entity';
import { jwtService } from '@/modules/auth/infrastructure/services/jwt.service';
import { passwordService } from '@/modules/auth/infrastructure/services/password.service';

export class LocalStorageAuthRepository implements AuthRepository {
  private readonly USERS_KEY = 'insightlead_users';
  private readonly SESSIONS_KEY = 'insightlead_sessions';

  // User management
  async findUserById(id: string): Promise<User | null> {
    const users = this.getUsers();
    const userData = users.find(u => u.id === id);
    return userData ? createUser(userData) : null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const users = this.getUsers();
    const userData = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return userData ? createUser(userData) : null;
  }

  async createUser(userData: RegisterCredentials): Promise<User> {
    const users = this.getUsers();
    const newUser = createUser({
      email: userData.email,
      name: userData.name,
      isEmailVerified: false // In real app, would send verification email
    });

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  async updateUser(user: User): Promise<User> {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    
    if (index === -1) {
      throw new Error('User not found');
    }

    users[index] = user;
    this.saveUsers(users);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u.id !== id);
    this.saveUsers(filteredUsers);
    
    // Also delete all user sessions
    await this.deleteAllUserSessions(id);
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const user = await this.findUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Get stored password hash
    const passwords = this.getPasswords();
    const storedHash = passwords[user.id];
    
    if (!storedHash || !(await passwordService.verifyPassword(credentials.password, storedHash))) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    const updatedUser = { ...user, lastLoginAt: new Date(), updatedAt: new Date() };
    await this.updateUser(updatedUser);

    // Create session
    const token = jwtService.generateToken({
      userId: user.id,
      sessionId: '', // Will be set after session creation
      email: user.email,
      role: user.role
    });

    const session = createSession({
      userId: user.id,
      token,
      refreshToken: jwtService.generateRefreshToken()
    });

    // Update token with session ID
    const updatedToken = jwtService.generateToken({
      userId: user.id,
      sessionId: session.id,
      email: user.email,
      role: user.role
    });

    const finalSession = { ...session, token: updatedToken };
    await this.createSession(finalSession);

    return {
      user: updatedUser,
      session: finalSession
    };
  }

  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    // Create user
    const user = await this.createUser(credentials);

    // Store password hash
    const hashedPassword = await passwordService.hashPassword(credentials.password);
    this.storePassword(user.id, hashedPassword);

    // Create session
    const token = jwtService.generateToken({
      userId: user.id,
      sessionId: '', // Will be set after session creation
      email: user.email,
      role: user.role
    });

    const session = createSession({
      userId: user.id,
      token,
      refreshToken: jwtService.generateRefreshToken()
    });

    // Update token with session ID
    const updatedToken = jwtService.generateToken({
      userId: user.id,
      sessionId: session.id,
      email: user.email,
      role: user.role
    });

    const finalSession = { ...session, token: updatedToken };
    await this.createSession(finalSession);

    return {
      user,
      session: finalSession
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.deleteSession(sessionId);
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const sessions = this.getSessions();
    const session = sessions.find(s => s.refreshToken === refreshToken);
    
    if (!session || !session.isActive) {
      throw new Error('Invalid refresh token');
    }

    const user = await this.findUserById(session.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new tokens
    const newToken = jwtService.generateToken({
      userId: user.id,
      sessionId: session.id,
      email: user.email,
      role: user.role
    });

    const newRefreshToken = jwtService.generateRefreshToken();

    // Update session
    const updatedSession = {
      ...session,
      token: newToken,
      refreshToken: newRefreshToken,
      lastAccessedAt: new Date()
    };

    await this.updateSession(updatedSession);

    return {
      user,
      session: updatedSession
    };
  }

  // Session management
  async findSessionById(id: string): Promise<Session | null> {
    const sessions = this.getSessions();
    const sessionData = sessions.find(s => s.id === id);
    return sessionData ? createSession(sessionData) : null;
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const sessions = this.getSessions();
    const sessionData = sessions.find(s => s.token === token);
    return sessionData ? createSession(sessionData) : null;
  }

  async findSessionsByUserId(userId: string): Promise<Session[]> {
    const sessions = this.getSessions();
    return sessions
      .filter(s => s.userId === userId)
      .map(s => createSession(s));
  }

  async createSession(session: Session): Promise<Session> {
    const sessions = this.getSessions();
    sessions.push(session);
    this.saveSessions(sessions);
    return session;
  }

  async updateSession(session: Session): Promise<Session> {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index === -1) {
      throw new Error('Session not found');
    }

    sessions[index] = session;
    this.saveSessions(sessions);
    return session;
  }

  async deleteSession(id: string): Promise<void> {
    const sessions = this.getSessions();
    const filteredSessions = sessions.filter(s => s.id !== id);
    this.saveSessions(filteredSessions);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    const sessions = this.getSessions();
    const filteredSessions = sessions.filter(s => s.userId !== userId);
    this.saveSessions(filteredSessions);
  }

  // Password management
  async hashPassword(password: string): Promise<string> {
    return passwordService.hashPassword(password);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return passwordService.verifyPassword(password, hash);
  }

  // Token management
  async generateToken(userId: string): Promise<string> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return jwtService.generateToken({
      userId: user.id,
      sessionId: '', // Should be set by caller
      email: user.email,
      role: user.role
    });
  }

  async validateToken(token: string): Promise<{ userId: string; sessionId: string } | null> {
    const result = jwtService.validateToken(token);
    if (!result.isValid) {
      return null;
    }

    return {
      userId: result.userId,
      sessionId: result.sessionId
    };
  }

  async generateRefreshToken(): Promise<string> {
    return jwtService.generateRefreshToken();
  }

  // Private helper methods
  private getUsers(): User[] {
    try {
      const data = localStorage.getItem(this.USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private getSessions(): Session[] {
    try {
      const data = localStorage.getItem(this.SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveSessions(sessions: Session[]): void {
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
  }

  private getPasswords(): Record<string, string> {
    try {
      const data = localStorage.getItem('insightlead_passwords');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private storePassword(userId: string, hashedPassword: string): void {
    const passwords = this.getPasswords();
    passwords[userId] = hashedPassword;
    localStorage.setItem('insightlead_passwords', JSON.stringify(passwords));
  }
}