"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

type SiteHeaderProps = {
  onOpenMenu: () => void;
};

const SiteHeader: React.FC<SiteHeaderProps> = ({ onOpenMenu }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-[#14241f]/80 backdrop-blur supports-[backdrop-filter]:bg-[#14241f]/70 border-b border-[#270f05]">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src="/assets/placeholder.svg" alt="placeholder" className="w-7 h-7 rounded-lg" />
          <span className="font-semibold text-[#f4c464]">SavannaFX</span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm text-[#f4c464]/80">
          <a href="#" className="hover:text-[#f4c464]">Signals</a>
          <a href="#" className="hover:text-[#f4c464]">Course</a>
          <a href="#" className="hover:text-[#f4c464]">Mentorship</a>
          <a href="#" className="hover:text-[#f4c464]">Dashboard</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-[#f4c464] hidden sm:inline-flex">Dashboard</Button>
          <Button className="bg-gradient-to-r from-[#6c340e] to-[#f4c464] text-white rounded-full">GET STARTED</Button>
          <button
            className="p-2 rounded-lg hover:bg-[#270f05]/40 text-[#f4c464] md:hidden"
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