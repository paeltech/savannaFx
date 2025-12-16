import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import DashboardFeature from "./pages/DashboardFeature";
import TradeWithSavanna from "./pages/TradeWithSavanna";
import Signals from "./pages/Signals";
import CoursePage from "./pages/Course";
import OneOnOne from "./pages/OneOnOne";
import EventsPage from "./pages/Events";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/trade-with-savanna" element={<TradeWithSavanna />} />
          <Route path="/dashboard/signals" element={<Signals />} />
          <Route path="/dashboard/course" element={<CoursePage />} />
          <Route path="/dashboard/one-on-one" element={<OneOnOne />} />
          <Route path="/dashboard/events" element={<EventsPage />} />
          <Route path="/dashboard/:section" element={<DashboardFeature />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;