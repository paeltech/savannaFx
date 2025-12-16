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
    <section className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center">
          Build Your Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c340e] to-[#f4c464]">Right from Your Browser</span>
        </h2>
        <p className="text-[#f4c464]/80 text-center mt-3">
          Everything you need to start, grow, and scale your trading business is accessible from any device.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {services.map((s) => (
            <Card key={s.title} className="bg-[#14241f]/80 border-[#270f05] flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-white">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-[#f4c464]/80">
                <div className="text-[#f4c464] font-semibold">{s.price}</div>
                <ul className="mt-3 space-y-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="text-sm">
                      • {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button className="w-full bg-gradient-to-r from-[#6c340e] to-[#f4c464] hover:brightness-110 text-white rounded-md">{s.cta}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button className="bg-gradient-to-r from-[#6c340e] to-[#f4c464] hover:brightness-110 text-white rounded-full px-6 py-2">
            Start Building Today
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BusinessSection;