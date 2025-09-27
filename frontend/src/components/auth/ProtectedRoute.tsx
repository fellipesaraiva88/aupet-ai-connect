import React from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: string | string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback
}: ProtectedRouteProps) {
  const { user, userProfile, loading, hasRole, hasPermission } = useAuthContext();
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

  // Check role requirements
  if (requiredRole && userProfile && !hasRole(requiredRole)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página. Entre em contato com seu administrador se você acredita que isso é um erro.
            </p>
          </div>
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Nível de acesso necessário: {Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole}
              <br />
              Seu nível de acesso: {userProfile?.role || 'Não definido'}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Check permission requirements
  if (requiredPermission && userProfile && !hasPermission(Array.isArray(requiredPermission) ? requiredPermission[0] : requiredPermission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Permissão Insuficiente</h1>
            <p className="text-muted-foreground">
              Você não tem a permissão necessária para acessar esta funcionalidade.
            </p>
          </div>
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Permissão necessária: {Array.isArray(requiredPermission) ? requiredPermission.join(', ') : requiredPermission}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}