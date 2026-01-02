"use client";

import { useState, useEffect } from "react";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import supabase from "@/integrations/supabase/client";

export const useAdmin = () => {
  const { session, loading: sessionLoading } = useSupabaseSession();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (sessionLoading) return;

      if (!session) {
        setIsAdmin(false);
        setLoading(false);
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
          setIsAdmin(hasAdminRole);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [session, sessionLoading]);

  return { isAdmin, loading: loading || sessionLoading };
};
