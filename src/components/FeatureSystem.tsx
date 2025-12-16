"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, Trophy } from "lucide-react";

const FeatureSystem: React.FC = () => {
  const items = [
    {
      title: "Proven Strategy",
      desc: "Time-tested approach with consistent results",
      Icon: TrendingUp,
    },
    {
      title: "Risk Management",
      desc: "Protect your capital with smart position sizing",
      Icon: Shield,
    },
    {
      title: "Profit Maximization",
      desc: "Optimize your trades for maximum returns",
      Icon: Trophy,
    },
  ];

  return (
    <section className="bg-transparent py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
            The{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              System
            </span>{" "}
            That Works
          </h2>
          <p className="text-gray-300 max-w-2xl">
            Discover the trading methodology that has transformed thousands of traders worldwide.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {items.map(({ title, desc, Icon }) => (
            <Card key={title} className="bg-gray-900/60 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <Icon className="text-blue-400" />
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSystem;