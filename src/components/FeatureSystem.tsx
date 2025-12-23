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
    <section className="bg-transparent py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
            The{" "}
            <span className="text-transparent font-heading bg-clip-text bg-gradient-to-r from-gold-dark to-gold">
              System
            </span>{" "}
            That Works
          </h2>
          <p className="text-gold max-w-2xl leading-relaxed">
            Master the mindset and mechanics that the markets reward: skill, timing, and awareness.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {items.map(({ title, desc, Icon }) => (
            <Card key={title} className="bg-nero hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <Icon className="text-gold" size={24} />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-rainy-grey leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSystem;