"use client";

import React from "react";
import { Button } from "@/components/ui/button";
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
  { label: "Home", icon: House },
  { label: "Signals", icon: TrendingUp },
  { label: "Course", icon: GraduationCap },
  { label: "Mentorship", icon: Users },
  { label: "Trade With Kojo", icon: Handshake },
  { label: "Collaborations", icon: Megaphone },
  { label: "Academy", icon: Building },
  { label: "Booking", icon: Calendar },
  { label: "Dashboard", icon: ChartColumn },
];

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900/95 backdrop-blur-md border-r border-gray-800/50 z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${open ? "translate-x-0" : "-translate-x-full"}`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50 flex-shrink-0">
          <a className="flex items-center space-x-3 group" href="/">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg ring-2 ring-blue-500/30">
              <img src="/assets/placeholder.svg" alt="placeholder" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-cyan-300 transition-all duration-300">
              KOJOFOREX
            </span>
          </a>
          <button
            aria-label="Close sidebar"
            className="p-2 hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-105"
            onClick={onClose}
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-1 mb-8">
              {navItems.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className="flex items-center gap-4 py-3 px-4 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-xl transition-all duration-200 group w-full text-left"
                  onClick={onClose}
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 group-hover:bg-blue-900 transition-colors duration-200">
                    <Icon className="group-hover:scale-110 transition-transform duration-200" size={18} />
                  </div>
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-shrink-0 p-6 border-t border-gray-800/50">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-2 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-all duration-200 font-medium"
              >
                Login
              </Button>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-blue-500/25">
                GET STARTED
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;