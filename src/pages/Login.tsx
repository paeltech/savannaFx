"use client";

import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-[#14241f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <img src="/assets/placeholder.svg" alt="SavannaFX" className="w-8 h-8 rounded-md" />
            <h1 className="text-white text-xl font-semibold">Sign in to SavannaFX</h1>
          </div>
          <p className="text-[#f4c464]/80 text-sm mt-2">Access your dashboard and tools</p>
        </div>
        <div className="rounded-xl border border-[#270f05]/50 bg-[#1a2a23] p-4">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#6c340e",
                    brandAccent: "#f4c464",
                    inputBackground: "#0f1d18",
                    inputBorder: "#270f05",
                  },
                },
              },
            }}
            theme="dark"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;