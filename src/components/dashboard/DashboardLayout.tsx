"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
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
  Shield,
} from "lucide-react";
import supabase from "@/integrations/supabase/client";
import { showSuccess } from "@/utils/toast";
import { useAdmin } from "@/hooks/use-admin";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  to: string;
  badge?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Trade With Savanna", icon: Handshake, to: "/dashboard/trade-with-savanna" },
  { label: "Signals", icon: SignalHigh, to: "/dashboard/signals" },
  { label: "Trade Analysis", icon: FileText, to: "/dashboard/trade-analysis" },
  { label: "Market Analysis", icon: LineChart, to: "/dashboard/market-analysis" },
  { label: "Online Course", icon: GraduationCap, to: "/dashboard/course" },
  { label: "One on One", icon: UserSquare2, to: "/dashboard/one-on-one" },
  { label: "Academy", icon: School, to: "/dashboard/academy" },
  { label: "Resources", icon: BookMarked, to: "/dashboard/resources", badge: "NEW" },
  { label: "Sentiment Voting", icon: BarChart3, to: "/dashboard/sentiment" },
  { label: "Affiliate Programs", icon: UsersRound, to: "/dashboard/affiliates" },
  { label: "Events", icon: CalendarDays, to: "/dashboard/events" },
  { label: "Collaborations", icon: Handshake, to: "/dashboard/collaborations" },
  { label: "Live Enquiry", icon: MessageSquare, to: "/dashboard/enquiry" },
];

const Topbar: React.FC = () => {
  return (
    <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6 border-b border-steel-wool bg-black/90 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/assets/logo.png" alt="SavannaFX logo" className="h-6 sm:h-8" />
        </Link>
        <span className="text-rainy-grey text-sm sm:text-base hidden sm:inline">Dashboard</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="outline" className="h-9 border-steel-wool text-rainy-grey hover:bg-nero hover:text-gold hover:border-gold/40 transition-all duration-200 text-xs sm:text-sm hidden sm:inline-flex">
          <span className="mr-2">Forecast</span>
          <Badge variant="secondary" className="bg-gold text-cursed-black text-[10px]">NEW</Badge>
        </Button>
        <Button variant="ghost" size="icon" className="text-rainy-grey hover:text-gold transition-colors duration-200 min-w-[44px] min-h-[44px]">
          <Settings size={18} />
        </Button>
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-rainy-grey hover:text-gold transition-colors duration-200 min-w-[44px] min-h-[44px]">
            <Bell size={18} />
          </Button>
          <span className="absolute -top-1 -right-1 bg-gold text-cursed-black text-[10px] rounded-full px-1.5 min-w-[18px] text-center">2</span>
        </div>
        <Button variant="ghost" className="gap-2 text-rainy-grey hover:text-gold transition-colors duration-200 min-h-[44px] hidden md:inline-flex">
          <UserRound className="opacity-80" size={18} />
          <span className="hidden lg:inline">Trader</span>
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
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isAdmin } = useAdmin();

  return (
    <SidebarProvider className="min-h-screen bg-black text-foreground">
      <Sidebar side="left" variant="sidebar" className="bg-black border-r border-steel-wool text-rainy-grey">
        <SidebarHeader className="pt-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-rainy-grey mb-4">Navigation</SidebarGroupLabel>
            <SidebarContent>
              <SidebarMenu className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
                  return (
                    <SidebarMenuItem key={item.label}>
                      <Link to={item.to}>
                        <SidebarMenuButton 
                          isActive={isActive} 
                          className={`text-rainy-grey hover:text-gold transition-colors duration-200 ${
                            isActive ? "text-gold bg-nero" : ""
                          }`}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                      {item.badge && (
                        <SidebarMenuBadge className="bg-gold text-cursed-black">{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
                {isAdmin && (
                  <SidebarMenuItem>
                    <Link to="/admin">
                      <SidebarMenuButton 
                        isActive={location.pathname.startsWith("/admin")} 
                        className={`text-rainy-grey hover:text-gold transition-colors duration-200 ${
                          location.pathname.startsWith("/admin") ? "text-gold bg-nero" : ""
                        }`}
                      >
                        <Shield />
                        <span>Admin Dashboard</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarContent>
          </SidebarGroup>
        </SidebarHeader>
      </Sidebar>

      <SidebarInset className="bg-black">
        <Topbar />
        <div className="px-4 sm:px-6 py-4 sm:py-6 md:py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;