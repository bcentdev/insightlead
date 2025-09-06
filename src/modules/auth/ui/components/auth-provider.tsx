import React, { useState, useEffect, ReactNode } from 'react';
import { AuthContext, AuthState, AuthContextType } from '@/modules/auth/ui/hooks/use-auth';
import { User } from '@/modules/auth/domain/user.entity';
import { Session } from '@/modules/auth/domain/session.entity';
import { LocalStorageAuthRepository } from '@/modules/auth/infrastructure/repositories/localstorage-auth.repository';
import { LoginUseCase } from '@/modules/auth/application/use-cases/login.use-case';
import { RegisterUseCase } from '@/modules/auth/application/use-cases/register.use-case';
import { LogoutUseCase } from '@/modules/auth/application/use-cases/logout.use-case';

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false
  });

  // Repository and use cases
  const authRepository = new LocalStorageAuthRepository();
  const loginUseCase = new LoginUseCase(authRepository);
  const registerUseCase = new RegisterUseCase(authRepository);
  const logoutUseCase = new LogoutUseCase(authRepository);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async (): Promise<void> => {
    try {
      // Check for existing session in localStorage
      const sessionData = localStorage.getItem('insightlead_current_session');
      if (!sessionData) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const parsedSession = JSON.parse(sessionData);
      const session = await authRepository.findSessionById(parsedSession.id);
      
      if (!session || !session.isActive || session.expiresAt <= new Date()) {
        // Session expired or invalid
        localStorage.removeItem('insightlead_current_session');
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const user = await authRepository.findUserById(session.userId);
      if (!user) {
        localStorage.removeItem('insightlead_current_session');
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Valid session found
      setState({
        user,
        session,
        isLoading: false,
        isAuthenticated: true
      });

    } catch (error) {
      console.error('Auth initialization error:', error);
      localStorage.removeItem('insightlead_current_session');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await loginUseCase.execute({ email, password });
      
      // Store session in localStorage
      localStorage.setItem('insightlead_current_session', JSON.stringify({
        id: result.session.id,
        token: result.session.token
      }));

      setState({
        user: result.user,
        session: result.session,
        isLoading: false,
        isAuthenticated: true
      });
      
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await registerUseCase.execute({ email, password, name });
      
      // Store session in localStorage
      localStorage.setItem('insightlead_current_session', JSON.stringify({
        id: result.session.id,
        token: result.session.token
      }));

      setState({
        user: result.user,
        session: result.session,
        isLoading: false,
        isAuthenticated: true
      });
      
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (state.session) {
        await logoutUseCase.execute(state.session.id);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state and storage
      localStorage.removeItem('insightlead_current_session');
      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  const refreshAuth = async (): Promise<void> => {
    if (!state.session?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await authRepository.refreshToken(state.session.refreshToken);
      
      // Update stored session
      localStorage.setItem('insightlead_current_session', JSON.stringify({
        id: result.session.id,
        token: result.session.token
      }));

      setState({
        user: result.user,
        session: result.session,
        isLoading: false,
        isAuthenticated: true
      });
      
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};