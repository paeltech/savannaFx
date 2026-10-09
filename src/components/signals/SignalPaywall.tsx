"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import supabase from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/components/auth/SupabaseSessionProvider";
import type { SignalPricing } from "@shared/types/signal";
import {
  SIGNAL_DURATIONS,
  SIGNAL_PROVIDERS,
  formatTzs,
  normalizeTzPhone,
  phoneMatchesProvider,
  providerForPhone,
  type SignalDuration,
  type SignalProviderId,
} from "@shared/utils/signal-payment";

type Phase = "form" | "waiting";

interface PendingPayment {
  payment_id: string;
  status: string;
  subscription_type?: string;
  phone_number?: string;
}

async function readInvokeError(error: unknown): Promise<PendingPayment & { error?: string } | null> {
  const context = (error as { context?: Response })?.context;
  if (!context || typeof context.json !== "function") return null;
  try {
    return await context.json();
  } catch {
    return null;
  }
}

const SignalPaywall: React.FC<{ onPaid: () => void }> = ({ onPaid }) => {
  const { session } = useSupabaseSession();
  const [plans, setPlans] = useState<SignalPricing[]>([]);
  const [duration, setDuration] = useState<SignalDuration>("monthly");
  const [provider, setProvider] = useState<SignalProviderId>("mpesa");
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const userId = session?.user?.id;
      if (!userId) return;
      const [{ data: pricing }, { data: profile }, { data: pending }] = await Promise.all([
        supabase.from("signal_pricing").select("*").eq("is_active", true).order("price"),
        supabase.from("user_profiles").select("phone_number").eq("id", userId).maybeSingle(),
        supabase
          .from("signal_payments")
          .select("id, status, subscription_type, phone_number, provider")
          .eq("user_id", userId)
          .eq("status", "pending")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setPlans((pricing as SignalPricing[]) ?? []);
      const defaultPhone = profile?.phone_number || "";
      setPhone(defaultPhone);
      const detected = providerForPhone(defaultPhone);
      if (detected) setProvider(detected);
      if (pending?.id) {
        setPaymentId(pending.id);
        setPhase("waiting");
        if (pending.phone_number) setPhone(pending.phone_number);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (phase !== "waiting" || !paymentId) return;
    let stopped = false;

    const check = async () => {
      const { data } = await supabase
        .from("signal_payments")
        .select("status, failure_reason")
        .eq("id", paymentId)
        .maybeSingle();
      if (stopped || !data) return;
      if (data.status === "completed") {
        onPaidRef.current();
        return;
      }
      if (data.status === "failed" || data.status === "expired" || data.status === "voided") {
        setPhase("form");
        setPaymentId(null);
        setMessage(data.failure_reason || "The payment was not completed. You can try again.");
      }
    };

    check();
    const timer = window.setInterval(check, 3000);
    const channel = supabase
      .channel(`signal-payment-${paymentId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "signal_payments", filter: `id=eq.${paymentId}` },
        () => { check(); },
      )
      .subscribe();

    return () => {
      stopped = true;
      window.clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [phase, paymentId]);

  const selectedPlan = plans.find((plan) => plan.pricing_type === duration);

  const confirm = async () => {
    setMessage(null);
    if (!normalizeTzPhone(phone)) {
      setMessage("Enter a valid Tanzanian phone number.");
      return;
    }
    if (!phoneMatchesProvider(phone, provider)) {
      setMessage("That number does not match the selected provider.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("create-signal-payment", {
      body: { subscription_type: duration, provider, phone_number: phone },
    });
    setSubmitting(false);
    if (error) {
      const payload = await readInvokeError(error);
      if (payload?.payment_id) {
        setPaymentId(payload.payment_id);
        setPhase("waiting");
        return;
      }
      setMessage(payload?.error || "Could not start the payment. Try again.");
      return;
    }
    if (data?.payment_id) {
      setPaymentId(data.payment_id);
      setPhase("waiting");
      return;
    }
    setMessage(data?.error || "Could not start the payment. Try again.");
  };

  if (phase === "waiting") {
    return (
      <div className="rounded-lg border border-gold/30 bg-nero/40 p-6 text-center">
        <h2 className="text-xl font-semibold text-white">Approve the USSD prompt on your phone</h2>
        <p className="text-rainy-grey text-sm mt-2">
          Enter your mobile money PIN to finish. This page updates when the payment is confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-steel-wool/50 bg-nero/40 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Pay for signals</h2>
        <p className="text-rainy-grey text-sm mt-1">
          Choose a duration and confirm the number that should receive the USSD prompt.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {SIGNAL_DURATIONS.map((option) => {
          const plan = plans.find((item) => item.pricing_type === option.id);
          const active = duration === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setDuration(option.id)}
              className={`rounded-lg border p-4 text-left ${active ? "border-gold bg-gold/10" : "border-steel-wool"}`}
            >
              <div className="text-white font-semibold">{option.label}</div>
              <div className="text-gold mt-1">{plan ? formatTzs(Number(plan.price)) : "—"}</div>
              <div className="text-rainy-grey text-xs mt-1">{option.days} day{option.days === 1 ? "" : "s"}</div>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label className="text-white">Provider</Label>
        <div className="grid grid-cols-2 gap-2">
          {SIGNAL_PROVIDERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setProvider(option.id)}
              className={`rounded-lg border px-3 py-2 text-sm ${provider === option.id ? "border-gold text-white bg-gold/10" : "border-steel-wool text-rainy-grey"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signal-pay-phone" className="text-white">Phone number</Label>
        <Input
          id="signal-pay-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="0712345678"
          className="bg-nero border-steel-wool text-white"
        />
      </div>

      {message && <p className="text-sm text-red-400">{message}</p>}

      <Button
        type="button"
        onClick={confirm}
        disabled={submitting || !selectedPlan}
        className="bg-gold text-cursed-black hover:bg-gold-dark"
      >
        {submitting ? "Sending prompt…" : `Confirm payment${selectedPlan ? ` · ${formatTzs(Number(selectedPlan.price))}` : ""}`}
      </Button>
    </div>
  );
};

export default SignalPaywall;
