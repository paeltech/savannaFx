"use client";

import React from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Handshake,
  SignalHigh,
  LineChart,
  GraduationCap,
  UserSquare2,
  School,
  BookMarked,
  BarChart3,
  CalendarDays,
  UsersRound,
  MessageSquare,
  Bell,
  Settings,
  UserRound,
  LogOut,
  FileText,
  Menu,
  ExternalLink,
  ShoppingCart,
  Lightbulb,
} from "lucide-react";
import supabase from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useAdmin } from "@/hooks/use-admin";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { useQuery } from "@tanstack/react-query";
import { fetchSignalAccessDetails, accessRemainingLabel, calendarDaysRemaining } from "@shared/utils/signal-payment";
import { isMemberView, MEMBER_APP_HREF } from "@/lib/member-view";

type NavItem = {
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  to: string;
  badge?: string;
  showInBottomNav?: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, to: "/dashboard", showInBottomNav: true },
  { label: "Trade With Savanna", icon: Handshake, to: "/dashboard/trade-with-savanna" },
  { label: "Signals", icon: SignalHigh, to: "/dashboard/signals", showInBottomNav: true },
  { label: "Trade Analysis", shortLabel: "Analysis", icon: FileText, to: "/dashboard/trade-analysis", showInBottomNav: true },
  { label: "Market Analysis", icon: LineChart, to: "/dashboard/market-analysis" },
  { label: "Online Course", shortLabel: "Course", icon: GraduationCap, to: "/dashboard/course", showInBottomNav: true },
  { label: "One on One", icon: UserSquare2, to: "/dashboard/one-on-one" },
  { label: "Academy", icon: School, to: "/dashboard/academy" },
  { label: "Resources", icon: BookMarked, to: "/dashboard/resources", badge: "NEW" },
  { label: "Sentiment Voting", icon: BarChart3, to: "/dashboard/sentiment" },
  { label: "Affiliate Programs", icon: UsersRound, to: "/dashboard/affiliates" },
  { label: "Events", icon: CalendarDays, to: "/dashboard/events" },
  { label: "Collaborations", icon: Handshake, to: "/dashboard/collaborations" },
  { label: "Live Enquiry", shortLabel: "Support", icon: MessageSquare, to: "/dashboard/enquiry", showInBottomNav: true },
];

const adminNavItems: NavItem[] = [
  { label: "Enquiries", shortLabel: "Enquiries", icon: MessageSquare, to: "/admin/enquiries", showInBottomNav: true },
  { label: "Signals", shortLabel: "Signals", icon: SignalHigh, to: "/admin/signals", showInBottomNav: true },
  { label: "Users", shortLabel: "Users", icon: UsersRound, to: "/admin/users", showInBottomNav: true },
  { label: "Events", shortLabel: "Events", icon: CalendarDays, to: "/admin/events", showInBottomNav: true },
  { label: "Trade Analyses", icon: FileText, to: "/admin/trade-analyses" },
  { label: "Purchases", icon: ShoppingCart, to: "/admin/purchases" },
  { label: "Sentiment", icon: BarChart3, to: "/admin/sentiment" },
  { label: "Collaborations", icon: Handshake, to: "/admin/collaborations" },
  { label: "Tips & Quotes", icon: Lightbulb, to: "/admin/tips" },
];

const MemberAppLink: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => (
  <a
    href={MEMBER_APP_HREF}
    target="_blank"
    rel="noopener noreferrer"
    onClick={onNavigate}
    className="flex items-center gap-2 rounded-lg border border-gold/40 px-3 py-2 text-sm text-gold hover:bg-gold/10"
  >
    <ExternalLink size={16} />
    <span>Open member app</span>
  </a>
);

