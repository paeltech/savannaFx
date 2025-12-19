"use client";

import React from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SavannaCard from "@/components/dashboard/SavannaCard";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  GraduationCap,
  ShieldCheck,
  MessageSquare,
  Mic,
  Archive,
  Smartphone,
  Target,
  BarChart3,
  BookOpen,
  UsersRound,
  CheckCircle2,
} from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { PageTransition, ScrollReveal, StaggerChildren, fadeInUp, HoverScale } from "@/lib/animations";
import { motion } from "framer-motion";

const FeatureRow = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ duration: 0.2 }}
    className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-all duration-300 hover:border-[#f4c464]/30"
  >
    <motion.div
      whileHover={{ rotate: 360 }}
      transition={{ duration: 0.5 }}
      className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0"
    >
      <Icon className="text-slate-200" size={18} />
    </motion.div>
    <div className="space-y-1">
      <div className="text-slate-200 font-medium">{title}</div>
      <div className="text-slate-400 text-sm">{desc}</div>
    </div>
  </motion.div>
);

const BenefitItem = ({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.3 }}
    className="flex items-start gap-3"
  >
    <motion.div
      whileHover={{ rotate: 360 }}
      transition={{ duration: 0.5 }}
      className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center mt-0.5"
    >
      <Icon className="text-[#f4c464]" size={18} />
    </motion.div>
    <div>
      <div className="text-slate-200 font-medium">{title}</div>
      <div className="text-slate-400 text-sm">{desc}</div>
    </div>
  </motion.div>
);

const Signals: React.FC = () => {
  const handleSubscribe = () => {
    showSuccess("Redirecting to subscription…");
    // Replace with your real checkout link
    window.open("https://t.me", "_blank", "noopener,noreferrer");
  };

  return (
    <PageTransition>
      <DashboardLayout>
        {/* Service header */}
        <ScrollReveal>
          <SavannaCard className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="w-9 h-9 rounded-md bg-[#697452] flex items-center justify-center"
                  >
                    <ShoppingBag className="text-white" size={18} />
                  </motion.div>
                  <h1 className="text-xl md:text-2xl font-semibold text-white">Signal Service</h1>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-slate-200">
                    <span className="text-2xl font-bold text-[#6c340e]">$50</span>
                    <span className="text-slate-400"> /month</span>
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSubscribe}
                  >
                    Subscribe Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </SavannaCard>
        </ScrollReveal>

      {/* Who this is for */}
      <SavannaCard className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-slate-200 font-medium mb-3">Who this is for:</h2>
          <p className="text-slate-400">
            Busy or part-time traders who want to skip analysis, trust the process, and trade
            high-probability setups that are actually explained — not just dumped.
          </p>
        </CardContent>
      </SavannaCard>

        {/* What you get grid */}
        <ScrollReveal>
          <SavannaCard className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-slate-200 font-medium mb-4">What You Get:</h2>
              <StaggerChildren className="grid md:grid-cols-2 gap-4">
                <FeatureRow
                  icon={Target}
                  title="Daily Verified Signals"
                  desc="Entries, stop loss, targets, and breakdown for every trade (gold, majors, indices)."
                />
                <FeatureRow
                  icon={ShieldCheck}
                  title="Institutional-Level Risk Guidance"
                  desc="Signals with R:R logic plus lot size guidance."
                />
                <FeatureRow
                  icon={Mic}
                  title="Weekly Market Outlook"
                  desc="Voice memo updates to stay ahead of the curve."
                />
                <FeatureRow
                  icon={Archive}
                  title="Signals Vault Access"
                  desc="Review hundreds of previous setups — educational gold."
                />
                <FeatureRow
                  icon={MessageSquare}
                  title="Private Telegram Access"
                  desc="Instant alerts. No delays. No missed opportunities."
                />
                <FeatureRow
                  icon={Smartphone}
                  title="Mobile-First Delivery"
                  desc="Fast alerts optimized for your phone."
                />
              </StaggerChildren>
            </CardContent>
          </SavannaCard>
        </ScrollReveal>

        {/* Why you should join */}
        <ScrollReveal>
          <SavannaCard className="mb-6">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-slate-200 font-medium">Why You Should Join:</h2>
              <div className="space-y-4">
                <BenefitItem
                  icon={BarChart3}
                  title="90%+ Backtested Accuracy"
                  desc="Many signals hitting full TP even in volatile markets."
                />
                <BenefitItem
                  icon={GraduationCap}
                  title="Educational Focus"
                  desc="Every trade is explained. You learn while you earn."
                />
                <BenefitItem
                  icon={UsersRound}
                  title="Shadow Trading"
                  desc="Trade without needing to decode the charts yourself."
                />
              </div>
            </CardContent>
          </SavannaCard>
        </ScrollReveal>

        {/* Key highlights band */}
        <ScrollReveal>
          <SavannaCard className="mb-6">
            <CardContent className="p-6">
              <StaggerChildren className="grid md:grid-cols-3 gap-6 text-center">
                <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="text-white text-2xl font-bold"
                  >
                    90%+
                  </motion.div>
                  <div className="text-slate-300">Backtested Accuracy</div>
                </motion.div>
                <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="text-green-500 text-2xl font-bold"
                  >
                    Daily
                  </motion.div>
                  <div className="text-slate-300">Verified Signals</div>
                </motion.div>
                <motion.div variants={fadeInUp} initial="hidden" animate="visible">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", delay: 0.3 }}
                    className="text-purple-300 text-2xl font-bold"
                  >
                    Instant
                  </motion.div>
                  <div className="text-slate-300">Telegram Alerts</div>
                </motion.div>
              </StaggerChildren>
            </CardContent>
          </SavannaCard>
        </ScrollReveal>

        {/* CTA: Ready to Start Trading Like a Pro? */}
        <ScrollReveal>
          <HoverScale>
            <SavannaCard>
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <h3 className="text-white text-xl md:text-2xl font-semibold">
                    Ready to Start Trading Like a Pro?
                  </h3>
                  <p className="text-slate-400">
                    Join traders already profiting from verified signals. No guesswork — just profitable trades delivered to your phone.
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <div className="text-slate-200">
                      <span className="text-2xl font-bold text-[#6c340e]">$50</span>
                      <span className="text-slate-400"> /month</span>
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleSubscribe}
                    >
                      Subscribe Now
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-6 pt-2 text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-emerald-500" size={16} />
                      <span>Instant Access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-emerald-500" size={16} />
                      <span>Quality Signals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-emerald-500" size={16} />
                      <span>Monthly Signals</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </SavannaCard>
          </HoverScale>
        </ScrollReveal>
      </DashboardLayout>
    </PageTransition>
  );
};

export default Signals;