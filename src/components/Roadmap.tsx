"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HoverLift, fadeInUp, slideInLeft } from "@/lib/animations";
import { motion } from "framer-motion";

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
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Your Roadmap to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c340e] to-[#f4c464]">
              Survival
            </span>
          </h2>
          <p className="text-[#f4c464] mt-3 text-lg leading-relaxed">
            Follow a disciplined, step-by-step path to survive and thrive in the markets.
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
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-10"
        >
          {steps.map((s) => (
            <motion.div
              key={s.number}
              variants={slideInLeft}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <HoverLift>
                <Card className={`border-[#270f05]/50 transition-all duration-300 hover:border-[#f4c464]/30 ${
                  s.number === 1 ? "bg-[#1a2d28]" :
                  s.number === 2 ? "bg-[#1f352f]" :
                  s.number === 3 ? "bg-[#243a33]" :
                  s.number === 4 ? "bg-[#1f352f]" :
                  "bg-[#1a2d28]"
                }`}>
                  <CardHeader className="pb-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="text-4xl font-extrabold text-[#f4c464]"
                    >
                      {s.number}
                    </motion.div>
                    <CardTitle className="text-white text-lg">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs tracking-widest text-[#f4c464] opacity-80">{s.subtitle}</div>
                  </CardContent>
                </Card>
              </HoverLift>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="mt-10"
        >
          <Button className="bg-gradient-to-r from-[#6c340e] to-[#f4c464] text-white rounded-full px-6">
            START YOUR TRAINING
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Roadmap;