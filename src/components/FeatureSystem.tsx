"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal, StaggerChildren } from "@/lib/animations";

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
    <section className="bg-transparent py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight font-heading">
              The{" "}
              <span className="text-transparent font-heading bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold drop-shadow-[0_0_20px_rgba(244,196,100,0.4)]">
                System
              </span>{" "}
              That Works
            </h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl font-semibold text-gold/90 max-w-2xl leading-relaxed"
            >
              Master the mindset and mechanics that the markets reward: skill, timing, and awareness.
            </motion.p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-10 sm:mt-12 md:mt-16">
          {items.map(({ title, desc, Icon }, index) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: { 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: {
                    duration: 0.5,
                    delay: index * 0.15,
                    ease: [0.22, 1, 0.36, 1]
                  }
                }
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <Card className="bg-nero border border-steel-wool/30 hover:border-gold/60 hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 group relative overflow-hidden">
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 group-hover:from-gold/10 group-hover:via-gold/5 group-hover:to-gold/10 transition-all duration-500 pointer-events-none" />
                
                <CardHeader className="pb-3 sm:pb-4 relative z-10">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-white text-lg sm:text-xl group-hover:text-gold transition-colors duration-300">
                    <motion.div
                      whileHover={{ 
                        scale: 1.2, 
                        rotate: [0, -10, 10, 0],
                        transition: { duration: 0.3 }
                      }}
                      animate={{ 
                        y: [0, -5, 0],
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        delay: index * 0.3
                      }}
                    >
                      <Icon className="text-gold flex-shrink-0" size={20} />
                    </motion.div>
                    <span>{title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <motion.p 
                    className="text-sm sm:text-base text-rainy-grey leading-relaxed group-hover:text-gold/80 transition-colors duration-300"
                    initial={{ opacity: 0.8 }}
                    whileHover={{ opacity: 1 }}
                  >
                    {desc}
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
};

export default FeatureSystem;