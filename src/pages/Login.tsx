"use client";

import React from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { useNavigate } from "react-router-dom";
import { PageTransition, fadeInUp, scaleIn } from "@/lib/animations";
import { motion } from "framer-motion";

const Login: React.FC = () => {
  const { session } = useSupabaseSession();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#14241f] flex items-center justify-center p-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={scaleIn}
          className="w-full max-w-md"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2"
            >
              <motion.img
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                src="/assets/placeholder.svg"
                alt="SavannaFX"
                className="w-8 h-8 rounded-md"
              />
              <h1 className="text-white text-xl font-semibold">Sign in to SavannaFX</h1>
            </motion.div>
            <p className="text-[#f4c464]/80 text-sm mt-2">Access your dashboard and tools</p>
          </motion.div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ delay: 0.4 }}
            className="rounded-xl border border-[#270f05]/50 bg-[#1a2a23] p-4"
          >
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
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Login;