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
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <img src="/assets/placeholder.svg" alt="SavannaFX" className="w-10 h-10 rounded-md" />
            <h1 className="text-white text-2xl font-semibold">Sign in to SavannaFX</h1>
          </div>
          <p className="text-rainy-grey text-sm mt-3">Access your dashboard and tools</p>
        </div>
        <div className="rounded-xl border border-steel-wool bg-nero p-8 shadow-lg">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#F4C464",
                    brandAccent: "#F4C464",
                    inputBackground: "#262625",
                    inputBorder: "#777674",
                    inputText: "#FFFFFF",
                    inputLabelText: "#A4A4A4",
                    anchorTextColor: "#F4C464",
                    messageText: "#A4A4A4",
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