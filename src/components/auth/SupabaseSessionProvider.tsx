"use client";

import React from "react";
import { Session } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from "@/integrations/supabase/client";

type SessionContextValue = {
  session: Session | null;
  loading: boolean;
};

const SessionContext = React.createContext<SessionContextValue | undefined>(undefined);

const SupabaseSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      // If already signed in and on /login, go home
      if (data.session && location.pathname === "/login") {
        navigate("/", { replace: true });
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession || null);
      if (event === "SIGNED_IN") {
        navigate("/", { replace: true });
      } else if (event === "SIGNED_OUT") {
        navigate("/login", { replace: true });
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSupabaseSession = () => {
  const ctx = React.useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSupabaseSession must be used within SupabaseSessionProvider");
  }
  return ctx;
};

export default SupabaseSessionProvider;