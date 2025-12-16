"use client";

import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FAQ: React.FC = () => {
  const items = [
    { q: "WHO IS KOJOFOREX?", a: "A community and platform focused on teaching profitable forex strategies." },
    { q: "What is forex trading?", a: "Buying and selling currency pairs aiming to profit from price movements." },
    { q: "Who is online forex trading for?", a: "Anyone willing to learn market structure, risk, and strategy." },
    { q: "How does Kojoforex help your forex Journey?", a: "By providing education, community, signals, and mentorship." },
    { q: "Where do I start from?", a: "Start with the course, join the community, and practice risk management." },
    { q: "What will it take to Join Kojoforex?", a: "Register, choose a plan, and commit to consistent learning." },
  ];

  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center">
          Still Wondering If Forex Trading Is{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">For You?</span>
        </h2>
        <p className="text-center text-gray-300 mt-2">
          Find answers to common questions about forex trading and how to get started
        </p>

        <div className="mt-8">
          <Accordion type="single" collapsible className="w-full">
            {items.map((it, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-white">{it.q}</AccordionTrigger>
                <AccordionContent className="text-gray-300">{it.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <Card className="bg-gray-900/60 border-gray-800 mt-8">
          <CardContent className="p-6 text-center">
            <p className="text-gray-300 mb-4">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Contact Support</Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default FAQ;