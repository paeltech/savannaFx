"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  House,
  TrendingUp,
  GraduationCap,
  Users,
  Handshake,
  Megaphone,
  Building,
  Calendar,
  ChartColumn,
  FileText,
  X,
} from "lucide-react";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  onOpenLogin?: () => void;
  onOpenSignup?: () => void;
};

const navItems = [
  { label: "Home", icon: House, to: "/" },
  { label: "Signals", icon: TrendingUp, to: "/dashboard/signals" },
  { label: "Analysis", icon: FileText, to: "/dashboard/trade-analysis" },
  { label: "Course", icon: GraduationCap, to: "/dashboard/course" },
  { label: "Mentorship", icon: Users, to: "/dashboard/one-on-one" },
  { label: "Trade With Savanna", icon: Handshake, to: "/dashboard/trade-with-savanna" },
  { label: "Collaborations", icon: Megaphone, to: "/dashboard/collaborations" },
  { label: "Academy", icon: Building, to: "/dashboard/academy" },
  { label: "Booking", icon: Calendar, to: "/dashboard/booking" },
  { label: "Dashboard", icon: ChartColumn, to: "/dashboard" },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose, onOpenLogin, onOpenSignup }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-[85vw] sm:w-80 max-w-sm bg-black/95 backdrop-blur-md border-r border-steel-wool z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-steel-wool flex-shrink-0">
          <Link className="flex items-center space-x-2 sm:space-x-3 group" to="/">
            <img src="/assets/logo.png" alt="SavannaFX logo" className="h-6 sm:h-8" />
          </Link>
          <button
            aria-label="Close sidebar"
            className="p-2 hover:bg-nero/50 rounded-xl transition-all duration-200 hover:scale-105 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={onClose}
          >
            <X className="text-gold/80 hover:text-gold" size={20} />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="space-y-2 mb-6 sm:mb-8">
              {navItems.map(({ label, icon: Icon, to }) => (
                <Link
                  key={label}
                  to={to}
                  onClick={onClose}
                  className="flex items-center gap-3 sm:gap-4 py-3 px-3 sm:px-4 text-rainy-grey hover:text-gold hover:bg-nero/50 rounded-xl transition-all duration-200 group w-full text-left min-h-[44px]"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-nero group-hover:bg-gold transition-colors duration-200 flex-shrink-0">
                    <Icon className="group-hover:scale-110 transition-transform duration-200 text-rainy-grey group-hover:text-cursed-black" size={18} />
                  </div>
                  <span className="font-medium text-sm sm:text-base">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 p-4 sm:p-6 border-t border-steel-wool">
            <div className="space-y-3">
              {onOpenLogin && (
                <Button
                  onClick={onOpenLogin}
                  variant="outline"
                  className="w-full border-2 border-steel-wool text-rainy-grey hover:bg-nero/50 hover:border-gold/40 hover:text-gold transition-all duration-200 font-medium min-h-[44px] text-sm sm:text-base"
                >
                  Login
                </Button>
              )}
              {onOpenSignup && (
                <Button 
                  onClick={onOpenSignup}
                  className="w-full bg-gradient-to-r from-gold-dark to-gold text-cursed-black font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-gold/20 min-h-[44px] text-sm sm:text-base"
                >
                  GET STARTED
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;