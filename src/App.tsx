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
import Sentiment from "./pages/Sentiment";
import Enquiry from "./pages/Enquiry";
import LotSize from "./pages/LotSize";
import Collaborations from "./pages/Collaborations";
import SupabaseSessionProvider from "@/components/auth/SupabaseSessionProvider";
import RequireAuth from "@/components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SupabaseSessionProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/dashboard/trade-with-savanna" element={<RequireAuth><TradeWithSavanna /></RequireAuth>} />
            <Route path="/dashboard/signals" element={<RequireAuth><Signals /></RequireAuth>} />
            <Route path="/dashboard/course" element={<RequireAuth><CoursePage /></RequireAuth>} />
            <Route path="/dashboard/one-on-one" element={<RequireAuth><OneOnOne /></RequireAuth>} />
            <Route path="/dashboard/events" element={<RequireAuth><EventsPage /></RequireAuth>} />
            <Route path="/dashboard/sentiment" element={<RequireAuth><Sentiment /></RequireAuth>} />
            <Route path="/dashboard/enquiry" element={<RequireAuth><Enquiry /></RequireAuth>} />
            <Route path="/dashboard/lot-size" element={<RequireAuth><LotSize /></RequireAuth>} />
            <Route path="/dashboard/collaborations" element={<RequireAuth><Collaborations /></RequireAuth>} />
            <Route path="/dashboard/:section" element={<RequireAuth><DashboardFeature /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SupabaseSessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;