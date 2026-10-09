"use client";

import React, { useState } from "react";
import DashboardLayout from "../../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import SavannaCard from "@/components/dashboard/SavannaCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SignalHigh, Edit, DollarSign, Users, TrendingUp, Plus, Trash2, RefreshCw, MessageSquare, History } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supabase from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { PageTransition, ScrollReveal } from "@/lib/animations";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createNotificationForUsers, formatSignalNotification } from "@/utils/notifications";
import type { SignalUpdate } from "@shared/types/signal";

interface SignalPricing {
  id: string;
  pricing_type: "daily" | "weekly" | "monthly" | "per_pip";
  price: number;
  currency: string;
  description: string | null;
  features: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SignalSubscription {
  id: string;
  user_id: string;
  pricing_id: string;
  subscription_type: "daily" | "weekly" | "monthly" | "per_pip";
  status: "active" | "cancelled" | "expired" | "pending";
  payment_status: "pending" | "completed" | "failed" | "refunded";
  amount_paid: number;
  start_date: string;
  end_date: string | null;
  pips_purchased: number;
  pips_used: number;
  created_at: string;
  user_profiles?: {
    phone_number: string | null;
  };
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
  status: "active" | "closed" | "cancelled" | "inactive";
  created_at: string;
  updated_at: string;
}

interface WhatsAppGroup {
  id: string;
  group_name: string;
  group_jid: string;
  group_number: number;
  member_count: number;
  max_members: number;
  is_active: boolean;
  month_year: string;
  created_at: string;
  updated_at: string;
}

const pricingSchema = z.object({
  price: z.number().min(0, "Price must be positive"),
  currency: z.enum(["TZS", "USD"]),
  description: z.string().optional(),
  is_active: z.boolean(),
});

type PricingFormValues = z.infer<typeof pricingSchema>;

const signalSchema = z.object({
  trading_pair: z.string().min(1, "Trading pair is required"),
  signal_type: z.enum(["buy", "sell"]),
  entry_price: z.number().min(0, "Entry price must be positive"),
  stop_loss: z.number().min(0, "Stop loss must be positive"),
  take_profit_1: z.number().min(0).optional(),
  take_profit_2: z.number().min(0).optional(),
  take_profit_3: z.number().min(0).optional(),
  title: z.string().min(1, "Title is required"),
  analysis: z.string().optional(),
  confidence_level: z.enum(["low", "medium", "high"]).optional(),
});

type SignalFormValues = z.infer<typeof signalSchema>;

const SIGNAL_UPDATE_FIELD_LABELS: Record<string, string> = {
  trading_pair: "Trading pair",
  signal_type: "Type",
  entry_price: "Entry",
  stop_loss: "Stop loss",
  take_profit_1: "TP1",
  take_profit_2: "TP2",
  take_profit_3: "TP3",
  title: "Title",
  analysis: "Analysis",
  confidence_level: "Confidence",
  status: "Status",
};

const subscriptionSchema = z.object({
  status: z.enum(["active", "cancelled", "expired", "pending"]),
  payment_status: z.enum(["pending", "completed", "failed", "refunded"]),
  amount_paid: z.number().min(0, "Amount must be positive"),
  pips_purchased: z.number().min(0, "Pips must be positive").optional(),
  pips_used: z.number().min(0, "Pips used must be positive").optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional().nullable(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

function planLabel(type: string) {
  if (type === "daily") return "Daily";
  if (type === "weekly") return "Weekly";
  if (type === "monthly") return "Monthly";
  if (type === "per_pip") return "Per-Pip";
  return type;
}

function planSuffix(type: string) {
  if (type === "daily") return "/day";
  if (type === "weekly") return "/week";
  if (type === "monthly") return "/month";
  return "/pip";
}

const PLAN_ORDER = ["daily", "weekly", "monthly", "per_pip"];

function checkoutIssue(pricing: { price: number; currency: string; is_active: boolean; pricing_type: string }) {
  if (pricing.pricing_type === "per_pip") return "Per-pip is not offered at checkout.";
  if (!pricing.is_active) return "Turned off, so members will not see it.";
  if (pricing.currency !== "TZS") return "Checkout only charges TZS.";
  if (Math.round(Number(pricing.price)) < 500) return "Checkout requires at least 500 TZS.";
  return null;
}

const AdminSignals: React.FC = () => {
  const [selectedPricing, setSelectedPricing] = useState<SignalPricing | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSignalDialogOpen, setIsSignalDialogOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<SignalSubscription | null>(null);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("signals");
  const [memberQuery, setMemberQuery] = useState("");
  const [memberStatus, setMemberStatus] = useState("all");
  const [isRefreshingGroups, setIsRefreshingGroups] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [signalForHistory, setSignalForHistory] = useState<Signal | null>(null);
  const [signalUpdates, setSignalUpdates] = useState<SignalUpdate[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      price: 0,
      currency: "TZS",
      description: "",
      is_active: true,
    },
  });

  const signalForm = useForm<SignalFormValues>({
    resolver: zodResolver(signalSchema),
    defaultValues: {
      trading_pair: "",
      signal_type: "buy",
      entry_price: 0,
      stop_loss: 0,
      take_profit_1: undefined,
      take_profit_2: undefined,
      take_profit_3: undefined,
      title: "",
      analysis: "",
      confidence_level: "medium",
    },
  });

  const subscriptionForm = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      status: "active",
      payment_status: "pending",
      amount_paid: 0,
      pips_purchased: 0,
      pips_used: 0,
      start_date: "",
      end_date: null,
    },
  });

  // Fetch pricing data
  const { data: pricingData, isLoading: pricingLoading } = useQuery<SignalPricing[]>({
    queryKey: ["signal-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signal_pricing")
        .select("*")
        .order("pricing_type");

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch subscriptions data with user phone numbers
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery<SignalSubscription[]>({
    queryKey: ["signal-subscriptions"],
    queryFn: async () => {
      // Fetch subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from("signal_subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (subscriptionsError) throw subscriptionsError;
      if (!subscriptionsData || subscriptionsData.length === 0) return [];

      // Fetch user profiles for all user IDs
      const userIds = subscriptionsData.map(sub => sub.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("user_profiles")
        .select("id, phone_number")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Merge phone numbers into subscriptions
      const subscriptionsWithPhone = subscriptionsData.map(sub => ({
        ...sub,
        user_profiles: profilesData?.find(profile => profile.id === sub.user_id) 
          ? { phone_number: profilesData.find(profile => profile.id === sub.user_id)?.phone_number || null }
          : { phone_number: null }
      }));

      return subscriptionsWithPhone;
    },
  });

  const { data: paymentsResult, isLoading: paymentsLoading } = useQuery<{
    rows: Array<{
      id: string;
      phone_number: string;
      provider: string;
      subscription_type: string;
      amount: number;
      currency: string;
      status: string;
      failure_reason: string | null;
      created_at: string;
    }>;
    error: string | null;
  }>({
    queryKey: ["signal-payments-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signal_payments")
        .select("id, phone_number, provider, subscription_type, amount, currency, status, failure_reason, created_at")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) return { rows: [], error: error.message };
      return { rows: data ?? [], error: null };
    },
  });

  // Fetch signals data
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
  });

  // Fetch signal update counts (for badges in table)
  const { data: signalUpdateCounts } = useQuery<Record<string, number>>({
    queryKey: ["signal-update-counts", signals?.length],
    queryFn: async () => {
      if (!signals?.length) return {};
      try {
        const ids = signals.map((s) => s.id);
        const { data, error } = await supabase
          .from("signal_updates")
          .select("signal_id")
          .in("signal_id", ids)
          .eq("revision_type", "update");
        if (error) return {};
        const counts: Record<string, number> = {};
        ids.forEach((id) => { counts[id] = 0; });
        (data || []).forEach((row: { signal_id: string }) => {
          counts[row.signal_id] = (counts[row.signal_id] ?? 0) + 1;
        });
        return counts;
      } catch {
        return {};
      }
    },
    enabled: !!signals && signals.length > 0,
  });

  // Fetch WhatsApp groups
  const { data: whatsappGroups, isLoading: groupsLoading, refetch: refetchGroups } = useQuery<WhatsAppGroup[]>({
    queryKey: ["whatsapp-groups"],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const { data, error } = await supabase
        .from("whatsapp_groups")
        .select("*")
        .eq("is_active", true)
        .eq("month_year", currentMonth)
        .order("group_number", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Refresh groups mutation
  const refreshGroupsMutation = useMutation({
    mutationFn: async () => {
      const SUPABASE_URL = "https://iurstpwtdnlmpvwyhqfn.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1cnN0cHd0ZG5sbXB2d3locWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjAzNDMsImV4cCI6MjA4MTQzNjM0M30.pGCrGsPACMxGgsnMDZf-J-kszQPB1N5y008w_KOj-3o";

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/refresh-whatsapp-groups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "apikey": SUPABASE_ANON_KEY,
          },
        }
      );

      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = "Failed to refresh groups";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      try {
        return JSON.parse(responseText);
      } catch {
        throw new Error("Invalid response from server");
      }
    },
    onSuccess: (data) => {
      showSuccess(`Groups refreshed successfully! ${data.subscribersAdded || 0} subscribers added to ${data.groups?.length || 0} groups.`);
      refetchGroups();
      setIsRefreshingGroups(false);
    },
    onError: (error: any) => {
      showError(error.message || "Failed to refresh groups");
      setIsRefreshingGroups(false);
    },
  });

  const handleRefreshGroups = () => {
    setIsRefreshingGroups(true);
    refreshGroupsMutation.mutate();
  };

  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: PricingFormValues }) => {
      const { error } = await supabase
        .from("signal_pricing")
        .update({
          price: values.price,
          currency: values.currency,
          description: values.description || null,
          is_active: values.is_active,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-pricing"] });
      showSuccess("Pricing updated successfully");
      setIsDialogOpen(false);
      setSelectedPricing(null);
      form.reset();
    },
    onError: (error: any) => {
      showError(error.message || "Failed to update pricing");
    },
  });

  const handleEdit = (pricing: SignalPricing) => {
    setSelectedPricing(pricing);
    form.reset({
      price: pricing.price,
      currency: pricing.currency === "USD" ? "USD" : "TZS",
      description: pricing.description || "",
      is_active: pricing.is_active,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: PricingFormValues) => {
    if (selectedPricing) {
      updatePricingMutation.mutate({ id: selectedPricing.id, values });
    }
  };

  // Create signal mutation
  const createSignalMutation = useMutation({
    mutationFn: async (values: SignalFormValues) => {
      const { data, error } = await supabase
        .from("signals")
        .insert({
          trading_pair: values.trading_pair,
          signal_type: values.signal_type,
          entry_price: values.entry_price,
          stop_loss: values.stop_loss,
          take_profit_1: values.take_profit_1 || null,
          take_profit_2: values.take_profit_2 || null,
          take_profit_3: values.take_profit_3 || null,
          title: values.title,
          analysis: values.analysis || null,
          confidence_level: values.confidence_level || null,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (signal) => {
      showSuccess("Signal created successfully!");

      // Call Edge Function to send WhatsApp notifications
      try {
        const SUPABASE_URL = "https://iurstpwtdnlmpvwyhqfn.supabase.co";
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1cnN0cHd0ZG5sbXB2d3locWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjAzNDMsImV4cCI6MjA4MTQzNjM0M30.pGCrGsPACMxGgsnMDZf-J-kszQPB1N5y008w_KOj-3o";

        console.log('Calling WhatsApp Edge Function for signal:', signal.id);

        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/send-whatsapp-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ signalId: signal.id }),
          }
        );

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        // Check if response has content
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (!responseText) {
          showError('Signal created but Edge Function returned empty response. Check if function is deployed.');
          setIsSignalDialogOpen(false);
          signalForm.reset();
          return;
        }

        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          showError(`Signal created but Edge Function returned invalid response: ${responseText.substring(0, 100)}`);
          setIsSignalDialogOpen(false);
          signalForm.reset();
          return;
        }

        console.log('Response data:', result);

        if (response.ok) {
          const successMsg = result.successCount 
            ? `WhatsApp notifications sent to ${result.successCount} of ${result.totalSubscribers} subscribers!`
            : `Signal created but no notifications were sent.`;
          
          if (result.warning) {
            showError(result.warning); // Show warning as error for visibility
            setTimeout(() => showSuccess(successMsg), 3000); // Then show success
          } else if (result.failureCount > 0) {
            showError(`${result.failureCount} notifications failed. ${successMsg}`);
          } else {
            showSuccess(successMsg);
          }
        } else {
          console.error('WhatsApp notification error:', result);
          showError(`Signal created but WhatsApp notifications failed: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error calling WhatsApp function:', error);
        showError(`Signal created but failed to send WhatsApp notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Create in-app notifications for subscribed users
      try {
        console.log('Creating in-app notifications for signal:', signal.id);

        // Fetch all users with active signal subscriptions
        const { data: subscriptions, error: subsError } = await supabase
          .from('signal_subscriptions')
          .select('user_id')
          .eq('status', 'active');

        if (subsError) {
          console.error('Error fetching subscriptions:', subsError);
        } else if (subscriptions && subscriptions.length > 0) {
          const userIds = subscriptions.map(sub => sub.user_id);
          const { title, message } = formatSignalNotification({
            title: signal.title,
            trading_pair: signal.trading_pair,
            signal_type: signal.signal_type,
            entry_price: signal.entry_price,
          });

          await createNotificationForUsers(userIds, {
            notification_type: 'signal',
            title,
            message,
            action_url: '/dashboard/signals',
            metadata: {
              signal_id: signal.id,
              trading_pair: signal.trading_pair,
              signal_type: signal.signal_type,
            },
          });

          console.log(`In-app notifications created for ${userIds.length} users`);
        } else {
          console.log('No active signal subscriptions found');
        }
      } catch (error) {
        console.error('Error creating in-app notifications:', error);
        // Don't show error to user - notifications are not critical
      }

      setIsSignalDialogOpen(false);
      signalForm.reset();
    },
    onError: (error: any) => {
      showError(error.message || "Failed to create signal");
    },
  });

  const onSignalSubmit = (values: SignalFormValues) => {
    if (selectedSignal) {
      updateSignalMutation.mutate({ id: selectedSignal.id, values });
    } else {
      createSignalMutation.mutate(values);
    }
  };

  // Delete signal mutation
  const deleteSignalMutation = useMutation({
    mutationFn: async (signalId: string) => {
      const { error } = await supabase
        .from("signals")
        .delete()
        .eq("id", signalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      showSuccess("Signal deleted successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Failed to delete signal");
    },
  });

  // Update signal mutation
  const updateSignalMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SignalFormValues }) => {
      const payload = {
        trading_pair: values.trading_pair,
        signal_type: values.signal_type,
        entry_price: Number(values.entry_price),
        stop_loss: Number(values.stop_loss),
        take_profit_1: values.take_profit_1 != null && values.take_profit_1 !== "" ? Number(values.take_profit_1) : null,
        take_profit_2: values.take_profit_2 != null && values.take_profit_2 !== "" ? Number(values.take_profit_2) : null,
        take_profit_3: values.take_profit_3 != null && values.take_profit_3 !== "" ? Number(values.take_profit_3) : null,
        title: values.title,
        analysis: values.analysis || null,
        confidence_level: values.confidence_level || null,
      };
      const { error } = await supabase
        .from("signals")
        .update(payload)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
      queryClient.invalidateQueries({ queryKey: ["signal-update-counts"] });
      showSuccess("Signal updated successfully. Changes are stored and notifications sent.");
      setIsSignalDialogOpen(false);
      setSelectedSignal(null);
      signalForm.reset();
    },
    onError: (error: any) => {
      showError(error.message || "Failed to update signal");
    },
  });

  const openHistoryDialog = async (signal: Signal) => {
    setSignalForHistory(signal);
    setHistoryError(null);
    setSignalUpdates([]);
    setIsHistoryDialogOpen(true);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("signal_updates")
        .select("*")
        .eq("signal_id", signal.id)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Signal updates fetch error:", error);
        setHistoryError(error.message || "Failed to load update history");
        showError(error.message || "Failed to load update history. Ensure the signal_updates migration has been run.");
      } else {
        setSignalUpdates(data || []);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load update history";
      setHistoryError(msg);
      showError(msg);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryDialog = (open: boolean) => {
    if (!open) {
      setSignalForHistory(null);
      setSignalUpdates([]);
      setHistoryError(null);
    }
    setIsHistoryDialogOpen(open);
  };

  const handleEditSignal = (signal: Signal) => {
    setSelectedSignal(signal);
    signalForm.reset({
      trading_pair: signal.trading_pair,
      signal_type: signal.signal_type,
      entry_price: signal.entry_price,
      stop_loss: signal.stop_loss,
      take_profit_1: signal.take_profit_1 || undefined,
      take_profit_2: signal.take_profit_2 || undefined,
      take_profit_3: signal.take_profit_3 || undefined,
      title: signal.title,
      analysis: signal.analysis || "",
      confidence_level: signal.confidence_level || "medium",
    });
    setIsSignalDialogOpen(true);
  };

  const handleDeleteSignal = (signalId: string) => {
    if (confirm("Are you sure you want to delete this signal?")) {
      deleteSignalMutation.mutate(signalId);
    }
  };

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: SubscriptionFormValues }) => {
      const { error } = await supabase
        .from("signal_subscriptions")
        .update({
          status: values.status,
          payment_status: values.payment_status,
          amount_paid: values.amount_paid,
          pips_purchased: values.pips_purchased || 0,
          pips_used: values.pips_used || 0,
          start_date: values.start_date,
          end_date: values.end_date || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-subscriptions"] });
      showSuccess("Subscription updated successfully");
      setIsSubscriptionDialogOpen(false);
      setSelectedSubscription(null);
      subscriptionForm.reset();
    },
    onError: (error: any) => {
      showError(error.message || "Failed to update subscription");
    },
  });

  // Delete subscription mutation
  const deleteSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { error } = await supabase
        .from("signal_subscriptions")
        .delete()
        .eq("id", subscriptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signal-subscriptions"] });
      showSuccess("Subscription deleted successfully");
    },
    onError: (error: any) => {
      showError(error.message || "Failed to delete subscription");
    },
  });

  const handleEditSubscription = (subscription: SignalSubscription) => {
    setSelectedSubscription(subscription);
    subscriptionForm.reset({
      status: subscription.status,
      payment_status: subscription.payment_status,
      amount_paid: subscription.amount_paid,
      pips_purchased: subscription.pips_purchased,
      pips_used: subscription.pips_used,
      start_date: subscription.start_date.split('T')[0], // Format date for input
      end_date: subscription.end_date ? subscription.end_date.split('T')[0] : null,
    });
    setIsSubscriptionDialogOpen(true);
  };

  const handleDeleteSubscription = (subscriptionId: string) => {
    if (confirm("Are you sure you want to delete this subscription? This action cannot be undone.")) {
      deleteSubscriptionMutation.mutate(subscriptionId);
    }
  };

  const onSubscriptionSubmit = (values: SubscriptionFormValues) => {
    if (selectedSubscription) {
      // Convert date strings to ISO format
      const updateValues = {
        ...values,
        start_date: new Date(values.start_date).toISOString(),
        end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
      };
      updateSubscriptionMutation.mutate({ id: selectedSubscription.id, values: updateValues });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: "Active", className: "bg-green-600 text-white" },
      closed: { label: "Closed", className: "bg-blue-600 text-white" },
      inactive: { label: "Inactive", className: "bg-gray-600 text-white" },
      cancelled: { label: "Cancelled", className: "bg-red-600 text-white" },
      expired: { label: "Expired", className: "bg-gray-600 text-white" },
      pending: { label: "Pending", className: "bg-yellow-600 text-white" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: "Completed", className: "bg-green-600 text-white" },
      pending: { label: "Pending", className: "bg-yellow-600 text-white" },
      failed: { label: "Failed", className: "bg-red-600 text-white" },
      expired: { label: "Expired", className: "bg-gray-600 text-white" },
      voided: { label: "Voided", className: "bg-gray-600 text-white" },
      refunded: { label: "Refunded", className: "bg-blue-600 text-white" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  // Calculate statistics
  const stats = {
    totalSubscriptions: subscriptions?.length || 0,
    activeSubscriptions: subscriptions?.filter(s => s.status === "active").length || 0,
    totalRevenue: subscriptions?.reduce((sum, s) => sum + Number(s.amount_paid), 0) || 0,
    monthlySubscribers: subscriptions?.filter(s => s.subscription_type === "monthly" && s.status === "active").length || 0,
    perPipSubscribers: subscriptions?.filter(s => (s.subscription_type === "daily" || s.subscription_type === "weekly") && s.status === "active").length || 0,
  };

  const visibleSubscriptions = (subscriptions ?? []).filter((subscription) => {
    const phone = subscription.user_profiles?.phone_number || "";
    const query = memberQuery.replace(/\s/g, "");
    const matchesQuery = !query || phone.replace(/\s/g, "").includes(query);
    const matchesStatus = memberStatus === "all" || subscription.status === memberStatus;
    return matchesQuery && matchesStatus;
  });

  return (
    <PageTransition>
      <DashboardLayout>
        {/* Header with Stats */}
        <SavannaCard className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <SignalHigh className="text-gold" size={24} />
                <div>
                  <h1 className="text-2xl font-semibold text-white">Signals</h1>
                  <p className="text-rainy-grey text-sm mt-1">
                    Publish signals, set the prices members pay, and see who has access.
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-nero border border-steel-wool rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="text-gold" size={18} />
                  <span className="text-rainy-grey text-sm">Total Subscriptions</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalSubscriptions}</div>
              </div>
              <div className="bg-nero border border-steel-wool rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="text-green-500" size={18} />
                  <span className="text-rainy-grey text-sm">Active</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.activeSubscriptions}</div>
              </div>
              <div className="bg-nero border border-steel-wool rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-gold" size={18} />
                  <span className="text-rainy-grey text-sm">Total Revenue</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalRevenue.toLocaleString()} TZS</div>
              </div>
              <div className="bg-nero border border-steel-wool rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <SignalHigh className="text-blue-500" size={18} />
                  <span className="text-rainy-grey text-sm">Monthly Plans</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.monthlySubscribers}</div>
              </div>
              <div className="bg-nero border border-steel-wool rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <SignalHigh className="text-purple-500" size={18} />
                  <span className="text-rainy-grey text-sm">Daily & Weekly</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.perPipSubscribers}</div>
              </div>
            </div>
          </CardContent>
        </SavannaCard>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-nero border border-steel-wool">
            <TabsTrigger
              value="signals"
              className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black text-rainy-grey"
            >
              Signals Management
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black text-rainy-grey"
            >
              Plans & access
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className="data-[state=active]:bg-gold data-[state=active]:text-cursed-black text-rainy-grey"
            >
              WhatsApp Groups
            </TabsTrigger>
          </TabsList>

          {/* Signals Tab */}
          <TabsContent value="signals" className="space-y-6">
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  setSelectedSignal(null);
                  signalForm.reset();
                  setIsSignalDialogOpen(true);
                }}
                className="bg-gold text-cursed-black hover:bg-gold-dark"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Signal
              </Button>
            </div>
            {/* Signals Table */}
            <ScrollReveal>
              <SavannaCard className="mb-6">
                <CardContent className="p-6">
                  <h2 className="text-slate-200 font-medium mb-4">All Signals</h2>
                  {signalsLoading ? (
                    <div className="text-center py-8 text-rainy-grey">Loading signals...</div>
                  ) : !signals || signals.length === 0 ? (
                    <div className="text-center py-8 text-rainy-grey">No signals created yet</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-steel-wool">
                            <TableHead className="text-rainy-grey">Pair</TableHead>
                            <TableHead className="text-rainy-grey">Type</TableHead>
                            <TableHead className="text-rainy-grey">Entry</TableHead>
                            <TableHead className="text-rainy-grey">SL</TableHead>
                            <TableHead className="text-rainy-grey">TP1</TableHead>
                            <TableHead className="text-rainy-grey">Confidence</TableHead>
                            <TableHead className="text-rainy-grey">Status</TableHead>
                            <TableHead className="text-rainy-grey">Updates</TableHead>
                            <TableHead className="text-rainy-grey">Created</TableHead>
                            <TableHead className="text-rainy-grey text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {signals.map((signal) => (
                            <TableRow key={signal.id} className="border-steel-wool">
                              <TableCell className="text-white font-medium">{signal.trading_pair}</TableCell>
                              <TableCell>
                                <Badge className={signal.signal_type === 'buy' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                                  {signal.signal_type.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-white">{signal.entry_price}</TableCell>
                              <TableCell className="text-white">{signal.stop_loss}</TableCell>
                              <TableCell className="text-white">{signal.take_profit_1 || '-'}</TableCell>
                              <TableCell>
                                {signal.confidence_level && (
                                  <Badge className={
                                    signal.confidence_level === 'high' ? 'bg-green-600 text-white' :
                                      signal.confidence_level === 'medium' ? 'bg-yellow-600 text-white' :
                                        'bg-gray-600 text-white'
                                  }>
                                    {signal.confidence_level.toUpperCase()}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{getStatusBadge(signal.status)}</TableCell>
                              <TableCell>
                                {(signalUpdateCounts?.[signal.id] ?? 0) > 0 ? (
                                  <Badge className="bg-gold text-cursed-black font-medium">
                                    {(signalUpdateCounts?.[signal.id] ?? 0)} update{(signalUpdateCounts?.[signal.id] ?? 0) === 1 ? "" : "s"}
                                  </Badge>
                                ) : (
                                  <span className="text-rainy-grey text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-rainy-grey">
                                {format(new Date(signal.created_at), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openHistoryDialog(signal)}
                                    className="border-steel-wool text-gold hover:bg-steel-wool"
                                    title="View update history"
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditSignal(signal)}
                                    className="border-steel-wool text-gold hover:bg-steel-wool"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteSignal(signal.id)}
                                    className="border-steel-wool text-red-500 hover:bg-steel-wool"
                                    disabled={deleteSignalMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </SavannaCard>
            </ScrollReveal>

          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6" forceMount hidden={activeTab !== "subscriptions"}>

            {/* Pricing Configuration */}
            <SavannaCard className="mb-6">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white">Plans members can buy</h2>
                  <p className="text-rainy-grey text-sm mt-1">
                    A plan appears at checkout only when it is active, priced in TZS, and at least 500 TZS.
                  </p>
                </div>
                {pricingLoading ? (
                  <div className="text-center text-rainy-grey py-8">Loading pricing...</div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {[...(pricingData ?? [])]
                      .sort((a, b) => PLAN_ORDER.indexOf(a.pricing_type) - PLAN_ORDER.indexOf(b.pricing_type))
                      .map((pricing) => {
                        const issue = checkoutIssue(pricing);
                        return (
                      <div
                        key={pricing.id}
                        className="bg-nero border border-steel-wool rounded-lg p-6 space-y-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-white capitalize">
                              {planLabel(pricing.pricing_type)}
                            </h3>
                            <p className="text-rainy-grey text-sm mt-1">{pricing.description}</p>
                          </div>
                          <Badge className={issue ? "bg-yellow-700" : "bg-green-600"}>
                            {issue ? "Hidden" : "At checkout"}
                          </Badge>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-gold">
                            {pricing.currency} {Number(pricing.price).toLocaleString()}
                          </span>
                          <span className="text-rainy-grey">
                            {planSuffix(pricing.pricing_type)}
                          </span>
                        </div>
                        <p className="text-sm text-rainy-grey">{issue || "Members can pay for this plan."}</p>
                        {pricing.features && Array.isArray(pricing.features) && (
                          <ul className="space-y-2">
                            {pricing.features.map((feature, idx) => (
                              <li key={idx} className="text-sm text-rainy-grey flex items-start gap-2">
                                <span className="text-gold mt-1">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <Button
                          onClick={() => handleEdit(pricing)}
                          className="w-full bg-gold text-cursed-black hover:bg-gold-dark"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit plan
                        </Button>
                      </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </SavannaCard>

            <SavannaCard>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white">Payment attempts</h2>
                  <p className="text-rainy-grey text-sm mt-1">
                    Each mobile-money prompt, including ones still waiting for a PIN or that failed.
                  </p>
                </div>
                {paymentsLoading ? (
                  <div className="text-center text-rainy-grey py-8">Loading payments...</div>
                ) : paymentsResult?.error ? (
                  <p className="text-sm text-rainy-grey">{paymentsResult.error}</p>
                ) : !paymentsResult?.rows.length ? (
                  <div className="text-center text-rainy-grey py-8">No payments yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-steel-wool">
                          <TableHead className="text-white">When</TableHead>
                          <TableHead className="text-white">Phone</TableHead>
                          <TableHead className="text-white">Plan</TableHead>
                          <TableHead className="text-white">Provider</TableHead>
                          <TableHead className="text-white">Amount</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-white">Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentsResult.rows.map((payment) => (
                          <TableRow key={payment.id} className="border-steel-wool">
                            <TableCell className="text-rainy-grey whitespace-nowrap">
                              {format(new Date(payment.created_at), "MMM dd, HH:mm")}
                            </TableCell>
                            <TableCell className="text-white">{payment.phone_number}</TableCell>
                            <TableCell className="text-white">{planLabel(payment.subscription_type)}</TableCell>
                            <TableCell className="text-white capitalize">{payment.provider}</TableCell>
                            <TableCell className="text-white">
                              {Number(payment.amount).toLocaleString()} {payment.currency}
                            </TableCell>
                            <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                            <TableCell className="text-rainy-grey max-w-[220px]">{payment.failure_reason || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </SavannaCard>

            {/* Subscriptions Table */}
            <SavannaCard>
              <CardContent className="p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Member access</h2>
                    <p className="text-rainy-grey text-sm mt-1">Who currently has a signal subscription.</p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={memberQuery}
                      onChange={(event) => setMemberQuery(event.target.value)}
                      placeholder="Search phone"
                      className="bg-nero border-steel-wool text-white w-40"
                    />
                    <Select value={memberStatus} onValueChange={setMemberStatus}>
                      <SelectTrigger className="bg-nero border-steel-wool text-white w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-nero border-steel-wool">
                        <SelectItem value="all" className="text-white">All statuses</SelectItem>
                        <SelectItem value="active" className="text-white">Active</SelectItem>
                        <SelectItem value="expired" className="text-white">Expired</SelectItem>
                        <SelectItem value="pending" className="text-white">Pending</SelectItem>
                        <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {subscriptionsLoading ? (
                  <div className="text-center text-rainy-grey py-8">Loading subscriptions...</div>
                ) : (subscriptions?.length ?? 0) === 0 ? (
                  <div className="text-center text-rainy-grey py-8">No subscriptions yet</div>
                ) : visibleSubscriptions.length === 0 ? (
                  <div className="text-center text-rainy-grey py-8">No subscriptions match this filter</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-steel-wool hover:bg-nero/50">
                          <TableHead className="text-white">Phone Number</TableHead>
                          <TableHead className="text-white">Type</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-white">Payment</TableHead>
                          <TableHead className="text-white">Amount</TableHead>
                          <TableHead className="text-white">Pips</TableHead>
                          <TableHead className="text-white">Start Date</TableHead>
                          <TableHead className="text-white">End Date</TableHead>
                          <TableHead className="text-white text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleSubscriptions.map((subscription) => (
                          <TableRow key={subscription.id} className="border-steel-wool hover:bg-nero/50">
                            <TableCell className="text-white">
                              {subscription.user_profiles?.phone_number || "N/A"}
                            </TableCell>
                            <TableCell className="text-white capitalize">
                              {planLabel(subscription.subscription_type)}
                            </TableCell>
                            <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                            <TableCell>{getPaymentStatusBadge(subscription.payment_status)}</TableCell>
                            <TableCell className="text-white">{Number(subscription.amount_paid).toLocaleString()} TZS</TableCell>
                            <TableCell className="text-white">
                              {subscription.subscription_type === "per_pip"
                                ? `${subscription.pips_used}/${subscription.pips_purchased}`
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-rainy-grey">
                              {format(new Date(subscription.start_date), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell className="text-rainy-grey">
                              {subscription.end_date
                                ? format(new Date(subscription.end_date), "MMM dd, yyyy")
                                : "N/A"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditSubscription(subscription)}
                                  className="border-steel-wool text-gold hover:bg-steel-wool"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteSubscription(subscription.id)}
                                  className="border-steel-wool text-red-500 hover:bg-steel-wool"
                                  disabled={deleteSubscriptionMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </SavannaCard>

            {/* Edit Pricing Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="bg-black border-steel-wool text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Edit {planLabel(selectedPricing?.pricing_type || "")} plan
                  </DialogTitle>
                  <DialogDescription className="text-rainy-grey">
                    Members only see this plan when it is active, in TZS, and at least 500.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">
                            Price {planSuffix(selectedPricing?.pricing_type || "")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              className="bg-nero border-steel-wool text-white"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                          {selectedPricing && checkoutIssue({
                            price: Number(form.watch("price")) || 0,
                            currency: form.watch("currency"),
                            is_active: form.watch("is_active"),
                            pricing_type: selectedPricing.pricing_type,
                          }) && (
                            <p className="text-sm text-yellow-400">
                              {checkoutIssue({
                                price: Number(form.watch("price")) || 0,
                                currency: form.watch("currency"),
                                is_active: form.watch("is_active"),
                                pricing_type: selectedPricing.pricing_type,
                              })}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Currency</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="bg-nero border-steel-wool text-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-nero border-steel-wool">
                              <SelectItem value="TZS" className="text-white">TZS</SelectItem>
                              <SelectItem value="USD" className="text-white">USD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief description of this pricing plan"
                              className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border border-steel-wool p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-white">Active Status</FormLabel>
                            <div className="text-sm text-rainy-grey">
                              Enable or disable this pricing option
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setSelectedPricing(null);
                          form.reset();
                        }}
                        className="border-steel-wool text-rainy-grey"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gold text-cursed-black hover:bg-gold-dark"
                        disabled={updatePricingMutation.isPending}
                      >
                        Update Pricing
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Edit Subscription Dialog */}
            <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
              <DialogContent className="bg-black border-steel-wool text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">Edit Subscription</DialogTitle>
                  <DialogDescription className="text-rainy-grey">
                    Update subscription details for user: {selectedSubscription?.user_profiles?.phone_number || "N/A"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...subscriptionForm}>
                  <form onSubmit={subscriptionForm.handleSubmit(onSubscriptionSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={subscriptionForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Status</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="bg-nero border-steel-wool text-white">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-nero border-steel-wool">
                                <SelectItem value="active" className="text-white">Active</SelectItem>
                                <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                                <SelectItem value="expired" className="text-white">Expired</SelectItem>
                                <SelectItem value="pending" className="text-white">Pending</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={subscriptionForm.control}
                        name="payment_status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Payment Status</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="bg-nero border-steel-wool text-white">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-nero border-steel-wool">
                                <SelectItem value="pending" className="text-white">Pending</SelectItem>
                                <SelectItem value="completed" className="text-white">Completed</SelectItem>
                                <SelectItem value="failed" className="text-white">Failed</SelectItem>
                                <SelectItem value="refunded" className="text-white">Refunded</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={subscriptionForm.control}
                      name="amount_paid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Amount Paid</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              className="bg-nero border-steel-wool text-white"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedSubscription?.subscription_type === "per_pip" && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={subscriptionForm.control}
                          name="pips_purchased"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Pips Purchased</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="bg-nero border-steel-wool text-white"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  value={field.value || 0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={subscriptionForm.control}
                          name="pips_used"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Pips Used</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  className="bg-nero border-steel-wool text-white"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  value={field.value || 0}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={subscriptionForm.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Start Date</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="bg-nero border-steel-wool text-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={subscriptionForm.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">End Date (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="bg-nero border-steel-wool text-white"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsSubscriptionDialogOpen(false);
                          setSelectedSubscription(null);
                          subscriptionForm.reset();
                        }}
                        className="border-steel-wool text-rainy-grey"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gold text-cursed-black hover:bg-gold-dark"
                        disabled={updateSubscriptionMutation.isPending}
                      >
                        {updateSubscriptionMutation.isPending ? "Updating..." : "Update Subscription"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Create / Edit Signal Dialog */}
            <Dialog open={isSignalDialogOpen} onOpenChange={setIsSignalDialogOpen}>
              <DialogContent className="bg-black border-steel-wool text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {selectedSignal ? "Edit Signal" : "Create New Signal"}
                  </DialogTitle>
                  <DialogDescription className="text-rainy-grey">
                    {selectedSignal
                      ? "Update the signal. Changes are stored in history and in-app notifications are sent to subscribers."
                      : "Create a new trading signal. WhatsApp notifications will be sent automatically to all active subscribers."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...signalForm}>
                  <form onSubmit={signalForm.handleSubmit(onSignalSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={signalForm.control}
                        name="trading_pair"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Trading Pair</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., EUR/USD"
                                className="bg-nero border-steel-wool text-white"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signalForm.control}
                        name="signal_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Signal Type</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="bg-nero border-steel-wool text-white">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-nero border-steel-wool">
                                <SelectItem value="buy" className="text-white">Buy</SelectItem>
                                <SelectItem value="sell" className="text-white">Sell</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={signalForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., EUR/USD Bullish Breakout"
                              className="bg-nero border-steel-wool text-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={signalForm.control}
                        name="entry_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Entry Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.00001"
                                placeholder="1.08500"
                                className="bg-nero border-steel-wool text-white"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signalForm.control}
                        name="stop_loss"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Stop Loss</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.00001"
                                placeholder="1.08200"
                                className="bg-nero border-steel-wool text-white"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={signalForm.control}
                        name="take_profit_1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">TP1 (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.00001"
                                placeholder="1.09000"
                                className="bg-nero border-steel-wool text-white"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signalForm.control}
                        name="take_profit_2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">TP2 (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.00001"
                                placeholder="1.09500"
                                className="bg-nero border-steel-wool text-white"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signalForm.control}
                        name="take_profit_3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">TP3 (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.00001"
                                placeholder="1.10000"
                                className="bg-nero border-steel-wool text-white"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={signalForm.control}
                      name="confidence_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Confidence Level</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="bg-nero border-steel-wool text-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-nero border-steel-wool">
                              <SelectItem value="low" className="text-white">Low</SelectItem>
                              <SelectItem value="medium" className="text-white">Medium</SelectItem>
                              <SelectItem value="high" className="text-white">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signalForm.control}
                      name="analysis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Analysis (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide detailed analysis of the signal..."
                              className="bg-nero border-steel-wool text-white placeholder:text-rainy-grey min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedSignal(null);
                          setIsSignalDialogOpen(false);
                          signalForm.reset();
                        }}
                        className="border-steel-wool text-rainy-grey"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gold text-cursed-black hover:bg-gold-dark"
                        disabled={createSignalMutation.isPending || updateSignalMutation.isPending}
                      >
                        {selectedSignal
                          ? (updateSignalMutation.isPending ? "Updating..." : "Update Signal")
                          : (createSignalMutation.isPending ? "Creating..." : "Create Signal")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Signal Update History Dialog */}
            <Dialog open={isHistoryDialogOpen} onOpenChange={closeHistoryDialog}>
              <DialogContent className="bg-black border-steel-wool text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <History className="h-5 w-5 text-gold" />
                    Update history {signalForHistory && `— ${signalForHistory.trading_pair}`}
                  </DialogTitle>
                  <DialogDescription className="text-rainy-grey">
                    Initial state and all changes (SL, TP, etc.) are stored separately. Subscribers receive notifications on each update.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {historyLoading ? (
                    <div className="text-center py-8 text-rainy-grey">Loading history...</div>
                  ) : historyError ? (
                    <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                      <p className="text-red-400 text-sm">{historyError}</p>
                      <p className="text-rainy-grey text-xs mt-2">Run the migration 20260207000000_create_signal_updates.sql if the signal_updates table does not exist yet.</p>
                    </div>
                  ) : signalUpdates.length === 0 ? (
                    <p className="text-rainy-grey text-sm">No updates recorded for this signal yet.</p>
                  ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {signalUpdates.map((rev) => (
                        <div
                          key={rev.id}
                          className="rounded-lg border border-steel-wool bg-nero/50 p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="border-gold text-gold text-xs">
                              {rev.revision_type === "initial" ? "Initial state (before first update)" : "Update"}
                            </Badge>
                            <span className="text-rainy-grey text-xs">
                              {format(new Date(rev.created_at), "MMM dd, yyyy HH:mm")}
                            </span>
                          </div>
                          {rev.revision_type === "initial" && rev.snapshot && typeof rev.snapshot === "object" && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                              {Object.entries(rev.snapshot).map(([key, val]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-rainy-grey">{SIGNAL_UPDATE_FIELD_LABELS[key] ?? key}</span>
                                  <span className="text-white">{val != null ? String(val) : "—"}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {rev.revision_type === "update" && rev.changes && typeof rev.changes === "object" && (
                            <div className="space-y-1 text-sm">
                              {Object.entries(rev.changes).map(([field, change]) => {
                                const c = change as { old?: number | string | null; new?: number | string | null };
                                return (
                                  <div key={field} className="flex justify-between items-center">
                                    <span className="text-rainy-grey">{SIGNAL_UPDATE_FIELD_LABELS[field] ?? field}</span>
                                    <span className="text-gold">
                                      {c.old != null ? String(c.old) : "—"} → {c.new != null ? String(c.new) : "—"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => closeHistoryDialog(false)}
                    className="border-steel-wool text-rainy-grey"
                  >
                    Close
                  </Button>
                  {signalForHistory && (
                    <Button
                      type="button"
                      className="bg-gold text-cursed-black hover:bg-gold-dark"
                      onClick={() => {
                        closeHistoryDialog(false);
                        handleEditSignal(signalForHistory);
                        setIsSignalDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit this signal
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* WhatsApp Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            <ScrollReveal>
              <SavannaCard className="mb-6">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-slate-200 font-medium">WhatsApp Groups Management</h2>
                    <Button
                      onClick={handleRefreshGroups}
                      disabled={isRefreshingGroups}
                      className="bg-gold text-cursed-black hover:bg-gold-dark"
                    >
                      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshingGroups ? 'animate-spin' : ''}`} />
                      {isRefreshingGroups ? "Refreshing..." : "Refresh Groups"}
                    </Button>
                  </div>

                  {groupsLoading ? (
                    <div className="text-center py-8 text-rainy-grey">Loading groups...</div>
                  ) : !whatsappGroups || whatsappGroups.length === 0 ? (
                    <div className="text-center py-8 text-rainy-grey">
                      <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No active WhatsApp groups found for this month.</p>
                      <p className="text-sm mt-2">Click "Refresh Groups" to create groups and migrate subscribers.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {whatsappGroups.map((group) => (
                          <div
                            key={group.id}
                            className="bg-nero border border-steel-wool rounded-lg p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-white font-medium">{group.group_name}</h3>
                                <p className="text-rainy-grey text-sm">Group #{group.group_number}</p>
                              </div>
                              <Badge
                                className={group.is_active ? "bg-green-600" : "bg-gray-600"}
                              >
                                {group.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-rainy-grey">Members:</span>
                                <span className="text-white font-medium">
                                  {group.member_count} / {group.max_members}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-rainy-grey">Month:</span>
                                <span className="text-white">{group.month_year}</span>
                              </div>
                              <div className="w-full bg-steel-wool rounded-full h-2 mt-2">
                                <div
                                  className="bg-gold h-2 rounded-full"
                                  style={{
                                    width: `${Math.min((group.member_count / group.max_members) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-steel-wool">
                              <p className="text-xs text-rainy-grey break-all">
                                JID: {group.group_jid}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 p-4 bg-nero border border-steel-wool rounded-lg">
                        <h3 className="text-white font-medium mb-2">Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-rainy-grey">Total Groups:</span>
                            <span className="text-white font-medium ml-2">{whatsappGroups.length}</span>
                          </div>
                          <div>
                            <span className="text-rainy-grey">Total Members:</span>
                            <span className="text-white font-medium ml-2">
                              {whatsappGroups.reduce((sum, g) => sum + g.member_count, 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-rainy-grey">Capacity Used:</span>
                            <span className="text-white font-medium ml-2">
                              {(
                                (whatsappGroups.reduce((sum, g) => sum + g.member_count, 0) /
                                  (whatsappGroups.reduce((sum, g) => sum + g.max_members, 0))) *
                                100
                              ).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-rainy-grey">Current Month:</span>
                            <span className="text-white font-medium ml-2">
                              {whatsappGroups[0]?.month_year || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </SavannaCard>
            </ScrollReveal>
          </TabsContent>
        </Tabs>          </DashboardLayout>
    </PageTransition>
  );
};

export default AdminSignals;
