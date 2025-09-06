import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/ui/hooks/use-auth';
import { LoginForm } from '@/modules/auth/ui/components/login-form';
import { RegisterForm } from '@/modules/auth/ui/components/register-form';

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSuccess = () => {
    // Navigation will be handled by the auth context
    // The user will be redirected automatically to dashboard
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {mode === 'login' ? (
          <LoginForm 
            onSuccess={handleSuccess}
            onSwitchToRegister={() => setMode('register')}
          />
        ) : (
          <RegisterForm 
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setMode('login')}
          />
        )}
      </div>
    </div>
  );
};