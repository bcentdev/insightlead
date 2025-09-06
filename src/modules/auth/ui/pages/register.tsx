import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/ui/hooks/use-auth';
import { RegisterForm } from '@/modules/auth/ui/components/register-form';

export const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleRegisterSuccess = () => {
    // Navigation will be handled by the auth context
    // The user will be redirected automatically
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <RegisterForm onSuccess={handleRegisterSuccess} />
      </div>
    </div>
  );
};