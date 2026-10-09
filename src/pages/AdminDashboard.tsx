"use client";

import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout.tsx";
import { CardContent } from "@/components/ui/card";
import SavannaCard from "@/components/dashboard/SavannaCard";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import supabase from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/lib/animations";
import { format } from "date-fns";

interface PaymentRow {
  id: string;
  phone_number: string;
  subscription_type: string;
  amount: number;
  currency: string;
  status: string;
  failure_reason: string | null;
  created_at: string;
}

interface SubscriptionRow {
  status: string;
  payment_status: string;
  amount_paid: number | string;
  end_date: string | null;
  subscription_type: string;
}

interface EnquiryRow {
  id: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
}

interface SignalRow {
  id: string;
  trading_pair: string;
  signal_type: string;
  status: string;
  created_at: string;
}

interface Overview {
  monthRevenue: number;
  activeMembers: number;
  planCounts: { daily: number; weekly: number; monthly: number };
  pendingPayments: number;
  failedPayments: number;
  openEnquiries: number;
  payments: PaymentRow[];
  enquiries: EnquiryRow[];
  signals: SignalRow[];
  paymentsError: string | null;
}

function isCurrentAccess(row: SubscriptionRow) {
  if (row.status !== "active" || row.payment_status !== "completed") return false;
  if (!(Number(row.amount_paid) > 0) || !row.end_date) return false;
  return new Date(row.end_date).getTime() > Date.now();
}

const statusClass: Record<string, string> = {
  completed: "text-green-400",
  pending: "text-yellow-400",
  failed: "text-red-400",
  expired: "text-rainy-grey",
  voided: "text-rainy-grey",
  active: "text-green-400",
  buy: "text-green-400",
  sell: "text-red-400",
};