const MembershipBadge: React.FC = () => {
  const { session } = useSupabaseSession();
  const { data: access } = useQuery({
    queryKey: ["signal-access-details", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: () => fetchSignalAccessDetails(supabase, session!.user.id),
  });
  if (!access) return null;
  const endingSoon = access.endDate ? calendarDaysRemaining(access.endDate) <= 3 : false;
  return (
    <Badge className={
      access.active
        ? endingSoon
          ? "border border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
          : "bg-gold text-cursed-black"
        : "border border-steel-wool bg-nero text-rainy-grey"
    }>
      {access.active && access.endDate ? accessRemainingLabel(access.endDate) : access.active ? "Paid member" : "Unpaid"}
    </Badge>
  );
};

const Topbar: React.FC<{ onMenuClick?: () => void; adminShell?: boolean }> = ({ onMenuClick, adminShell }) => {
  const isMobile = useIsMobile();
  const { session } = useSupabaseSession();
  const firstName = session?.user?.user_metadata?.first_name || "Trader";

  return (
    <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 border-b border-steel-wool/40 bg-black/95 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-2 sm:gap-4">
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onMenuClick}
            className="text-gold hover:bg-nero/50 min-w-[44px] min-h-[44px] -ml-2"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </Button>
        )}
        <Link to={adminShell ? "/admin" : "/"} className="flex items-center gap-2">
          <img src="/assets/logo.png" alt="SavannaFX logo" className="h-7 sm:h-8" />
        </Link>
        {!adminShell && (
          <span className="text-rainy-grey text-xs sm:text-base hidden md:inline">
            {isMobile ? "Dashboard" : `Welcome, ${firstName}`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        {!adminShell && <MembershipBadge />}
        <Button 
          variant="outline" 
          className="h-8 sm:h-9 border-steel-wool text-rainy-grey hover:bg-nero hover:text-gold hover:border-gold/40 transition-all duration-200 text-xs px-2 sm:px-3 hidden lg:inline-flex"
        >
          <span className="mr-1.5">Forecast</span>
          <Badge variant="secondary" className="bg-gold text-cursed-black text-[9px] px-1">NEW</Badge>
        </Button>
        
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-rainy-grey hover:text-gold transition-colors duration-200 min-w-[44px] min-h-[44px]"
          >
            <Settings size={18} />
          </Button>
        )}
        
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-rainy-grey hover:text-gold transition-colors duration-200 min-w-[44px] min-h-[44px]"
          >
            <Bell size={isMobile ? 20 : 18} />
          </Button>
          <span className="absolute top-1 right-1 bg-gold text-cursed-black text-[9px] sm:text-[10px] rounded-full px-1 sm:px-1.5 min-w-[16px] sm:min-w-[18px] text-center font-bold">
            2
          </span>
        </div>
        
        {!isMobile && (
          <>
            <Button 
              variant="ghost" 
              className="gap-2 text-rainy-grey hover:text-gold transition-colors duration-200 min-h-[44px] hidden md:inline-flex"
            >
              <UserRound className="opacity-80" size={18} />
              <span className="hidden lg:inline">{firstName}</span>
            </Button>
            <button
              className="p-2 rounded-lg hover:bg-nero/50 text-rainy-grey hover:text-gold transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={async () => {
                await supabase.auth.signOut();
                showSuccess("Signed out");
              }}
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const MobileBottomNav: React.FC<{ items: NavItem[] }> = ({ items }) => {
  const location = useLocation();
  const bottomNavItems = items.filter(item => item.showInBottomNav);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-t border-steel-wool/40 md:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.to ||
            (item.to !== "/dashboard" && item.to !== "/admin" && location.pathname.startsWith(item.to)) ||
            (item.to === "/admin" && location.pathname === "/admin");

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-gold bg-nero/50"
                  : "text-rainy-grey hover:text-gold hover:bg-nero/30"
              }`}
            >
              <Icon
                size={20}
                className={`mb-1 ${
                  isActive ? "scale-110" : ""
                } transition-transform duration-200`}
              />
              <span className="text-[10px] font-semibold">
                {item.shortLabel || item.label}
              </span>
              {item.badge && isActive && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const memberView = isMemberView();
  const adminShell = isAdmin && location.pathname.startsWith("/admin");
  const items = adminShell ? adminNavItems : navItems;

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("view") !== "member") return;
    params.delete("view");
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "" }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  if (!adminLoading && isAdmin && !memberView && location.pathname.startsWith("/dashboard")) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <SidebarProvider 
      className="min-h-screen bg-black text-foreground"
      open={isMobile ? isSidebarOpen : undefined}
      onOpenChange={isMobile ? setIsSidebarOpen : undefined}
    >
      <Sidebar 
        side="left" 
        variant="sidebar" 
        className="bg-black border-r border-steel-wool/40 text-rainy-grey"
        collapsible={isMobile ? "offcanvas" : "icon"}
      >
        <SidebarHeader className="pt-4">
          <SidebarGroup>
            {!adminShell && (
              <SidebarGroupLabel className="text-rainy-grey mb-4 text-xs font-semibold">
                Navigation
              </SidebarGroupLabel>
            )}
            <SidebarContent>
              <SidebarMenu className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.to ||
                    (item.to !== "/dashboard" &&
                      item.to !== "/admin" &&
                      location.pathname.startsWith(item.to));

                  return (
                    <SidebarMenuItem key={item.label}>
                      <Link
                        to={item.to}
                        onClick={() => isMobile && setIsSidebarOpen(false)}
                      >
                        <SidebarMenuButton
                          isActive={isActive}
                          className={`text-rainy-grey hover:text-gold transition-all duration-200 min-h-[44px] ${
                            isActive
                              ? "text-gold bg-nero/80 border-l-2 border-gold"
                              : ""
                          }`}
                        >
                          <Icon size={20} />
                          <span className="font-medium">{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                      {item.badge && (
                        <SidebarMenuBadge className="bg-gold text-cursed-black text-[10px] font-bold">
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
              {adminShell && (
                <div className="px-2 pt-4">
                  <MemberAppLink onNavigate={() => isMobile && setIsSidebarOpen(false)} />
                </div>
              )}
            </SidebarContent>
          </SidebarGroup>
        </SidebarHeader>
      </Sidebar>

      <SidebarInset className="bg-black">
        <Topbar adminShell={adminShell} onMenuClick={() => setIsSidebarOpen(true)} />
        <div className={`px-3 sm:px-6 py-4 sm:py-6 md:py-8 ${isMobile ? "pb-20" : ""}`}>
          {children}
        </div>
        {isMobile && <MobileBottomNav items={items} />}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;