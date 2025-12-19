"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

type SiteHeaderProps = {
  onOpenMenu: () => void;
};

const SiteHeader: React.FC<SiteHeaderProps> = ({ onOpenMenu }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-black/90 backdrop-blur-md supports-[backdrop-filter]:bg-black/80 border-b border-nero">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <img src="/assets/placeholder.svg" alt="placeholder" className="w-8 h-8 rounded-lg" />
          <span className="font-semibold text-gold text-lg">SavannaFX</span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-rainy-grey font-medium">
          <Link to="/dashboard/signals" className="hover:text-gold transition-colors duration-200">Signals</Link>
          <Link to="/dashboard/course" className="hover:text-gold transition-colors duration-200">Course</Link>
          <Link to="/dashboard/one-on-one" className="hover:text-gold transition-colors duration-200">Mentorship</Link>
          <Link to="/dashboard" className="hover:text-gold transition-colors duration-200">Dashboard</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-rainy-grey hover:text-gold hidden sm:inline-flex">Dashboard</Button>
          </Link>
          <Link to="/dashboard">
            <Button className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black rounded-full px-6 font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300">GET STARTED</Button>
          </Link>
          <button
            className="p-2 rounded-lg hover:bg-nero/50 text-gold md:hidden transition-colors duration-200"
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