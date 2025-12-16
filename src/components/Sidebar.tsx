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
  X,
} from "lucide-react";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const navItems = [
  { label: "Home", icon: House, to: "/" },
  { label: "Signals", icon: TrendingUp, to: "/dashboard/signals" },
  { label: "Course", icon: GraduationCap, to: "/dashboard/course" },
  { label: "Mentorship", icon: Users, to: "/dashboard/one-on-one" },
  { label: "Trade With Savanna", icon: Handshake, to: "/dashboard/trade-with-savanna" },
  { label: "Collaborations", icon: Megaphone, to: "/dashboard/collaborations" },
  { label: "Academy", icon: Building, to: "/dashboard/academy" },
  { label: "Booking", icon: Calendar, to: "/dashboard/booking" },
  { label: "Dashboard", icon: ChartColumn, to: "/dashboard" },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-[#270f05]/60 backdrop-blur-sm z-40 transition-opacity ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-[#14241f]/95 backdrop-blur-md border-r border-[#270f05]/50 z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#270f05]/40 flex-shrink-0">
          <Link className="flex items-center space-x-3 group" to="/">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg ring-2 ring-[#f4c464]/30">
              <img src="/assets/placeholder.svg" alt="placeholder" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#6c340e] to-[#f4c464] bg-clip-text text-transparent group-hover:from-[#6c340e]/90 group-hover:to-[#f4c464]/90 transition-all duration-300">
              SavannaFX
            </span>
          </Link>
          <button
            aria-label="Close sidebar"
            className="p-2 hover:bg-[#270f05]/40 rounded-xl transition-all duration-200 hover:scale-105"
            onClick={onClose}
          >
            <X className="text-[#f4c464]/80" size={20} />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-1 mb-8">
              {navItems.map(({ label, icon: Icon, to }) => (
                <Link
                  key={label}
                  to={to}
                  onClick={onClose}
                  className="flex items-center gap-4 py-3 px-4 text-[#f4c464]/80 hover:text-[#f4c464] hover:bg-[#270f05]/30 rounded-xl transition-all duration-200 group w-full text-left"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#14241f] group-hover:bg-[#6c340e] transition-colors duration-200">
                    <Icon className="group-hover:scale-110 transition-transform duration-200" size={18} />
                  </div>
                  <span className="font-medium">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 p-6 border-t border-[#270f05]/40">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-2 border-[#697452] text-[#f4c464] hover:bg-[#270f05]/30 hover:border-[#697452]/80 transition-all duration-200 font-medium"
              >
                Login
              </Button>
              <Link to="/dashboard">
                <Button className="w-full bg-gradient-to-r from-[#6c340e] to-[#f4c464] hover:from-[#6c340e] hover:to-[#f4c464] text-white font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-[#6c340e]/25">
                  GET STARTED
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;