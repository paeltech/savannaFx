"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Service = {
  title: string;
  price: string;
  bullets: string[];
  cta: string;
};

const services: Service[] = [
  {
    title: "One-on-One Mentorship",
    price: "From $12",
    bullets: ["Personalized guidance", "Hands-on training", "All skill levels"],
    cta: "Apply Now",
  },
  {
    title: "SavannaFX Academy",
    price: "From $55",
    bullets: ["Hands-on training", "Live market sessions", "All skill levels"],
    cta: "Apply Now",
  },
  {
    title: "Session Booking",
    price: "Variable (USD)",
    bullets: ["Flexible scheduling", "Multiple time slots", "Easy rebooking"],
    cta: "Book Now",
  },
  {
    title: "The GOAT Strategy Course",
    price: "$99 one-time",
    bullets: ["Strategy breakdowns", "Community access", "Lifetime updates"],
    cta: "Enroll Now",
  },
];

const BusinessSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center font-heading leading-tight px-4">
          Build Your Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-dark to-gold font-heading">Right from Your Browser</span>
        </h2>
        <p className="text-gold text-center mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto px-4">
          Everything you need to start, grow, and scale your trading business is accessible from any device.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-10 sm:mt-12 md:mt-16">
          {services.map((s) => (
            <Card key={s.title} className="bg-nero flex flex-col hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10 transition-all duration-300">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-white text-lg sm:text-xl">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-gold">
                <div className="text-gold font-semibold text-base sm:text-lg mb-3 sm:mb-4">{s.price}</div>
                <ul className="mt-2 sm:mt-3 space-y-2 sm:space-y-3">
                  {s.bullets.map((b) => (
                    <li key={b} className="text-xs sm:text-sm text-rainy-grey leading-relaxed">
                      • {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto pt-3 sm:pt-4">
                <Button className="w-full bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 rounded-md font-semibold min-h-[44px] text-sm sm:text-base">{s.cta}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* <div className="text-center mt-12">
          <Button className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 rounded-full px-8 py-6 font-semibold">
            Start Building Today
          </Button>
        </div> */}
      </div>
    </section>
  );
};

export default BusinessSection;