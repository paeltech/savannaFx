import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DURATIONS = ["daily", "weekly", "monthly"] as const;
const PROVIDERS: Record<string, string[]> = {
  mpesa: ["74", "75", "76"],
  airtel: ["68", "69", "78"],
  mixx: ["65", "67", "71"],
  halotel: ["61", "62"],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeTzPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("255") && local.length === 12) local = local.slice(3);
  else if (local.startsWith("0") && local.length === 10) local = local.slice(1);
  if (!/^[6-7]\d{8}$/.test(local)) return null;
  return `255${local}`;
}

function phoneMatchesProvider(phone: string, provider: string): boolean {
  const prefixes = PROVIDERS[provider];
  if (!prefixes) return false;
  return prefixes.includes(phone.slice(3, 5));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const snippeKey = Deno.env.get("SNIPPE_API_KEY") ?? "";
    if (!snippeKey) return json({ error: "Payments are not configured yet." }, 500);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const subscriptionType = body.subscription_type;
    const provider = body.provider;
    const phoneInput = typeof body.phone_number === "string" ? body.phone_number : "";

    if (!DURATIONS.includes(subscriptionType)) return json({ error: "Choose daily, weekly, or monthly." }, 400);
    if (!PROVIDERS[provider]) return json({ error: "Choose a mobile money provider." }, 400);

    const phone = normalizeTzPhone(phoneInput);
    if (!phone) return json({ error: "Enter a valid Tanzanian phone number." }, 400);
    if (!phoneMatchesProvider(phone, provider)) {
      return json({ error: "That number does not match the selected provider." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const staleBefore = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    await admin
      .from("signal_payments")
      .update({ status: "expired", failure_reason: "Payment window elapsed" })
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lt("created_at", staleBefore);

    const { data: pending } = await admin
      .from("signal_payments")
      .select("id, status, subscription_type, phone_number, provider")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (pending) {
      return json({
        error: "You already have a payment waiting for approval.",
        payment_id: pending.id,
        status: "pending",
        subscription_type: pending.subscription_type,
        phone_number: pending.phone_number,
        provider: pending.provider,
      }, 409);
    }

    const { data: pricing, error: pricingError } = await admin
      .from("signal_pricing")
      .select("id, price, currency")
      .eq("pricing_type", subscriptionType)
      .eq("is_active", true)
      .maybeSingle();

    if (pricingError || !pricing) return json({ error: "That plan is not available." }, 400);
    const amount = Math.round(Number(pricing.price));
    if (!Number.isFinite(amount) || amount < 500 || pricing.currency !== "TZS") {
      return json({ error: "That plan is not available." }, 400);
    }

    const { data: profile } = await admin
      .from("user_profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const email = (profile?.email || user.email || "").trim();
    if (!email) return json({ error: "Add an email to your account before paying." }, 400);

    const fullName = (profile?.full_name || user.user_metadata?.full_name || "SavannaFX Member").trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    const firstname = parts[0] || "SavannaFX";
    const lastname = parts.slice(1).join(" ") || firstname;

    const idempotencyKey = crypto.randomUUID();
    const { data: payment, error: insertError } = await admin
      .from("signal_payments")
      .insert({
        user_id: user.id,
        pricing_id: pricing.id,
        subscription_type: subscriptionType,
        amount,
        currency: "TZS",
        phone_number: phone,
        provider,
        idempotency_key: idempotencyKey,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !payment) {
      console.error("signal payment insert:", insertError?.message);
      return json({ error: "Could not start the payment. Try again." }, 500);
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/snippe-webhook`;
    const snippeRes = await fetch("https://api.snippe.sh/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${snippeKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        payment_type: "mobile",
        details: { amount, currency: "TZS" },
        phone_number: phone,
        customer: { firstname, lastname, email },
        webhook_url: webhookUrl,
        metadata: {
          payment_id: payment.id,
          user_id: user.id,
          subscription_type: subscriptionType,
        },
      }),
    });

    const snippeBody = await snippeRes.json().catch(() => ({}));
    const reference = snippeBody?.data?.reference;
    if (!snippeRes.ok || !reference) {
      const message = snippeBody?.message || "The payment could not be sent to your phone.";
      await admin
        .from("signal_payments")
        .update({ status: "failed", failure_reason: String(message).slice(0, 500) })
        .eq("id", payment.id);
      return json({ error: message }, 502);
    }

    await admin
      .from("signal_payments")
      .update({ snippe_reference: reference })
      .eq("id", payment.id);

    return json({
      payment_id: payment.id,
      reference,
      status: "pending",
      amount,
      currency: "TZS",
      subscription_type: subscriptionType,
      phone_number: phone,
    });
  } catch (error) {
    console.error("create-signal-payment:", error);
    return json({ error: "Could not start the payment. Try again." }, 500);
  }
});
