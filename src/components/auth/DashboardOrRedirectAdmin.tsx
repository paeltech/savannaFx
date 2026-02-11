"use client";

import React from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import Dashboard from "@/pages/Dashboard";

/**
 * Renders the user Dashboard, or redirects admins to /admin when they land on /dashboard
 * (e.g. after login or direct URL). Keeps a single redirect rule in one place.
 */
const DashboardOrRedirectAdmin: React.FC = () => {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-rainy-grey">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Dashboard />;
};

export default DashboardOrRedirectAdmin;
