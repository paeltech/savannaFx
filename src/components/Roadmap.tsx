"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = [
  { number: 1, title: "Sign up for free", subtitle: "STEP 1" },
  { number: 2, title: "Choose Your Pathway", subtitle: "STEP 2" },
  { number: 3, title: "Subscribe to Plan", subtitle: "STEP 3" },
  { number: 4, title: "Access Community", subtitle: "STEP 4" },
  { number: 5, title: "Start Earning", subtitle: "STEP 5" },
];

const Roadmap: React.FC = () => {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Your Roadmap to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
            Financial Freedom
          </span>
        </h2>
        <p className="text-gray-300 mt-2">
          Follow our proven step-by-step system to transform your financial future
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-10">
          {steps.map((s) => (
            <Card key={s.number} className="bg-gray-900/60 border-gray-800">
              <CardHeader className="pb-2">
                <div className="text-4xl font-extrabold text-orange-400">{s.number}</div>
                <CardTitle className="text-white text-lg">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs tracking-widest text-gray-400">{s.subtitle}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full px-6">
            START YOUR JOURNEY
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;