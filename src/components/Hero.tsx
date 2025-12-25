"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, slideInLeft, slideInRight, defaultTransition } from "@/lib/animations";
import TypewriterText from "./TypewriterText";
import Galaxy from "./Galaxy";

const Hero: React.FC<{ onOpenMenu: () => void; onOpenSignup?: () => void }> = ({ onOpenMenu, onOpenSignup }) => {
  return (
    <section className="relative min-h-screen flex items-start justify-start bg-black overflow-hidden">
      <Galaxy 
        mouseRepulsion={true}
        mouseInteraction={true}
        density={0.3}
        speed={0.2}
        glowIntensity={0.2}
        saturation={0.8}
        hueShift={240}
        transparent={true}
      />
      {/* Desktop layout */}
      <div className="hidden lg:block relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 md:pt-12">
        <div className="max-w-4xl mt-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={slideInLeft}
            transition={defaultTransition}
            className="space-y-12"
          >
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ ...defaultTransition, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight font-heading"
            >
              <span className="text-transparent lg:text-7xl sm:text-5xl bg-clip-text bg-gradient-to-r from-gold-dark to-gold font-heading">
                Train like a predator.
              </span>
            
              <br />
              <TypewriterText
                texts={["Survive the markets.", "Profit consistently.", "Win the game."]}
                typingSpeed={100}
                deletingSpeed={50}
                pauseDuration={2000}
                className="text-white font-heading"
              />
            </motion.h1>
            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ ...defaultTransition, delay: 0.4 }}
              className="text-xl md:text-2xl lg:pt-8 text-rainy-grey max-w-xl leading-relaxed"
            >
              The savanna is vast, harsh, and unforgiving—only the disciplined, adaptive, and patient thrive.
             
              SavannaFX empowers you to survive and thrive in the savanna we call market.
            </motion.p>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              transition={{ ...defaultTransition, delay: 0.6 }}
              className="flex gap-4 pt-4"
            >
              <Button 
                onClick={onOpenSignup}
                className="group bg-gradient-to-r from-gold-dark to-gold text-cursed-black font-bold px-12 py-6 text-xl rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gold/20 flex items-center justify-center gap-3"
              >
                <span>Get started with SavannaFX</span>
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
              
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden relative z-10 w-full h-full min-h-screen flex items-center justify-center px-4 sm:px-6">
        <div className="absolute inset-0 w-full h-full opacity-15">
          <img src="/assets/pexels-anna-nekrashevich-6801633.jpg" alt="savanna visual" className="w-full h-full object-cover" />
        </div>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          transition={defaultTransition}
          className="relative z-10 text-center space-y-7 max-w-3xl mx-auto"
        >
          <h1 className="text-4xl sm:text-7xl md:text-6xl lg:text-6xl font-bold text-white leading-tight tracking-tight font-heading">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-dark to-gold text-4xl sm:text-8xl md:text-8xl lg:text-6xl font-heading">
              Train like a predator.
            </span>
            <br />
            <span className="text-white font-heading">Trade with patience. </span>
            <TypewriterText
              texts={["Survive the markets.", "Profit consistently.", "Win the game."]}
              typingSpeed={100}
              deletingSpeed={50}
              pauseDuration={2000}
              className="text-white font-heading"
            />
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gold leading-relaxed">
            SavannaFX helps you build discipline, timing, and awareness to survive and thrive in the markets.
          </p>
          <div className="flex justify-center pt-6">
            <Button 
              onClick={onOpenSignup}
              className="group bg-gradient-to-r from-gold-dark to-gold text-cursed-black font-bold px-8 py-4 text-lg sm:text-xl rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gold/20 flex items-center justify-center gap-3"
            >
              <span>Get started with SavannaFX</span>
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...defaultTransition, delay: 1, repeat: Infinity, repeatType: "reverse", duration: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="w-6 h-10 border-2 border-rainy-grey/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gold/50 rounded-full mt-2"></div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;