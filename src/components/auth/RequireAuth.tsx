"use client";

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSupabaseSession } from "./SupabaseSessionProvider";
import { useIsMobile } from "@/hooks/use-mobile";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { session, loading } = useSupabaseSession();

  if (loading) {
    // Show a loading state instead of null
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rainy-grey">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    // Store the intended destination for redirect after login
    if (location.pathname !== "/login" && location.pathname !== "/") {
      sessionStorage.setItem("redirectAfterLogin", location.pathname);
    }
    
    // Redirect to login page on mobile, home page on desktop
    if (isMobile) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;