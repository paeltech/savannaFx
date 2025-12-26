"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, Trophy } from "lucide-react";

const FeatureSystem: React.FC = () => {
  const items = [
    {
      title: "Predator Mindset",
      desc: "Develop discipline, patience, and calm execution",
      Icon: Shield,
    },
    {
      title: "Skill & Timing",
      desc: "Learn setups that favor awareness over impulse",
      Icon: TrendingUp,
    },
    {
      title: "Thrive, Not Survive",
      desc: "Scale your edge and maximize results responsibly",
      Icon: Trophy,
    },
  ];

  return (
    <section className="bg-transparent py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            The{" "}
            <span className="text-transparent font-heading bg-clip-text bg-gradient-to-r from-gold-dark to-gold">
              System
            </span>{" "}
            That Works
          </h2>
          <p className="text-base sm:text-lg text-gold max-w-2xl leading-relaxed">
            Master the mindset and mechanics that the markets reward: skill, timing, and awareness.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-10 sm:mt-12 md:mt-16">
          {items.map(({ title, desc, Icon }) => (
            <Card key={title} className="bg-nero hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10 transition-all duration-300">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 sm:gap-3 text-white text-lg sm:text-xl">
                  <Icon className="text-gold flex-shrink-0" size={20} />
                  <span>{title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-rainy-grey leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSystem;