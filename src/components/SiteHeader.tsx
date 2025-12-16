"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

type SiteHeaderProps = {
  onOpenMenu: () => void;
};

const SiteHeader: React.FC<SiteHeaderProps> = ({ onOpenMenu }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src="/assets/placeholder.svg" alt="placeholder" className="w-7 h-7 rounded-lg" />
          <span className="font-semibold text-white">KOJOFOREX</span>
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          <a href="#" className="hover:text-white">Signals</a>
          <a href="#" className="hover:text-white">Course</a>
          <a href="#" className="hover:text-white">Mentorship</a>
          <a href="#" className="hover:text-white">Dashboard</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-gray-300 hidden sm:inline-flex">Dashboard</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">GET STARTED</Button>
          <button
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-300 md:hidden"
            aria-label="Open menu"
            onClick={onOpenMenu}
          >
            <Menu />
          </button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;