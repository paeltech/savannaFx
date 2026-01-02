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
import ResetPassword from "./pages/ResetPassword";
import TradeAnalysis from "./pages/TradeAnalysis";
import Login from "./pages/Login";
import SupabaseSessionProvider from "@/components/auth/SupabaseSessionProvider";
import RequireAuth from "@/components/auth/RequireAuth";
import RequireAdmin from "@/components/auth/RequireAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEnquiries from "./pages/admin/AdminEnquiries";
import AdminCollaborations from "./pages/admin/AdminCollaborations";
import AdminTradeAnalyses from "./pages/admin/AdminTradeAnalyses";
import AdminPurchases from "./pages/admin/AdminPurchases";
import AdminSentiment from "./pages/admin/AdminSentiment";
import AdminUsers from "./pages/admin/AdminUsers";
import DebugAdmin from "./pages/DebugAdmin";

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
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
            <Route path="/dashboard/trade-analysis" element={<RequireAuth><TradeAnalysis /></RequireAuth>} />
            <Route path="/dashboard/:section" element={<RequireAuth><DashboardFeature /></RequireAuth>} />
            {/* Admin Routes */}
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="/admin/enquiries" element={<RequireAdmin><AdminEnquiries /></RequireAdmin>} />
            <Route path="/admin/collaborations" element={<RequireAdmin><AdminCollaborations /></RequireAdmin>} />
            <Route path="/admin/trade-analyses" element={<RequireAdmin><AdminTradeAnalyses /></RequireAdmin>} />
            <Route path="/admin/purchases" element={<RequireAdmin><AdminPurchases /></RequireAdmin>} />
            <Route path="/admin/sentiment" element={<RequireAdmin><AdminSentiment /></RequireAdmin>} />
            <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
            <Route path="/debug-admin" element={<RequireAuth><DebugAdmin /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SupabaseSessionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;