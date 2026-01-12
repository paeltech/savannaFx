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
  SignalHigh,
  TrendingDown,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  DollarSign,
  X,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { PageTransition, ScrollReveal, StaggerChildren, fadeInUp, HoverScale } from "@/lib/animations";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SignalPricing {
  id: string;
  pricing_type: "monthly" | "per_pip";
  price: number;
  currency: string;
  description: string | null;
  features: string[] | null;
  is_active: boolean;
}

interface Signal {
  id: string;
  trading_pair: string;
  signal_type: "buy" | "sell";
  entry_price: number;
  stop_loss: number;
  take_profit_1: number | null;
  take_profit_2: number | null;
  take_profit_3: number | null;
  title: string;
  analysis: string | null;
  confidence_level: "low" | "medium" | "high" | null;
  status: "active" | "closed" | "cancelled";
  created_at: string;
  updated_at: string;
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

  // Check if user has an active subscription
  const { data: activeSubscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["user-active-subscription", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from("signal_subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Fetch signals for users with active subscriptions
  const { data: signals, isLoading: signalsLoading } = useQuery<Signal[]>({
    queryKey: ["signals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeSubscription, // Only fetch if user has active subscription
  });

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
          status: "active",
          payment_status: "completed",
          amount_paid: activePricing.price,
          whatsapp_notifications: true,
          email_notifications: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["user-active-subscription"] });
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      showSuccess("Subscription activated successfully! You will now receive trading signals.");
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      active: { 
        label: "Active", 
        className: "bg-green-600/90 hover:bg-green-600 text-white border-green-500/50 shadow-sm",
        icon: <CheckCircle2 className="h-3 w-3 mr-1" />
      },
      closed: { 
        label: "Closed", 
        className: "bg-blue-600/90 hover:bg-blue-600 text-white border-blue-500/50 shadow-sm",
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      cancelled: { 
        label: "Cancelled", 
        className: "bg-gray-600/90 hover:bg-gray-600 text-white border-gray-500/50 shadow-sm",
        icon: <X className="h-3 w-3 mr-1" />
      },
    };
    const variant = variants[status] || variants.active;
    return (
      <Badge className={`${variant.className} font-semibold px-2.5 py-1 border flex items-center w-fit`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  const getConfidenceBadge = (level: string | null) => {
    if (!level) return null;
    const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      high: { 
        label: "High", 
        className: "bg-green-600/90 hover:bg-green-600 text-white border-green-500/50 shadow-sm",
        icon: <TrendingUp className="h-3 w-3 mr-1" />
      },
      medium: { 
        label: "Medium", 
        className: "bg-yellow-600/90 hover:bg-yellow-600 text-white border-yellow-500/50 shadow-sm",
        icon: <BarChart3 className="h-3 w-3 mr-1" />
      },
      low: { 
        label: "Low", 
        className: "bg-gray-600/90 hover:bg-gray-600 text-white border-gray-500/50 shadow-sm",
        icon: <TrendingDown className="h-3 w-3 mr-1" />
      },
    };
    const variant = variants[level] || variants.medium;
    return (
      <Badge className={`${variant.className} font-semibold px-2.5 py-1 border flex items-center w-fit`}>
        {variant.icon}
        {variant.label}
      </Badge>
    );
  };

  // Show signals table if user has active subscription
  if (activeSubscription) {
    return (
      <PageTransition>
        <DashboardLayout>
          <ScrollReveal>
            {/* Header Card */}
            <SavannaCard className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="w-9 h-9 rounded-md bg-[#697452] flex items-center justify-center"
                    >
                      <SignalHigh className="text-white" size={18} />
                    </motion.div>
                    <div>
                      <h1 className="text-xl md:text-2xl font-semibold text-white">Trading Signals</h1>
                      <p className="text-rainy-grey text-sm mt-1">
                        Your active subscription: {activeSubscription.subscription_type === "monthly" ? "Monthly Plan" : "Per-Pip Plan"}
                      </p>
                    </div>
                  </div>
                  {signals && signals.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-lg border border-gold/20">
                      <SignalHigh className="h-4 w-4 text-gold" />
                      <span className="text-white font-semibold">{signals.length}</span>
                      <span className="text-rainy-grey text-sm">
                        {signals.length === 1 ? 'Signal' : 'Signals'}
                      </span>
                    </div>
                  )}
                </div>

                {signalsLoading ? (
                  <div className="text-center text-rainy-grey py-8">Loading signals...</div>
                ) : !signals || signals.length === 0 ? (
                  <div className="text-center text-rainy-grey py-8">
                    <SignalHigh className="mx-auto mb-4 text-rainy-grey" size={48} />
                    <p className="text-lg font-medium text-white mb-2">No signals available yet</p>
                    <p className="text-sm">Signals will appear here as they are published.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-steel-wool/50 bg-nero/30 backdrop-blur-sm">
                    <div className="min-w-full">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="border-steel-wool bg-nero/90 backdrop-blur-sm hover:bg-nero/95 sticky top-0 z-10 shadow-lg">
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gold" />
                                <span>Pair</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">Type</TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <ArrowUp className="h-4 w-4 text-green-500" />
                                <span>Entry</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <ArrowDown className="h-4 w-4 text-red-500" />
                                <span>Stop Loss</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-gold" />
                                <span>Take Profit</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 min-w-[200px]">Title & Analysis</TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">Confidence</TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">Status</TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gold" />
                                <span>Created</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-white font-semibold py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gold" />
                                <span>Updated</span>
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {signals.map((signal, index) => (
                            <TableRow 
                              key={signal.id} 
                              className="border-steel-wool/50 hover:bg-nero/60 transition-all duration-200 group"
                            >
                              <TableCell className="text-white font-semibold py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  <span className="text-base">{signal.trading_pair}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-4">
                                <Badge 
                                  className={`${
                                    signal.signal_type === 'buy' 
                                      ? 'bg-green-600/90 hover:bg-green-600 text-white border-green-500/50' 
                                      : 'bg-red-600/90 hover:bg-red-600 text-white border-red-500/50'
                                  } font-semibold px-3 py-1 border shadow-sm`}
                                >
                                  {signal.signal_type === 'buy' ? (
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                  )}
                                  {signal.signal_type.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-white py-4 px-4">
                                <div className="font-mono text-sm bg-green-500/10 px-2 py-1 rounded border border-green-500/20 inline-block">
                                  {signal.entry_price.toFixed(5)}
                                </div>
                              </TableCell>
                              <TableCell className="text-white py-4 px-4">
                                <div className="font-mono text-sm bg-red-500/10 px-2 py-1 rounded border border-red-500/20 inline-block">
                                  {signal.stop_loss.toFixed(5)}
                                </div>
                              </TableCell>
                              <TableCell className="text-white py-4 px-4">
                                {signal.take_profit_1 ? (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded">TP1</span>
                                      <span className="font-mono text-sm bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                        {signal.take_profit_1.toFixed(5)}
                                      </span>
                                    </div>
                                    {signal.take_profit_2 && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded">TP2</span>
                                        <span className="font-mono text-sm bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                          {signal.take_profit_2.toFixed(5)}
                                        </span>
                                      </div>
                                    )}
                                    {signal.take_profit_3 && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded">TP3</span>
                                        <span className="font-mono text-sm bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                          {signal.take_profit_3.toFixed(5)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-rainy-grey text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-white py-4 px-4 max-w-xs">
                                <div className="space-y-1">
                                  <div className="font-medium text-sm truncate" title={signal.title}>
                                    {signal.title}
                                  </div>
                                  {signal.analysis && (
                                    <div 
                                      className="text-xs text-rainy-grey line-clamp-2 leading-relaxed" 
                                      title={signal.analysis}
                                    >
                                      {signal.analysis}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4 px-4">{getConfidenceBadge(signal.confidence_level)}</TableCell>
                              <TableCell className="py-4 px-4">{getStatusBadge(signal.status)}</TableCell>
                              <TableCell className="text-rainy-grey py-4 px-4">
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-white/90">
                                    {format(new Date(signal.created_at), "MMM dd, yyyy")}
                                  </div>
                                  <div className="text-xs flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(signal.created_at), "HH:mm:ss")}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-rainy-grey py-4 px-4">
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-white/90">
                                    {format(new Date(signal.updated_at), "MMM dd, yyyy")}
                                  </div>
                                  <div className="text-xs flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(new Date(signal.updated_at), "HH:mm:ss")}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </SavannaCard>
          </ScrollReveal>
        </DashboardLayout>
      </PageTransition>
    );
  }

  // Show subscription options if user doesn't have active subscription
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
              {subscriptionLoading && (
                <div className="text-center text-rainy-grey py-4 mb-4">Checking subscription status...</div>
              )}

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