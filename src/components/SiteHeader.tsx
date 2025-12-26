"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";

type SiteHeaderProps = {
  onOpenMenu: () => void;
  onOpenSignup?: () => void;
  onOpenLogin?: () => void;
};

const SiteHeader: React.FC<SiteHeaderProps> = ({ onOpenMenu, onOpenSignup, onOpenLogin }) => {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();

  const handleProtectedNav = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (session) {
      navigate(path);
    } else {
      // Store the intended destination and open login modal
      sessionStorage.setItem("redirectAfterLogin", path);
      onOpenLogin?.();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-black/90 backdrop-blur-md supports-[backdrop-filter]:bg-black/80 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 sm:gap-3">
          <img src="/assets/logo.png" alt="SavannaFX logo" className="w-24 sm:w-28 md:w-32 rounded-lg" />
        </a>
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-rainy-grey font-medium">
          <a
            href="/dashboard/signals"
            onClick={(e) => handleProtectedNav("/dashboard/signals", e)}
            className="hover:text-gold transition-colors duration-200 cursor-pointer py-2"
          >
            Signals
          </a>
          <a
            href="/dashboard/course"
            onClick={(e) => handleProtectedNav("/dashboard/course", e)}
            className="hover:text-gold transition-colors duration-200 cursor-pointer py-2"
          >
            Course
          </a>
          <a
            href="/dashboard/one-on-one"
            onClick={(e) => handleProtectedNav("/dashboard/one-on-one", e)}
            className="hover:text-gold transition-colors duration-200 cursor-pointer py-2"
          >
            Mentorship
          </a>
          {session && (
            <Link to="/dashboard" className="hover:text-gold transition-colors duration-200 py-2">
              Dashboard
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          {session ? (
            <Link to="/dashboard">
              <Button variant="ghost" className="text-rainy-grey hover:text-gold hidden sm:inline-flex min-h-[44px]">Dashboard</Button>
            </Link>
          ) : (
            onOpenSignup && (
              <Button 
                onClick={onOpenSignup}
                className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black rounded-full px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 min-h-[44px]"
              >
                <span className="hidden xs:inline">GET STARTED</span>
                <span className="xs:hidden">START</span>
              </Button>
            )
          )}
          <button
            className="p-2.5 sm:p-3 rounded-lg hover:bg-nero/50 text-gold md:hidden transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open menu"
            onClick={onOpenMenu}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;