"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero: React.FC<{ onOpenMenu: () => void }> = ({ onOpenMenu }) => {
  return (
    <section className="relative min-h-screen flex items-start justify-start bg-black overflow-hidden">
      {/* Desktop layout */}
      <div className="hidden lg:block relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 md:pt-2">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-10">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
              <span className="text-transparent lg:text-7xl sm:text-5xl bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                Rethink How You
              </span>
              <br />
              Earn Today
            </h1>
            <p className="text-xl md:text-2xl lg:pt-20 text-gray-300 max-w-xl leading-relaxed font-light">
              Break free from the chains of the matrix. Join successful traders learning profitable strategies and building wealth through forex trading.
            </p>
            <div className="flex gap-3">
              <Button className="group bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-10 py-5 text-xl rounded-full transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
                <span>Start Trading Today</span>
                <ArrowRight className="transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" className="rounded-full border-gray-700 text-gray-300" onClick={onOpenMenu}>
                Menu
              </Button>
            </div>
          </div>

          <div className="relative h-[100vh] bg-black">
            <div className="relative h-full">
              {/* Visual placeholder replacing external 3D animation */}
              <img
                src="/assets/placeholder.svg"
                alt="placeholder"
                className="absolute inset-0 w-full h-full rounded-xl object-cover"
              />
              <div className="absolute inset-0 z-20 bg-transparent select-none">
                <div className="absolute top-24 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium">
                  Scrolling...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden relative z-10 w-full h-full min-h-screen flex items-center justify-center px-4 sm:px-6">
        <div className="absolute inset-0 w-full h-full opacity-15">
          <img src="/assets/placeholder.svg" alt="placeholder" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 text-center space-y-7 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-7xl md:text-6xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 text-4xl sm:text-8xl md:text-8xl lg:text-6xl">
              Rethink How You
            </span>
            <br />
            Earn Today
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed font-light">
            Break free from the chains of the matrix. Join successful traders learning profitable strategies and building wealth through forex trading.
          </p>
          <div className="flex justify-center pt-5">
            <Button className="group bg-gradient-to-r from-orange-500 to-red-500 font-bold text-white px-8 py-4 text-lg sm:text-xl rounded-full transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
              <span>Start Trading Today</span>
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;