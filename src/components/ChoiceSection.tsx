"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Briefcase, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HoverScale, fadeInUp, scaleIn } from "@/lib/animations";

const ChoiceSection: React.FC = () => {
  const [selected, setSelected] = useState<"traditional" | "forex">("forex");

  const ListItem = ({ text }: { text: string }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 text-gray-200 leading-relaxed"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
      >
        <CheckCircle className="text-green-400" size={18} />
      </motion.div>
      <span>{text}</span>
    </motion.div>
  );

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex bg-gray-800 rounded-full p-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selected === "traditional"
                  ? "bg-[#6c340e] text-white"
                  : "text-[#f4c464] hover:text-white"
              }`}
              onClick={() => setSelected("traditional")}
            >
              Traditional Path
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selected === "forex"
                  ? "bg-[#697452] text-white"
                  : "text-[#f4c464] hover:text-white"
              }`}
              onClick={() => setSelected("forex")}
            >
              SavannaFX Trading Path
            </motion.button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected === "traditional" ? "traditional" : "forex"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <HoverScale>
                <Card
                  className={`border transition-all duration-300 ${
                    selected === "traditional" 
                      ? "bg-[#1a2d28] border-[#6c340e]/60" 
                      : "bg-[#14241f] border-[#270f05]/40"
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <motion.div
                        animate={{ rotate: selected === "traditional" ? 0 : 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Briefcase className="text-[#6c340e]" />
                      </motion.div>
                      Traditional 9-5 Path
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-[#f4c464]">
                    <ListItem text="40+ years of daily 9-5 grind" />
                    <ListItem text="Limited salary growth potential" />
                    <ListItem text="Financial stress and uncertainty" />
                    <ListItem text="Retirement may not be enough" />
                    <ListItem text="Little control over your time" />
                    <p className="text-[#f4c464] mt-5 italic leading-relaxed opacity-90">
                      "Work for decades and hope for a decent retirement."
                    </p>
                  </CardContent>
                </Card>
              </HoverScale>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={selected === "forex" ? "forex" : "traditional"}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <HoverScale>
                <Card
                  className={`border transition-all duration-300 ${
                    selected === "forex" 
                      ? "bg-[#1f352f] border-[#697452]/60" 
                      : "bg-[#14241f] border-[#270f05]/40"
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <motion.div
                        animate={{ rotate: selected === "forex" ? 0 : 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Rocket className="text-[#697452]" />
                      </motion.div>
                      SavannaFX Trading Path
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-[#f4c464]">
                    <ListItem text="Train the predator mindset" />
                    <ListItem text="Trade with discipline and patience" />
                    <ListItem text="Build multiple income streams" />
                    <ListItem text="Reward skill, timing, and awareness" />
                    <ListItem text="Thrive with a focused community" />
                    <p className="text-[#f4c464] mt-5 italic leading-relaxed opacity-90">
                      "Survive and thrive in the savanna—the market."
                    </p>
                  </CardContent>
                </Card>
              </HoverScale>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={scaleIn}
          className="mt-8 text-center"
        >
          <HoverScale>
            <Card className="bg-gray-900/60 border-gray-800 max-w-3xl mx-auto">
              <CardContent className="p-6">
                <p className="text-gray-200 mb-5 leading-relaxed text-lg">
                  The decision you make today will determine your financial future. Stop settling for average and start building the life you deserve.
                </p>
                <Button className="bg-gradient-to-r from-[#6c340e] to-[#f4c464] text-white font-semibold rounded-full px-6">
                  Choose Financial Freedom
                </Button>
              </CardContent>
            </Card>
          </HoverScale>
        </motion.div>
      </div>
    </section>
  );
};

export default ChoiceSection;