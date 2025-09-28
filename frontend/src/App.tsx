import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { ToastContainer } from "@/components/ui/enhanced-toast";
import { useLoading } from "@/contexts/LoadingContext";
import { useEnhancedToast, setGlobalToastInstance } from "@/hooks/useEnhancedToast";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Conversations from "./pages/Conversations";
import AIConfig from "./pages/AIConfig";
import Pets from "./pages/Pets";
import Customers from "./pages/Customers";
import Appointments from "./pages/Appointments";
import Catalog from "./pages/Catalog";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAnyLoading } = useLoading();
  const toastInstance = useEnhancedToast();

  React.useEffect(() => {
    setGlobalToastInstance(toastInstance);
  }, [toastInstance]);

  return (
    <>
      <LoadingOverlay isVisible={isAnyLoading()} />
      <ToastContainer toasts={toastInstance.toasts} />
      <BrowserRouter>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/signup" element={<Signup />} />

            {/* Rotas protegidas */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/conversations" element={<Conversations />} />
                  <Route path="/conversations/:id/history" element={<Conversations />} />
                  <Route path="/ai-config" element={<AIConfig />} />
                  <Route path="/pets" element={<Pets />} />
                  <Route path="/pets/new" element={<Pets />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/new" element={<Customers />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/appointments/new" element={<Appointments />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/analytics/history" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LoadingProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </LoadingProvider>
  </QueryClientProvider>
);

export default App;
