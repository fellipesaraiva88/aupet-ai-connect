import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext();
  const [authMode, setAuthMode] = React.useState<'login' | 'signup'>('login');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="space-y-4 p-6 border rounded-lg bg-card">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative">
          <LoginForm
            mode={authMode}
            onToggleMode={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}