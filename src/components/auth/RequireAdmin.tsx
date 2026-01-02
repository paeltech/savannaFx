"use client";

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSupabaseSession } from "./SupabaseSessionProvider";
import supabase from "@/integrations/supabase/client";
import { ShieldAlert } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useSupabaseSession();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (loading) return;

      if (!session) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      try {
        // First, try to get the user's role
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking admin status:", error);
          console.error("User ID:", session.user.id);
          setIsAdmin(false);
        } else {
          // Check if user has admin role
          const hasAdminRole = data?.role === "admin";
          console.log("Admin check result:", { 
            userId: session.user.id, 
            role: data?.role, 
            isAdmin: hasAdminRole 
          });
          setIsAdmin(hasAdminRole);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [session, loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rainy-grey">Checking permissions...</p>
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <ShieldAlert className="w-16 h-16 text-gold mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-2">Access Denied</h1>
          <p className="text-rainy-grey mb-6">
            You don't have permission to access this page. Admin access is required.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-2 bg-gold text-cursed-black rounded-lg font-semibold hover:bg-gold-dark transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAdmin;
