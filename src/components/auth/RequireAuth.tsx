"use client";

import React from "react";
import { Navigate } from "react-router-dom";
import { useSupabaseSession } from "./SupabaseSessionProvider";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  try {
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
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    // Fallback if provider is not available
    console.error("RequireAuth error:", error);
    return <Navigate to="/" replace />;
  }
};

export default RequireAuth;