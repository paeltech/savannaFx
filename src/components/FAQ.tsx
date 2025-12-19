"use client";

import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StaggerChildren, HoverScale, fadeInUp } from "@/lib/animations";
import { motion } from "framer-motion";

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
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center">
            Still Wondering If Trading Is{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6c340e] to-[#f4c464]">For You?</span>
          </h2>
          <p className="text-center text-[#f4c464] mt-3 text-lg leading-relaxed">
            Find answers to common questions about surviving and thriving in the markets
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <Accordion type="single" collapsible className="w-full">
            {items.map((it, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <AccordionItem value={`item-${idx}`}>
                  <AccordionTrigger className="text-white">{it.q}</AccordionTrigger>
                  <AccordionContent className="text-gray-200 leading-relaxed">{it.a}</AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          transition={{ delay: 0.4 }}
        >
          <HoverScale>
            <Card className="bg-[#14241f] border-[#270f05]/50 mt-8 transition-all duration-300 hover:border-[#f4c464]/30">
              <CardContent className="p-6 text-center">
                <p className="text-[#f4c464] mb-4 leading-relaxed">
                  Can't find the answer you're looking for? Our support team is here to help.
                </p>
                <Button className="bg-[#697452] hover:bg-[#697452]/90 text-white">Contact Support</Button>
              </CardContent>
            </Card>
          </HoverScale>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;