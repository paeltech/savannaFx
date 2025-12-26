"use client";

import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FAQ: React.FC = () => {
  const items = [
    { q: "WHO IS SavannaFX?", a: "A training tribe focused on discipline, patience, and survival in the markets." },
    { q: "What is forex trading?", a: "Trading currency pairs with strategies that reward skill, timing, and awareness." },
    { q: "Who is online forex trading for?", a: "Anyone willing to learn and apply a disciplined approach—predators, not gamblers." },
    { q: "How does SavannaFX help your journey?", a: "We teach mindset and mechanics, provide community, signals, and mentorship." },
    { q: "Where do I start?", a: "Begin training, choose your pathway, join the tribe, and practice patient execution." },
    { q: "What does it take to join SavannaFX?", a: "Register, choose a plan, and commit to disciplined, adaptive learning." },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center leading-tight px-4">
          Still Wondering If Trading Is{" "}
          <span className="text-transparent bg-clip-text font-heading bg-gradient-to-r from-gold-dark to-gold">For You?</span>
        </h2>
        <p className="text-center text-gold mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed px-4">
          Find answers to common questions about surviving and thriving in the markets
        </p>

        <div className="mt-8 sm:mt-12">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {items.map((it, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="border-0 bg-nero rounded-lg px-3 sm:px-4 mb-2 hover:border hover:border-steel-wool transition-all duration-300">
                <AccordionTrigger className="text-white hover:text-gold transition-colors duration-200 text-left text-sm sm:text-base py-3 sm:py-4">{it.q}</AccordionTrigger>
                <AccordionContent className="text-rainy-grey leading-relaxed text-sm sm:text-base pb-3 sm:pb-4">{it.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <Card className="bg-nero mt-8 sm:mt-12 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10">
          <CardContent className="p-6 sm:p-8 text-center">
            <p className="text-rainy-grey mb-4 sm:mb-6 leading-relaxed text-base sm:text-lg">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <Button className="bg-gradient-to-r from-gold-dark to-gold text-cursed-black hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 font-semibold min-h-[56px] text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6">Contact Support</Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default FAQ;