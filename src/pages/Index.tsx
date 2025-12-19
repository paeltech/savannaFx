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
import { PageTransition, ScrollReveal } from "@/lib/animations";

const Index: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#14241f]">
        <SiteHeader onOpenMenu={() => setMenuOpen(true)} />
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

        <main className="pt-14">
          <Hero onOpenMenu={() => setMenuOpen(true)} />
          <ScrollReveal>
            <FeatureSystem />
          </ScrollReveal>
          <ScrollReveal>
            <ChoiceSection />
          </ScrollReveal>
          <ScrollReveal>
            <Roadmap />
          </ScrollReveal>
          <ScrollReveal>
            <BusinessSection />
          </ScrollReveal>
          <ScrollReveal>
            <FAQ />
          </ScrollReveal>
        </main>

        <ScrollReveal>
          <PageFooter />
        </ScrollReveal>
      </div>
    </PageTransition>
  );
};

export default Index;