"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Briefcase, Rocket } from "lucide-react";

const ChoiceSection: React.FC = () => {
  const [selected, setSelected] = useState<"traditional" | "forex">("forex");

  const ListItem = ({ text }: { text: string }) => (
    <div className="flex items-center gap-3 leading-relaxed">
      <CheckCircle className="text-gold" size={18} />
      <span className="text-rainy-grey">{text}</span>
    </div>
  );

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-nero rounded-full p-1 border border-steel-wool">
            <button
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selected === "traditional"
                  ? "bg-gold text-cursed-black shadow-lg shadow-gold/20"
                  : "text-rainy-grey hover:text-gold"
              }`}
              onClick={() => setSelected("traditional")}
            >
              Traditional Path
            </button>
            <button
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selected === "forex"
                  ? "bg-gold text-cursed-black shadow-lg shadow-gold/20"
                  : "text-rainy-grey hover:text-gold"
              }`}
              onClick={() => setSelected("forex")}
            >
              SavannaFX Trading Path
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card
            className={`bg-nero transition-all duration-300 ${
              selected === "traditional" ? "hover:border hover:border-gold/40 shadow-lg shadow-gold/10" : "hover:border hover:border-steel-wool"
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Briefcase className="text-gold" size={20} />
                Traditional 9-5 Path
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ListItem text="40+ years of daily 9-5 grind" />
              <ListItem text="Limited salary growth potential" />
              <ListItem text="Financial stress and uncertainty" />
              <ListItem text="Retirement may not be enough" />
              <ListItem text="Little control over your time" />
              <p className="text-gold mt-6 italic leading-relaxed opacity-90">
                "Work for decades and hope for a decent retirement."
              </p>
            </CardContent>
          </Card>

          <Card
            className={`bg-nero transition-all duration-300 ${
              selected === "forex" ? "hover:border hover:border-gold/40 shadow-lg shadow-gold/10" : "hover:border hover:border-steel-wool"
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Rocket className="text-gold" size={20} />
                SavannaFX Trading Path
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ListItem text="Train the predator mindset" />
              <ListItem text="Trade with discipline and patience" />
              <ListItem text="Build multiple income streams" />
              <ListItem text="Reward skill, timing, and awareness" />
              <ListItem text="Thrive with a focused community" />
              <p className="text-gold mt-6 italic leading-relaxed opacity-90">
                "Survive and thrive in the savanna—the market."
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-nero hover:border hover:border-steel-wool max-w-3xl mx-auto">
            <CardContent className="p-8">
              <p className="text-rainy-grey mb-6 leading-relaxed text-lg">
                The decision you make today will determine your financial future. Stop settling for average and start building the life you deserve.
              </p>
              <Button className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black font-semibold rounded-full px-8 py-6 hover:shadow-lg hover:shadow-gold/20 transition-all duration-300">
                Choose Financial Freedom
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ChoiceSection;