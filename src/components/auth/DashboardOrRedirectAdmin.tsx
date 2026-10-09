"use client";

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import Dashboard from "@/pages/Dashboard";
import { isMemberView } from "@/lib/member-view";

/**
 * Admins land on /admin. A tab opened with ?view=member keeps the member dashboard.
 */
const DashboardOrRedirectAdmin: React.FC = () => {
  const { isAdmin, loading } = useAdmin();
  const location = useLocation();
  const memberView = isMemberView();

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

  if (new URLSearchParams(location.search).get("view") === "member") {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAdmin && !memberView) {
    return <Navigate to="/admin" replace />;
  }

  return <Dashboard />;
};

export default DashboardOrRedirectAdmin;
