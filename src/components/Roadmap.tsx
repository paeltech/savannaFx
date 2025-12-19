"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = [
  { number: 1, title: "Sign Up Free", subtitle: "STEP 1" },
  { number: 2, title: "Learn Predator Mindset", subtitle: "STEP 2" },
  { number: 3, title: "Choose Your Pathway", subtitle: "STEP 3" },
  { number: 4, title: "Join the Savanna Tribe", subtitle: "STEP 4" },
  { number: 5, title: "Trade with Patience", subtitle: "STEP 5" },
];

const Roadmap: React.FC = () => {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
          Your Roadmap to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-dark to-gold">
            Survival
          </span>
        </h2>
        <p className="text-gold mt-6 text-lg leading-relaxed">
          Follow a disciplined, step-by-step path to survive and thrive in the markets.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-16">
          {steps.map((s) => (
            <Card key={s.number} className="bg-nero hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10">
              <CardHeader className="pb-4">
                <div className="text-4xl font-extrabold text-gold mb-2">{s.number}</div>
                <CardTitle className="text-white text-lg">{s.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs tracking-widest text-rainy-grey opacity-80">{s.subtitle}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12">
          <Button className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black rounded-full px-8 py-6 font-semibold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300">
            START YOUR TRAINING
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;