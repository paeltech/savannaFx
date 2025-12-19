"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, Trophy } from "lucide-react";
import { StaggerChildren, HoverLift, fadeInUp, slideInLeft } from "@/lib/animations";
import { motion } from "framer-motion";

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
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="space-y-6"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
            The{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c340e] to-[#f4c464]">
              System
            </span>{" "}
            That Works
          </h2>
          <p className="text-[#f4c464] max-w-2xl text-lg leading-relaxed">
            Master the mindset and mechanics that the markets reward: skill, timing, and awareness.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          className="grid md:grid-cols-3 gap-6 mt-12"
        >
          {items.map(({ title, desc, Icon }, index) => (
            <motion.div
              key={title}
              variants={slideInLeft}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <HoverLift>
                <Card className={`border-[#270f05]/50 transition-all duration-300 hover:border-[#f4c464]/30 ${
                  index === 0 ? "bg-[#1a2d28]" : 
                  index === 1 ? "bg-[#1f352f]" : 
                  "bg-[#243a33]"
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-white">
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="text-[#f4c464]" />
                      </motion.div>
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#f4c464] leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              </HoverLift>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureSystem;