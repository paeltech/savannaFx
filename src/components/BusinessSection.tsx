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
    price: "From GHS 150",
    bullets: ["Personalized guidance", "Hands-on training", "All skill levels"],
    cta: "Apply Now",
  },
  {
    title: "SavannaFX Academy",
    price: "From GHS 700",
    bullets: ["Hands-on training", "Live market sessions", "All skill levels"],
    cta: "Apply Now",
  },
  {
    title: "Session Booking",
    price: "Variable",
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
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center">
          Build Your Business{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c340e] to-[#f4c464]">
            Right from Your Browser
          </span>
        </h2>
        <p className="text-[#f4c464]/80 text-center mt-2">
          Everything you need to start, grow, and scale your trading business is accessible from any device.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {services.map((s) => (
            <Card key={s.title} className="bg-gray-900/60 border-gray-800 flex flex-col">
              <CardHeader>
                <CardTitle className="text-white">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300">
                <div className="text-blue-400 font-semibold">{s.price}</div>
                <ul className="mt-3 space-y-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="text-sm">
                      • {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">{s.cta}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full px-6">
            Start Building Today
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BusinessSection;