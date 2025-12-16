"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import FeatureSystem from "@/components/FeatureSystem";
import ChoiceSection from "@/components/ChoiceSection";
import Roadmap from "@/components/Roadmap";
import BusinessSection from "@/components/BusinessSection";
import FAQ from "@/components/FAQ";
import PageFooter from "@/components/PageFooter";

const Index: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <SiteHeader onOpenMenu={() => setMenuOpen(true)} />
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="pt-14">
        <Hero onOpenMenu={() => setMenuOpen(true)} />
        <FeatureSystem />
        <ChoiceSection />
        <Roadmap />
        <BusinessSection />
        <FAQ />
      </main>

      <PageFooter />
    </div>
  );
};

export default Index;