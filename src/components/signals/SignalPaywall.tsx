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
  formatMoney,
  isSellableSignalPlan,
  normalizeTzPhone,
  phoneMatchesProvider,
  providerForPhone,
  sellablePlanIssue,
  type SignalDuration,
  type SignalProviderId,
} from "@shared/utils/signal-payment";

type Phase = "form" | "waiting";

interface PendingPayment {
  payment_id: string;
  status: string;
  subscription_type?: string;
  phone_number?: string;
  amount?: number;
  currency?: string;
}

interface WaitingDetails {
  duration: SignalDuration;
  phone: string;
  amount: number | null;
  currency: string;
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

function planLabel(type: string) {
  return SIGNAL_DURATIONS.find((option) => option.id === type)?.label ?? type;
}

const SignalPaywall: React.FC<{ onPaid: () => void }> = ({ onPaid }) => {
  const { session } = useSupabaseSession();
  const [plans, setPlans] = useState<SignalPricing[]>([]);
  const [duration, setDuration] = useState<SignalDuration>("daily");
  const [provider, setProvider] = useState<SignalProviderId>("mpesa");
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [waiting, setWaiting] = useState<WaitingDetails | null>(null);
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
          .select("id, status, subscription_type, phone_number, provider, amount, currency")
          .eq("user_id", userId)
          .eq("status", "pending")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      const loaded = (pricing as SignalPricing[]) ?? [];
      setPlans(loaded);
      const defaultPhone = profile?.phone_number || "";
      setPhone(defaultPhone);
      const detected = providerForPhone(defaultPhone);
      if (detected) setProvider(detected);
      const firstSellable = SIGNAL_DURATIONS.find((option) =>
        isSellableSignalPlan(loaded.find((plan) => plan.pricing_type === option.id)),
      );
      if (firstSellable) setDuration(firstSellable.id);
      if (pending?.id) {
        setPaymentId(pending.id);
        setPhase("waiting");
        if (pending.phone_number) setPhone(pending.phone_number);
        if (pending.provider && SIGNAL_PROVIDERS.some((item) => item.id === pending.provider)) {
          setProvider(pending.provider as SignalProviderId);
        }
        const pendingType = SIGNAL_DURATIONS.some((option) => option.id === pending.subscription_type)
          ? (pending.subscription_type as SignalDuration)
          : firstSellable?.id ?? "daily";
        setDuration(pendingType);
        setWaiting({
          duration: pendingType,
          phone: pending.phone_number || defaultPhone,
          amount: pending.amount ?? null,
          currency: pending.currency || "TZS",
        });
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
        setWaiting(null);
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
  const selectedIssue = sellablePlanIssue(selectedPlan);
  const sellablePlans = plans.filter((plan) => isSellableSignalPlan(plan));

  const onPhoneChange = (value: string) => {
    setPhone(value);
    const detected = providerForPhone(value);
    if (detected) setProvider(detected);
  };

  const confirm = async () => {
    setMessage(null);
    if (!normalizeTzPhone(phone)) {
      setMessage("Enter a valid Tanzanian phone number, for example 0712345678.");
      return;
    }
    if (!phoneMatchesProvider(phone, provider)) {
      setMessage("That number does not match the selected provider. The provider updates when the number matches one.");
      return;
    }
    if (!selectedPlan || selectedIssue) {
      setMessage(selectedIssue || "Choose an available plan.");
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
        setWaiting({
          duration,
          phone,
          amount: payload.amount ?? Number(selectedPlan.price),
          currency: payload.currency || selectedPlan.currency,
        });
        setPhase("waiting");
        return;
      }
      setMessage(payload?.error || "Could not start the payment. Try again.");
      return;
    }
    if (data?.payment_id) {
      setPaymentId(data.payment_id);
      setWaiting({
        duration,
        phone: data.phone_number || phone,
        amount: data.amount ?? Number(selectedPlan.price),
        currency: data.currency || selectedPlan.currency,
      });
      setPhase("waiting");
      return;
    }
    setMessage(data?.error || "Could not start the payment. Try again.");
  };

  if (phase === "waiting") {
    const shownAmount = waiting?.amount != null ? formatMoney(waiting.amount, waiting.currency) : null;
    return (
      <div className="rounded-lg border border-gold/30 bg-nero/40 p-6 space-y-4">
        <div>
          <p className="text-gold text-xs font-medium uppercase tracking-wide">Step 2 of 2</p>
          <h2 className="text-xl font-semibold text-white mt-1">Approve the prompt on your phone</h2>
          <p className="text-rainy-grey text-sm mt-2">
            A mobile-money prompt is on its way. Enter your PIN to finish. This page updates on its own.
          </p>
        </div>
        <dl className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-steel-wool p-3">
            <dt className="text-rainy-grey">Plan</dt>
            <dd className="text-white font-medium mt-1">{planLabel(waiting?.duration || duration)}</dd>
          </div>
          <div className="rounded-lg border border-steel-wool p-3">
            <dt className="text-rainy-grey">Amount</dt>
            <dd className="text-white font-medium mt-1">{shownAmount || "—"}</dd>
          </div>
          <div className="rounded-lg border border-steel-wool p-3">
            <dt className="text-rainy-grey">Phone</dt>
            <dd className="text-white font-medium mt-1">{waiting?.phone || phone}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-steel-wool/50 bg-nero/40 p-6 space-y-6">
      <div>
        <p className="text-gold text-xs font-medium uppercase tracking-wide">Step 1 of 2</p>
        <h2 className="text-xl font-semibold text-white mt-1">Pay for signals</h2>
        <p className="text-rainy-grey text-sm mt-1">
          Choose a plan, then confirm the phone that should receive the mobile-money prompt.
        </p>
      </div>

      {sellablePlans.length === 0 ? (
        <p className="text-sm text-rainy-grey">No signal plans are available for payment right now.</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-3">
          {SIGNAL_DURATIONS.map((option) => {
            const plan = plans.find((item) => item.pricing_type === option.id);
            const issue = sellablePlanIssue(plan);
            const active = duration === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={!!issue}
                onClick={() => setDuration(option.id)}
                className={`rounded-lg border p-4 text-left ${
                  issue
                    ? "border-steel-wool opacity-50 cursor-not-allowed"
                    : active
                      ? "border-gold bg-gold/10"
                      : "border-steel-wool"
                }`}
              >
                <div className="text-white font-semibold">{option.label}</div>
                <div className="text-gold mt-1">
                  {plan ? formatMoney(Number(plan.price), plan.currency) : "Not set up"}
                </div>
                <div className="text-rainy-grey text-xs mt-1">
                  {issue || `${option.days} day${option.days === 1 ? "" : "s"}`}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-white">Mobile money provider</Label>
        <div className="grid grid-cols-2 gap-2">
          {SIGNAL_PROVIDERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setProvider(option.id)}
              className={`rounded-lg border px-3 py-2 text-left text-sm ${provider === option.id ? "border-gold text-white bg-gold/10" : "border-steel-wool text-rainy-grey"}`}
            >
              <span className="block">{option.label}</span>
              <span className="block text-xs mt-0.5 opacity-80">
                {option.prefixes.map((prefix) => `0${prefix}`).join(", ")}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signal-pay-phone" className="text-white">Phone number for the prompt</Label>
        <Input
          id="signal-pay-phone"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          placeholder="0712345678"
          inputMode="tel"
          className="bg-nero border-steel-wool text-white"
        />
        <p className="text-xs text-rainy-grey">The provider is selected automatically when the number matches one.</p>
      </div>

      {message && <p className="text-sm text-red-400">{message}</p>}

      <Button
        type="button"
        onClick={confirm}
        disabled={submitting || !!selectedIssue || sellablePlans.length === 0}
        className="w-full bg-gold text-cursed-black hover:bg-gold-dark"
      >
        {submitting
          ? "Sending prompt…"
          : selectedPlan && !selectedIssue
            ? `Send prompt · ${formatMoney(Number(selectedPlan.price), selectedPlan.currency)}`
            : "Send prompt"}
      </Button>
    </div>
  );
};

export default SignalPaywall;
