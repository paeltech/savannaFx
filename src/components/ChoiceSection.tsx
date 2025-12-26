"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Briefcase, Rocket } from "lucide-react";

interface ChoiceSectionProps {
  onOpenSignup?: () => void;
}

const ChoiceSection: React.FC<ChoiceSectionProps> = ({ onOpenSignup }) => {
  const [selected, setSelected] = useState<"traditional" | "forex">("forex");

  const ListItem = ({ text }: { text: string }) => (
    <div className="flex items-start sm:items-center gap-2 sm:gap-3 leading-relaxed">
      <CheckCircle className="text-gold flex-shrink-0 mt-0.5 sm:mt-0" size={16} />
      <span className="text-rainy-grey text-sm sm:text-base">{text}</span>
    </div>
  );

  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="inline-flex bg-nero rounded-full p-1 border border-steel-wool flex-wrap justify-center gap-1 sm:gap-0">
            <button
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 min-h-[44px] ${
                selected === "traditional"
                  ? "bg-gold text-cursed-black shadow-lg shadow-gold/20"
                  : "text-rainy-grey hover:text-gold"
              }`}
              onClick={() => setSelected("traditional")}
            >
              <span className="hidden sm:inline">Traditional Path</span>
              <span className="sm:hidden">Traditional</span>
            </button>
            <button
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 min-h-[44px] ${
                selected === "forex"
                  ? "bg-gold text-cursed-black shadow-lg shadow-gold/20"
                  : "text-rainy-grey hover:text-gold"
              }`}
              onClick={() => setSelected("forex")}
            >
              <span className="hidden sm:inline">SavannaFX Trading Path</span>
              <span className="sm:hidden">SavannaFX</span>
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
          <Card
            className={`bg-nero transition-all duration-300 ${
              selected === "traditional" ? "hover:border hover:border-gold/40 shadow-lg shadow-gold/10" : "hover:border hover:border-steel-wool"
            }`}
          >
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-white text-lg sm:text-xl">
                <Briefcase className="text-gold flex-shrink-0" size={18} />
                <span>Traditional 9-5 Path</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <ListItem text="40+ years of daily 9-5 grind" />
              <ListItem text="Limited salary growth potential" />
              <ListItem text="Financial stress and uncertainty" />
              <ListItem text="Retirement may not be enough" />
              <ListItem text="Little control over your time" />
              <p className="text-gold mt-4 sm:mt-6 italic leading-relaxed opacity-90 text-sm sm:text-base">
                "Work for decades and hope for a decent retirement."
              </p>
            </CardContent>
          </Card>

          <Card
            className={`bg-nero transition-all duration-300 ${
              selected === "forex" ? "hover:border hover:border-gold/40 shadow-lg shadow-gold/10" : "hover:border hover:border-steel-wool"
            }`}
          >
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-white text-lg sm:text-xl">
                <Rocket className="text-gold flex-shrink-0" size={18} />
                <span>SavannaFX Trading Path</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <ListItem text="Train the predator mindset" />
              <ListItem text="Trade with discipline and patience" />
              <ListItem text="Build multiple income streams" />
              <ListItem text="Reward skill, timing, and awareness" />
              <ListItem text="Thrive with a focused community" />
              <p className="text-gold mt-4 sm:mt-6 italic leading-relaxed opacity-90 text-sm sm:text-base">
                "Survive and thrive in the savanna—the market."
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <Card className="bg-nero hover:border hover:border-steel-wool max-w-3xl mx-auto">
            <CardContent className="p-6 sm:p-8">
              <p className="text-rainy-grey mb-4 sm:mb-6 leading-relaxed text-base sm:text-lg">
                The decision you make today will determine your financial future. Stop settling for average and start building the life you deserve.
              </p>
              <Button
                className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black font-semibold rounded-full px-6 sm:px-8 py-5 sm:py-6 hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 min-h-[56px] text-sm sm:text-base w-full sm:w-auto"
                onClick={() => onOpenSignup?.()}
              >
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