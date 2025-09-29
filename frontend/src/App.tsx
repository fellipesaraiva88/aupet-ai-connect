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
import { useLoading } from "@/contexts/LoadingContext";
import { PawPrintsBackground } from "@/components/ui/paw-prints-background";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBreakpoint } from "@/components/ui/responsive-grid";

// Enhanced error boundaries and performance monitoring
import {
  ErrorBoundary,
  setupGlobalErrorHandling,
  withChunkErrorBoundary
} from "@/components/error-boundaries";
import { initializeStores } from "@/stores";
import performanceMonitor, { usePerformanceMonitoring } from "@/utils/performance";
import { useSkipToContent } from "@/hooks/useA11y";

// Core pages loaded immediately
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy load secondary pages with enhanced error boundaries
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
const AIAnalytics = withChunkErrorBoundary(
  lazy(() => import("./pages/AIAnalytics")),
  'ai-analytics-page'
);
const Settings = withChunkErrorBoundary(
  lazy(() => import("./pages/Settings")),
  'settings-page'
);
const Signup = withChunkErrorBoundary(
  lazy(() => import("./pages/Signup")),
  'signup-page'
);

// Admin pages (super_admin only)
const Admin = withChunkErrorBoundary(
  lazy(() => import("./pages/Admin")),
  'admin-page'
);
const AdminOrganizations = withChunkErrorBoundary(
  lazy(() => import("./pages/AdminOrganizations")),
  'admin-organizations-page'
);
const AdminTokens = withChunkErrorBoundary(
  lazy(() => import("./pages/AdminTokens")),
  'admin-tokens-page'
);

// Mobile pages with better error handling
const MobileDashboard = withChunkErrorBoundary(
  lazy(() =>
    import("./pages/mobile/MobileDashboard").catch(error => {
      console.error('Failed to load MobileDashboard:', error);
      // Return fallback component
      return {
        default: () => (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
            <div className="text-center space-y-4 p-8">
              <div className="text-6xl mb-4">⚡</div>
              <h1 className="text-2xl font-bold text-gray-900">Loading Error</h1>
              <p className="text-gray-600 max-w-md">
                Failed to load mobile dashboard. Refreshing...
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      };
    })
  ),
  'mobile-dashboard'
);

// Mobile placeholder component for pages under development
const MobilePlaceholder = ({ pageName }: { pageName: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
    <div className="text-center space-y-4 p-8">
      <div className="text-6xl mb-4">🚧</div>
      <h1 className="text-2xl font-bold text-gray-900">
        {pageName} Mobile
      </h1>
      <p className="text-gray-600 max-w-md">
        Estamos trabalhando na versão mobile desta página.
        Em breve você terá acesso completo a todas as funcionalidades!
      </p>
      <div className="text-4xl mt-6">🐾</div>
      <p className="text-sm text-gray-500">
        Use a versão desktop por enquanto
      </p>
    </div>
  </div>
);

// Enhanced QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
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
  const isMobile = useIsMobile();
  const { isMobile: isBreakpointMobile } = useBreakpoint();

  // Determine if we should use mobile layout
  const shouldUseMobileLayout = isMobile || isBreakpointMobile;

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
            <Suspense fallback={<PageLoadingComponent />}>
              <Signup />
            </Suspense>
          </PublicRoute>
        } />

        {/* Protected Routes - Mobile vs Desktop */}
        <Route path="/" element={
          <ProtectedRoute>
            {shouldUseMobileLayout ? (
              <Suspense fallback={<PageLoadingComponent />}>
                <MobileDashboard />
              </Suspense>
            ) : (
              <Index />
            )}
          </ProtectedRoute>
        } />

        <Route path="/conversations" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Conversas" />
              ) : (
                <Conversations />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/conversations/:id/history" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Conversas" />
              ) : (
                <Conversations />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/ai-config" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="IA Config" />
              ) : (
                <AIConfig />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/pets" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Pets" />
              ) : (
                <Pets />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/pets/new" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Novo Pet" />
              ) : (
                <Pets />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/customers" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Clientes" />
              ) : (
                <Customers />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/customers/new" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Novo Cliente" />
              ) : (
                <Customers />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/clients-pets" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Famílias & Pets" />
              ) : (
                <ClientsPets />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/appointments" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Agendamentos" />
              ) : (
                <Appointments />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/appointments/new" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Novo Agendamento" />
              ) : (
                <Appointments />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/catalog" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Catálogo" />
              ) : (
                <Catalog />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Analytics" />
              ) : (
                <Analytics />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/analytics/history" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Analytics" />
              ) : (
                <Analytics />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              {shouldUseMobileLayout ? (
                <MobilePlaceholder pageName="Configurações" />
              ) : (
                <Settings />
              )}
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/ai-analytics" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              <AIAnalytics />
            </Suspense>
          </ProtectedRoute>
        } />

        {/* Admin Routes (super_admin only) */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              <Admin />
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/admin/organizations" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              <AdminOrganizations />
            </Suspense>
          </ProtectedRoute>
        } />

        <Route path="/admin/tokens" element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingComponent />}>
              <AdminTokens />
            </Suspense>
          </ProtectedRoute>
        } />

        {/* Special mobile routes */}
        <Route path="/menu" element={
          <ProtectedRoute>
            <MobilePlaceholder pageName="Menu" />
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
  const { reportMetrics } = usePerformanceMonitoring();
  const { createSkipToContentLink } = useSkipToContent();

  // Initialize stores and performance monitoring
  React.useEffect(() => {
    // Setup global error handling
    setupGlobalErrorHandling();

    // Initialize stores
    initializeStores().catch(console.error);

    // Report initial performance metrics
    const reportTimer = setTimeout(() => {
      reportMetrics();
    }, 2000);

    return () => clearTimeout(reportTimer);
  }, [reportMetrics]);

  // Add skip to content link
  React.useEffect(() => {
    const skipLink = createSkipToContentLink();
    document.body.prepend(skipLink);

    return () => {
      if (document.body.contains(skipLink)) {
        document.body.removeChild(skipLink);
      }
    };
  }, [createSkipToContentLink]);

  // Monitor Web Vitals
  React.useEffect(() => {
    const interval = setInterval(() => {
      const vitalsScore = performanceMonitor.getWebVitalsScore();
      if (vitalsScore.rating === 'poor') {
        console.warn('Poor Web Vitals score detected:', vitalsScore);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // PWA Installation and Service Worker
  React.useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Handle PWA install prompt
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;

      // Show install button or banner
      const showInstallPromotion = () => {
        // You can show a custom install UI here
        console.log('PWA install prompt available');
      };

      showInstallPromotion();
    });

    // Handle successful PWA installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      deferredPrompt = null;
    });

    // Add viewport meta tags for mobile
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
      document.getElementsByTagName('head')[0].appendChild(meta);
    }

    // Add theme color meta tags
    if (!document.querySelector('meta[name="theme-color"]')) {
      const themeColor = document.createElement('meta');
      themeColor.name = 'theme-color';
      themeColor.content = '#007AFF';
      document.getElementsByTagName('head')[0].appendChild(themeColor);
    }

    // Add Apple touch icon
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = '/images/icons/icon-192x192.png';
      document.getElementsByTagName('head')[0].appendChild(appleIcon);
    }
  }, []);

  return (
    <>
      <PawPrintsBackground />
      <LoadingOverlay isVisible={isAnyLoading()} />
      <BrowserRouter>
        <main id="main-content" role="main">
          <AppRoutes />
        </main>
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