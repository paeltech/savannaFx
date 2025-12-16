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
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ComponentType<any>;
  to: string;
  badge?: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Trade With Savanna", icon: Handshake, to: "/dashboard/trade-with-savanna" },
  { label: "Signals", icon: SignalHigh, to: "/dashboard/signals" },
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
    <div className="flex h-14 items-center justify-between px-4 border-b border-slate-800 bg-slate-900/70 backdrop-blur">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/assets/placeholder.svg" alt="SavannaFX" className="w-7 h-7 rounded-md" />
          <span className="font-semibold text-[#f4c464]">SavannaFX</span>
        </Link>
        <span className="text-slate-300/80">Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" className="h-8 border-slate-700 text-slate-200 hover:bg-slate-800">
          <span className="mr-2">Forecast</span>
          <Badge variant="secondary" className="bg-red-600 text-white">NEW</Badge>
        </Button>
        <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
          <Settings />
        </Button>
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
            <Bell />
          </Button>
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5">2</span>
        </div>
        <Button variant="ghost" className="gap-2 text-slate-200 hover:text-white">
          <UserRound className="opacity-80" />
          <span className="hidden sm:inline">Trader</span>
        </Button>
      </div>
    </div>
  );
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <SidebarProvider className="min-h-screen bg-slate-950 text-slate-200">
      <Sidebar side="left" variant="sidebar">
        <SidebarHeader className="pt-3">
          <SidebarGroup>
            <SidebarGroupLabel className="text-slate-400">Navigation</SidebarGroupLabel>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to || (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
                  return (
                    <SidebarMenuItem key={item.label}>
                      <Link to={item.to}>
                        <SidebarMenuButton isActive={isActive} className="text-slate-300 hover:text-white">
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                      {item.badge && (
                        <SidebarMenuBadge className="bg-red-600 text-white">{item.badge}</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>
          </SidebarGroup>
        </SidebarHeader>
      </Sidebar>

      <SidebarInset>
        <Topbar />
        <div className="px-6 py-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;