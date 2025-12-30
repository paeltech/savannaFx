"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import FeatureSystem from "@/components/FeatureSystem";
import ChoiceSection from "@/components/ChoiceSection";
import Roadmap from "@/components/Roadmap";
import BusinessSection from "@/components/BusinessSection";
import FAQ from "@/components/FAQ";
import PageFooter from "@/components/PageFooter";
import LoginForm from "@/components/LoginForm";
import SignupForm from "@/components/SignupForm";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";

const Index: React.FC = () => {
  const { session, loading } = useSupabaseSession();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, loading, navigate]);

  const handleSwitchToSignup = () => {
    setLoginOpen(false);
    setSignupOpen(true);
  };

  const handleSwitchToLogin = () => {
    setSignupOpen(false);
    setForgotPasswordOpen(false);
    setLoginOpen(true);
  };

  const handleSwitchToForgotPassword = () => {
    setLoginOpen(false);
    setForgotPasswordOpen(true);
  };

  // Show loading state or nothing while checking auth
  if (loading) {
    return null;
  }

  // If authenticated, don't render (redirect will happen)
  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <SiteHeader 
        onOpenMenu={() => setMenuOpen(true)}
        onOpenSignup={() => setSignupOpen(true)}
        onOpenLogin={() => setLoginOpen(true)}
      />
      <Sidebar 
        open={menuOpen} 
        onClose={() => setMenuOpen(false)}
        onOpenLogin={() => {
          setMenuOpen(false);
          setLoginOpen(true);
        }}
        onOpenSignup={() => {
          setMenuOpen(false);
          setSignupOpen(true);
        }}
      />

      <main className="pt-14 sm:pt-16">
        <Hero 
          onOpenMenu={() => setMenuOpen(true)}
          onOpenSignup={() => setSignupOpen(true)}
        />
        <FeatureSystem />
        <ChoiceSection onOpenSignup={() => setSignupOpen(true)} />
        <Roadmap onOpenSignup={() => setSignupOpen(true)} />
        <BusinessSection />
        <FAQ />
      </main>

      <PageFooter />
      
      <LoginForm
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSwitchToSignup={handleSwitchToSignup}
        onSwitchToForgotPassword={handleSwitchToForgotPassword}
      />
      <SignupForm
        open={signupOpen}
        onOpenChange={setSignupOpen}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <ForgotPasswordForm
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
};

export default Index;