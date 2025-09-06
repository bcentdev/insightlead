import { createContext, useContext } from 'react';
import { User } from '@/modules/auth/domain/user.entity';
import { Session } from '@/modules/auth/domain/session.entity';

export type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export type AuthActions = {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
};

export type AuthContextType = AuthState & AuthActions;

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};