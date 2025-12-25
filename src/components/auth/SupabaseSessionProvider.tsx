"use client";

import React from "react";
import { Session } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from "@/integrations/supabase/client";

type SessionContextValue = {
  session: Session | null;
  loading: boolean;
};

const SessionContext = React.createContext<SessionContextValue>({
  session: null,
  loading: true,
});

const SupabaseSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      // If already signed in and on landing page, redirect to dashboard
      if (data.session && location.pathname === "/") {
        navigate("/dashboard", { replace: true });
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession || null);
      if (event === "SIGNED_IN") {
        // Check if there's a redirect path stored
        const redirectPath = sessionStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          sessionStorage.removeItem("redirectAfterLogin");
          navigate(redirectPath, { replace: true });
        } else if (location.pathname === "/") {
          navigate("/dashboard", { replace: true });
        }
      } else if (event === "SIGNED_OUT") {
        // Redirect to landing page when signed out
        navigate("/", { replace: true });
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
  return ctx;
};

export default SupabaseSessionProvider;