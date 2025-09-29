import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { ToastContainer } from "@/components/ui/enhanced-toast";
import { useLoading } from "@/contexts/LoadingContext";
import { useEnhancedToast, setGlobalToastInstance } from "@/hooks/useEnhancedToast";
import { PawPrintsBackground } from "@/components/ui/paw-prints-background";

// Enhanced error boundaries
import {
  ErrorBoundary,
  withPageErrorBoundary,
  withChunkErrorBoundary,
  setupGlobalErrorHandling,
} from "@/components/error-boundaries";

// Store initialization
import { initializeStores } from "@/stores";

// Performance monitoring
import performanceMonitor from "@/utils/performance";
import { usePerformanceMonitoring } from "@/utils/performance";

// Accessibility
import { useSkipToContent } from "@/hooks/useA11y";

// Core pages loaded immediately
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy load secondary pages with chunk error boundaries
const Conversations = withChunkErrorBoundary(
  lazy(() => import("./pages/Conversations")),
  'conversations-page'
);
const AIConfig = withChunkErrorBoundary(
  lazy(() => import("./pages/AIConfig")),
  'ai-config-page'
);
const Pets = withChunkErrorBoundary(
  lazy(() => import("./pages/Pets")),
  'pets-page'
);
const Customers = withChunkErrorBoundary(
  lazy(() => import("./pages/Customers")),
  'customers-page'
);
const ClientsPets = withChunkErrorBoundary(
  lazy(() => import("./pages/ClientsPets")),
  'clients-pets-page'
);
const Appointments = withChunkErrorBoundary(
  lazy(() => import("./pages/Appointments")),
  'appointments-page'
);
const Catalog = withChunkErrorBoundary(
  lazy(() => import("./pages/Catalog")),
  'catalog-page'
);
const Analytics = withChunkErrorBoundary(
  lazy(() => import("./pages/Analytics")),
  'analytics-page'
);
const Settings = withChunkErrorBoundary(
  lazy(() => import("./pages/Settings")),
  'settings-page'
);
const Signup = withChunkErrorBoundary(
  lazy(() => import("./pages/Signup")),
  'signup-page'
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component for lazy-loaded pages
const PageLoadingComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-pink-50">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground">Buscando patinhas... 🐾</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-pink-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Preparando o ambiente pet... 🐕</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-pink-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Organizando os brinquedos... 🎾</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/signup" element={
        <PublicRoute>
          <Signup />
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Index />
        </ProtectedRoute>
      } />
      <Route path="/conversations" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Conversations />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/conversations/:id/history" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Conversations />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/ai-config" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <AIConfig />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/pets" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Pets />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/pets/new" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Pets />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/customers" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Customers />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/customers/new" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Customers />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/clients-pets" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <ClientsPets />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/appointments" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Appointments />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/appointments/new" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Appointments />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/catalog" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Catalog />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Analytics />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/analytics/history" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Analytics />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoadingComponent />}>
            <Settings />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
};

const AppContent = () => {
  const { isAnyLoading } = useLoading();
  const toastInstance = useEnhancedToast();

  React.useEffect(() => {
    setGlobalToastInstance(toastInstance);
  }, [toastInstance]);

  return (
    <>
      <PawPrintsBackground />
      <LoadingOverlay isVisible={isAnyLoading()} />
      <ToastContainer toasts={toastInstance.toasts} />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LoadingProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </LoadingProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
