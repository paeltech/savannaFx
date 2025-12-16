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
                  ? "bg-red-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              onClick={() => setSelected("traditional")}
            >
              Traditional Path
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selected === "forex"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              onClick={() => setSelected("forex")}
            >
              Forex Trading Path
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className={`bg-gray-900/60 border ${
              selected === "traditional" ? "border-red-500/60" : "border-gray-800"
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Briefcase className="text-red-400" />
                Traditional 9-5 Path
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300">
              <ListItem text="40+ years of daily 9-5 grind" />
              <ListItem text="Limited salary growth potential" />
              <ListItem text="Financial stress and uncertainty" />
              <ListItem text="Retirement may not be enough" />
              <ListItem text="No control over your time" />
              <p className="text-gray-400 mt-4 italic">
                "Work for 40 years, hope for a decent retirement"
              </p>
            </CardContent>
          </Card>

          <Card
            className={`bg-gray-900/60 border ${
              selected === "forex" ? "border-blue-500/60" : "border-gray-800"
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Rocket className="text-blue-400" />
                Forex Trading Path
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-gray-300">
              <ListItem text="Learn profitable trading strategies" />
              <ListItem text="Generate income from anywhere" />
              <ListItem text="Build multiple income streams" />
              <ListItem text="Unlimited earning potential" />
              <ListItem text="Join successful trading community" />
              <p className="text-gray-400 mt-4 italic">
                "Master trading skills, create lasting wealth"
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
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-full px-6">
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