const AdminDashboard: React.FC = () => {
  const { session } = useSupabaseSession();
  const firstName = session?.user?.user_metadata?.first_name || "there";

  const { data, isLoading } = useQuery<Overview>({
    queryKey: ["admin-overview"],
    refetchInterval: 30000,
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [paymentsRes, subscriptionsRes, enquiriesRes, signalsRes] = await Promise.all([
        supabase
          .from("signal_payments")
          .select("id, phone_number, subscription_type, amount, currency, status, failure_reason, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("signal_subscriptions")
          .select("status, payment_status, amount_paid, end_date, subscription_type"),
        supabase
          .from("enquiries")
          .select("id, name, subject, status, created_at")
          .in("status", ["pending", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("signals")
          .select("id, trading_pair, signal_type, status, created_at")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const payments = (paymentsRes.data ?? []) as PaymentRow[];
      const subscriptions = (subscriptionsRes.data ?? []) as SubscriptionRow[];
      const active = subscriptions.filter(isCurrentAccess);

      const { data: monthPayments } = await supabase
        .from("signal_payments")
        .select("amount, currency, status, created_at")
        .eq("status", "completed")
        .gte("created_at", monthStart.toISOString());

      const monthRevenue = (monthPayments ?? [])
        .filter((row) => row.currency === "TZS")
        .reduce((sum, row) => sum + Number(row.amount), 0);

      const { count: pendingPayments } = await supabase
        .from("signal_payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      const { count: failedPayments } = await supabase
        .from("signal_payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed");

      const { count: openEnquiryCount } = await supabase
        .from("enquiries")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "in_progress"]);

      return {
        monthRevenue,
        activeMembers: active.length,
        planCounts: {
          daily: active.filter((row) => row.subscription_type === "daily").length,
          weekly: active.filter((row) => row.subscription_type === "weekly").length,
          monthly: active.filter((row) => row.subscription_type === "monthly").length,
        },
        pendingPayments: pendingPayments ?? 0,
        failedPayments: failedPayments ?? 0,
        openEnquiries: openEnquiryCount ?? 0,
        payments,
        enquiries: (enquiriesRes.data ?? []) as EnquiryRow[],
        signals: (signalsRes.data ?? []) as SignalRow[],
        paymentsError: paymentsRes.error?.message ?? null,
      };
    },
  });

  const metrics = [
    {
      label: "Collected this month",
      value: data ? `${data.monthRevenue.toLocaleString()} TZS` : "—",
      detail: "Completed signal payments",
    },
    {
      label: "Members with access",
      value: data ? String(data.activeMembers) : "—",
      detail: data
        ? `${data.planCounts.daily} daily · ${data.planCounts.weekly} weekly · ${data.planCounts.monthly} monthly`
        : "Paid and still in date",
    },
    {
      label: "Payments waiting",
      value: data ? String(data.pendingPayments) : "—",
      detail: data ? `${data.failedPayments} failed` : "PIN not entered yet",
    },
    {
      label: "Enquiries to answer",
      value: data ? String(data.openEnquiries) : "—",
      detail: "Pending or in progress",
    },
  ];

  return (
    <PageTransition>
      <DashboardLayout>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white">
              {format(new Date(), "EEEE, d MMMM")}
            </h1>
            <p className="text-rainy-grey text-sm mt-1">Welcome back, {firstName}.</p>
          </div>
          <a
            href="/dashboard?view=member"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10"
          >
            Open member app
          </a>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6">
          {metrics.map((metric) => (
            <SavannaCard key={metric.label}>
              <CardContent className="p-4">
                <p className="text-rainy-grey text-xs">{metric.label}</p>
                <p className="text-white text-xl sm:text-2xl font-semibold mt-1">
                  {isLoading ? "…" : metric.value}
                </p>
                <p className="text-rainy-grey text-xs mt-1">{metric.detail}</p>
              </CardContent>
            </SavannaCard>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <SavannaCard className="lg:col-span-3">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-medium">Latest payments</h2>
                <Link to="/admin/signals" className="text-gold text-sm hover:underline">Plans & access</Link>
              </div>
              {data?.paymentsError ? (
                <p className="text-sm text-rainy-grey">{data.paymentsError}</p>
              ) : !data?.payments.length ? (
                <p className="text-sm text-rainy-grey">{isLoading ? "Loading…" : "No payments yet."}</p>
              ) : (
                <ul className="divide-y divide-steel-wool/40">
                  {data.payments.map((payment) => (
                    <li key={payment.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="text-white">{payment.phone_number}</p>
                        <p className="text-rainy-grey text-xs mt-0.5 capitalize">
                          {payment.subscription_type} · {format(new Date(payment.created_at), "d MMM, HH:mm")}
                        </p>
                        {payment.failure_reason && (
                          <p className="text-red-400 text-xs mt-1">{payment.failure_reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-white">{Number(payment.amount).toLocaleString()} {payment.currency}</p>
                        <p className={`text-xs capitalize mt-0.5 ${statusClass[payment.status] || "text-rainy-grey"}`}>
                          {payment.status}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </SavannaCard>

          <div className="lg:col-span-2 space-y-4">
            <SavannaCard>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-medium">Open enquiries</h2>
                  <Link to="/admin/enquiries" className="text-gold text-sm hover:underline">All</Link>
                </div>
                {!data?.enquiries.length ? (
                  <p className="text-sm text-rainy-grey">{isLoading ? "Loading…" : "Nothing waiting."}</p>
                ) : (
                  <ul className="space-y-3">
                    {data.enquiries.map((enquiry) => (
                      <li key={enquiry.id}>
                        <p className="text-white text-sm">{enquiry.subject}</p>
                        <p className="text-rainy-grey text-xs mt-0.5">
                          {enquiry.name} · {enquiry.status.replace("_", " ")} · {format(new Date(enquiry.created_at), "d MMM")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </SavannaCard>

            <SavannaCard>
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-medium">Recent signals</h2>
                  <Link to="/admin/signals" className="text-gold text-sm hover:underline">Manage</Link>
                </div>
                {!data?.signals.length ? (
                  <p className="text-sm text-rainy-grey">{isLoading ? "Loading…" : "No signals published."}</p>
                ) : (
                  <ul className="space-y-3">
                    {data.signals.map((signal) => (
                      <li key={signal.id} className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <p className="text-white">{signal.trading_pair}</p>
                          <p className="text-rainy-grey text-xs mt-0.5">{format(new Date(signal.created_at), "d MMM, HH:mm")}</p>
                        </div>
                        <p className={`uppercase text-xs ${statusClass[signal.signal_type] || "text-rainy-grey"}`}>
                          {signal.signal_type} · {signal.status}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </SavannaCard>
          </div>
        </div>
      </DashboardLayout>
    </PageTransition>
  );
};

export default AdminDashboard;
