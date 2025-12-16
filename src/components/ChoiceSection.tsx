"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Briefcase, Rocket } from "lucide-react";

const ChoiceSection: React.FC = () => {
  const [selected, setSelected] = useState<"traditional" | "forex">("forex");

  const ListItem = ({ text }: { text: string }) => (
    <div className="flex items-center gap-2 text-gray-300">
      <CheckCircle className="text-green-400" size={18} />
      <span>{text}</span>
    </div>
  );

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-800 rounded-full p-1">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selected === "traditional"
                  ? "bg-[#6c340e] text-white"
                  : "text-[#f4c464] hover:text-white"
              }`}
              onClick={() => setSelected("traditional")}
            >
              Traditional Path
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selected === "forex"
                  ? "bg-[#697452] text-white"
                  : "text-[#f4c464] hover:text-white"
              }`}
              onClick={() => setSelected("forex")}
            >
              SavannaFX Trading Path
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className={`bg-[#14241f] border ${
              selected === "traditional" ? "border-[#6c340e]/60" : "border-[#270f05]/40"
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Briefcase className="text-[#6c340e]" />
                Traditional 9-5 Path
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[#f4c464]/80">
              <ListItem text="40+ years of daily 9-5 grind" />
              <ListItem text="Limited salary growth potential" />
              <ListItem text="Financial stress and uncertainty" />
              <ListItem text="Retirement may not be enough" />
              <ListItem text="Little control over your time" />
              <p className="text-[#f4c464]/70 mt-4 italic">
                "Work for decades and hope for a decent retirement."
              </p>
            </CardContent>
          </Card>

          <Card
            className={`bg-[#14241f] border ${
              selected === "forex" ? "border-[#697452]/60" : "border-[#270f05]/40"
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Rocket className="text-[#697452]" />
                SavannaFX Trading Path
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[#f4c464]/80">
              <ListItem text="Train the predator mindset" />
              <ListItem text="Trade with discipline and patience" />
              <ListItem text="Build multiple income streams" />
              <ListItem text="Reward skill, timing, and awareness" />
              <ListItem text="Thrive with a focused community" />
              <p className="text-[#f4c464]/70 mt-4 italic">
                "Survive and thrive in the savanna—the market."
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Card className="bg-gray-900/60 border-gray-800 max-w-3xl mx-auto">
            <CardContent className="p-6">
              <p className="text-gray-300 mb-4">
                The decision you make today will determine your financial future. Stop settling for average and start building the life you deserve.
              </p>
              <Button className="bg-gradient-to-r from-[#6c340e] to-[#f4c464] text-white font-semibold rounded-full px-6">
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