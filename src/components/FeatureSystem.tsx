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
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c340e] to-[#f4c464]">
              System
            </span>{" "}
            That Works
          </h2>
          <p className="text-[#f4c464]/90 max-w-2xl">
            Master the mindset and mechanics that the markets reward: skill, timing, and awareness.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {items.map(({ title, desc, Icon }) => (
            <Card key={title} className="bg-[#14241f] border-[#270f05]/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <Icon className="text-[#f4c464]" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#f4c464]/80">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSystem;