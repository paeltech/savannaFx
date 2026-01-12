"use client";

import React, { useState } from "react";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import SavannaCard from "@/components/dashboard/SavannaCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Zap,
  TrendingUp,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { PageTransition, ScrollReveal, StaggerChildren, fadeInUp, HoverScale } from "@/lib/animations";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";

interface SignalPricing {
  id: string;
  pricing_type: "monthly" | "per_pip";
  price: number;
  currency: string;
  description: string | null;
  features: string[] | null;
  is_active: boolean;
}

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
  const { session } = useSupabaseSession();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "per_pip">("monthly");
  const queryClient = useQueryClient();

  // Fetch pricing data
  const { data: pricingData, isLoading } = useQuery<SignalPricing[]>({
    queryKey: ["signal-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signal_pricing")
        .select("*")
        .eq("is_active", true)
        .order("pricing_type");

      if (error) throw error;
      return data || [];
    },
  });

  const monthlyPricing = pricingData?.find((p) => p.pricing_type === "monthly");
  const perPipPricing = pricingData?.find((p) => p.pricing_type === "per_pip");
  const activePricing = selectedPlan === "monthly" ? monthlyPricing : perPipPricing;

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id || !activePricing) {
        throw new Error("Missing required data");
      }

      const { error } = await supabase
        .from("signal_subscriptions")
        .insert({
          user_id: session.user.id,
          pricing_id: activePricing.id,
          subscription_type: selectedPlan,
          status: "pending",
          payment_status: "pending",
          amount_paid: activePricing.price,
          whatsapp_notifications: true,
          email_notifications: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-subscriptions"] });
      showSuccess("Subscription request created! Please complete payment to activate.");
    },
    onError: (error: any) => {
      if (error.message.includes("duplicate")) {
        showError("You already have a subscription. Please contact support.");
      } else {
        showError(error.message || "Failed to create subscription");
      }
    },
  });

  const handleSubscribe = async () => {
    if (!session) {
      showError("Please login to subscribe");
      return;
    }

    if (!activePricing) {
      showError("Pricing information not available");
      return;
    }

    createSubscriptionMutation.mutate();
  };

  return (
    <PageTransition>
      <DashboardLayout>
        {/* Service header with pricing tabs */}
        <ScrollReveal>
          <SavannaCard className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-9 h-9 rounded-md bg-[#697452] flex items-center justify-center"
                >
                  <ShoppingBag className="text-white" size={18} />
                </motion.div>
                <h1 className="text-xl md:text-2xl font-semibold text-white">Signal Service</h1>
              </div>

              {/* Pricing Tabs */}
              <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as "monthly" | "per_pip")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="monthly" className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Monthly Plan
                  </TabsTrigger>
                  <TabsTrigger value="per_pip" className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black">
                    <Zap className="mr-2 h-4 w-4" />
                    Per-Pip Plan
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="monthly" className="mt-0">
                  <div className="bg-nero border border-steel-wool rounded-lg p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Monthly Subscription</h3>
                        <p className="text-rainy-grey text-sm">
                          {monthlyPricing?.description || "Unlimited signals for one month"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-slate-200">
                          {isLoading ? (
                            <span className="text-rainy-grey">Loading...</span>
                          ) : (
                            <>
                              <span className="text-2xl font-bold text-[#6c340e]">
                                ${monthlyPricing?.price.toFixed(2) || "50.00"}
                              </span>
                              <span className="text-slate-400"> /month</span>
                            </>
                          )}
                        </div>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={handleSubscribe}
                          disabled={isLoading || !monthlyPricing}
                        >
                          Subscribe Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="per_pip" className="mt-0">
                  <div className="bg-nero border border-steel-wool rounded-lg p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Per-Pip Payment</h3>
                        <p className="text-rainy-grey text-sm">
                          {perPipPricing?.description || "Pay only for the pips you gain"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-slate-200">
                          {isLoading ? (
                            <span className="text-rainy-grey">Loading...</span>
                          ) : (
                            <>
                              <span className="text-2xl font-bold text-[#6c340e]">
                                ${perPipPricing?.price.toFixed(2) || "0.50"}
                              </span>
                              <span className="text-slate-400"> /pip</span>
                            </>
                          )}
                        </div>
                        <Button
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={handleSubscribe}
                          disabled={isLoading || !perPipPricing}
                        >
                          Get Started
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
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
                  <div className="text-slate-300">WhatsApp Alerts</div>
                </motion.div>
              </StaggerChildren>
            </CardContent>
          </SavannaCard>
        </ScrollReveal>

        {/* Plan Comparison */}
        <ScrollReveal>
          <SavannaCard className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-slate-200 font-medium mb-4">Choose Your Plan:</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Monthly Plan */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`border-2 rounded-lg p-6 transition-all ${selectedPlan === "monthly"
                    ? "border-gold bg-gold/5"
                    : "border-steel-wool bg-nero hover:border-gold/50"
                    }`}
                  onClick={() => setSelectedPlan("monthly")}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-gold" size={24} />
                    <h3 className="text-xl font-semibold text-white">Monthly Plan</h3>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gold">
                      ${monthlyPricing?.price.toFixed(2) || "50.00"}
                    </span>
                    <span className="text-rainy-grey">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2 text-sm text-rainy-grey">
                      <CheckCircle2 className="text-green-500 mt-0.5" size={16} />
                      <span>Unlimited signals</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-rainy-grey">
                      <CheckCircle2 className="text-green-500 mt-0.5" size={16} />
                      <span>All features included</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-rainy-grey">
                      <CheckCircle2 className="text-green-500 mt-0.5" size={16} />
                      <span>Best for active traders</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSubscribe}
                    disabled={isLoading || !monthlyPricing}
                  >
                    Subscribe Monthly
                  </Button>
                </motion.div>

                {/* Per-Pip Plan */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`border-2 rounded-lg p-6 transition-all ${selectedPlan === "per_pip"
                    ? "border-purple-500 bg-purple-500/5"
                    : "border-steel-wool bg-nero hover:border-purple-500/50"
                    }`}
                  onClick={() => setSelectedPlan("per_pip")}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-purple-500" size={24} />
                    <h3 className="text-xl font-semibold text-white">Per-Pip Plan</h3>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-purple-500">
                      ${perPipPricing?.price.toFixed(2) || "0.50"}
                    </span>
                    <span className="text-rainy-grey">/pip</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2 text-sm text-rainy-grey">
                      <CheckCircle2 className="text-green-500 mt-0.5" size={16} />
                      <span>Pay only for profitable pips</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-rainy-grey">
                      <CheckCircle2 className="text-green-500 mt-0.5" size={16} />
                      <span>No monthly commitment</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-rainy-grey">
                      <CheckCircle2 className="text-green-500 mt-0.5" size={16} />
                      <span>Flexible usage</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleSubscribe}
                    disabled={isLoading || !perPipPricing}
                  >
                    Get Started
                  </Button>
                </motion.div>
              </div>
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
                      {isLoading ? (
                        <span className="text-rainy-grey">Loading...</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-[#6c340e]">
                            ${activePricing?.price.toFixed(2) || "50.00"}
                          </span>
                          <span className="text-slate-400">
                            {selectedPlan === "monthly" ? " /month" : " /pip"}
                          </span>
                        </>
                      )}
                    </div>
                    <Button
                      className={
                        selectedPlan === "monthly"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      }
                      onClick={handleSubscribe}
                      disabled={isLoading || !activePricing}
                    >
                      {selectedPlan === "monthly" ? "Subscribe Now" : "Get Started"}
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
                      <span>
                        {selectedPlan === "monthly" ? "Monthly Signals" : "Flexible Pricing"}
                      </span>
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