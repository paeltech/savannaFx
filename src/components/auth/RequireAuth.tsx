"use client";

import React from "react";
import { Navigate } from "react-router-dom";
import { useSupabaseSession } from "./SupabaseSessionProvider";

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useSupabaseSession();

  if (loading) {
    // Optional: show a spinner; keeping it simple for now
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;