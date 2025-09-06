import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth/ui/hooks/use-auth';
import { LoadingSpinner } from '@/presentation/components/common/loading-spinner';

type ProtectedRouteProps = {
  children: ReactNode;
  fallback?: ReactNode;
  requireEmailVerification?: boolean;
  requiredRole?: string;
  requiredSubscriptionTier?: string;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  fallback,
  requireEmailVerification = false,
  requiredRole,
  requiredSubscriptionTier
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return fallback || (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check email verification if required
  if (requireEmailVerification && !user.isEmailVerified) {
    return (
      <Navigate 
        to="/verify-email" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check subscription tier if required
  if (requiredSubscriptionTier) {
    const tierHierarchy = { 'free': 0, 'pro': 1, 'enterprise': 2 };
    const userTierLevel = tierHierarchy[user.subscriptionTier as keyof typeof tierHierarchy] || 0;
    const requiredTierLevel = tierHierarchy[requiredSubscriptionTier as keyof typeof tierHierarchy] || 0;
    
    if (userTierLevel < requiredTierLevel) {
      return (
        <Navigate 
          to="/upgrade" 
          state={{ from: location.pathname, requiredTier: requiredSubscriptionTier }} 
          replace 
        />
      );
    }
  }

  return <>{children}</>;
};