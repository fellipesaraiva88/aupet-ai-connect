import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Conversations from "./pages/Conversations";
import AIConfig from "./pages/AIConfig";
import Pets from "./pages/Pets";
import Customers from "./pages/Customers";
import Appointments from "./pages/Appointments";
import Catalog from "./pages/Catalog";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/ai-config" element={<AIConfig />} />
          <Route path="/pets" element={<Pets />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
