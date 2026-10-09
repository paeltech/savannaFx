import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";

const DURATION_DAYS: Record<string, number> = { daily: 1, weekly: 7, monthly: 30 };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function verifySignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean {
  let eventTime = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(eventTime) || !signature) return false;
  if (eventTime > 1e12) eventTime = Math.floor(eventTime / 1000);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - eventTime) > 300) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(actualBuf, expectedBuf);
}

function amountValue(amount: unknown): number | null {
  if (typeof amount === "number") return amount;
  if (amount && typeof amount === "object" && "value" in amount) {
    const value = Number((amount as { value: unknown }).value);
    return Number.isFinite(value) ? value : null;
  }
  return null;
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const secret = Deno.env.get("SNIPPE_WEBHOOK_SECRET") ?? "";
  const snippeKey = Deno.env.get("SNIPPE_API_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!secret || !snippeKey) return json({ error: "Webhook is not configured" }, 500);

  try {
    return await handleWebhook(req, secret, snippeKey, supabaseUrl, serviceRoleKey);
  } catch (error) {
    console.error("snippe-webhook:", error);
    return json({ error: "Webhook failed" }, 500);
  }
});

async function handleWebhook(
  req: Request,
  secret: string,
  snippeKey: string,
  supabaseUrl: string,
  serviceRoleKey: string,
) {
  const rawBody = await req.text();
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const signature = req.headers.get("x-webhook-signature") ?? "";
  if (!verifySignature(rawBody, timestamp, signature, secret)) {
    return json({ error: "Invalid signature" }, 400);
  }

  let event: { id?: string; type?: string; event?: string; data?: Record<string, unknown>; reference?: string; status?: string };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const eventType = event.type || event.event || req.headers.get("x-webhook-event") || "";
  const data = (event.data ?? event) as Record<string, unknown>;
  const reference = typeof data.reference === "string" ? data.reference : "";
  const metadata = (data.metadata ?? {}) as { payment_id?: string };
  if (!reference && !metadata.payment_id) return json({ ok: true });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let paymentQuery = admin
    .from("signal_payments")
    .select("id, user_id, pricing_id, subscription_type, amount, provider, snippe_reference, status");
  paymentQuery = reference
    ? paymentQuery.eq("snippe_reference", reference)
    : paymentQuery.eq("id", metadata.payment_id);
  const { data: payment } = await paymentQuery.maybeSingle();

  if (!payment || !reference) return json({ ok: true });
  if (!payment.snippe_reference) {
    await admin.from("signal_payments").update({ snippe_reference: reference }).eq("id", payment.id);
  }
  if (payment.status === "completed") return json({ ok: true });

  if (eventType === "payment.failed" || eventType === "payment.expired" || eventType === "payment.voided") {
    const status = eventType.replace("payment.", "");
    const reason = typeof data.failure_reason === "string" ? data.failure_reason : null;
    await admin
      .from("signal_payments")
      .update({
        status,
        failure_reason: reason,
        snippe_event_id: event.id ?? null,
      })
      .eq("id", payment.id)
      .eq("status", "pending");
    return json({ ok: true });
  }

  if (eventType !== "payment.completed") return json({ ok: true });

  const snippeRes = await fetch(`https://api.snippe.sh/v1/payments/${reference}`, {
    headers: { Authorization: `Bearer ${snippeKey}` },
  });
  const snippeBody = await snippeRes.json().catch(() => ({}));
  const confirmed = snippeBody?.data;
  const confirmedAmount = amountValue(confirmed?.amount);
  const confirmedCurrency = confirmed?.amount?.currency ?? confirmed?.currency;
  if (!snippeRes.ok || confirmed?.status !== "completed" || confirmedAmount !== payment.amount || confirmedCurrency !== "TZS") {
    console.error("snippe confirm failed", snippeRes.status, confirmed?.status, confirmedAmount);
    return json({ error: "Payment not confirmed" }, 400);
  }

  const { data: already } = await admin
    .from("signal_subscriptions")
    .select("id")
    .eq("payment_reference", reference)
    .maybeSingle();

  let subscriptionId = already?.id as string | undefined;
  if (!subscriptionId) {
    subscriptionId = await grantAccess(admin, payment, reference);
  }

  await admin
    .from("signal_payments")
    .update({
      status: "completed",
      subscription_id: subscriptionId,
      snippe_event_id: event.id ?? null,
      failure_reason: null,
    })
    .eq("id", payment.id);

  return json({ ok: true });
}

async function grantAccess(
  admin: ReturnType<typeof createClient>,
  payment: {
    user_id: string;
    pricing_id: string;
    subscription_type: string;
    amount: number;
    provider: string;
  },
  reference: string,
): Promise<string | undefined> {
  const days = DURATION_DAYS[payment.subscription_type] ?? 30;
  const now = new Date();

  const { data: current } = await admin
    .from("signal_subscriptions")
    .select("id, end_date, amount_paid")
    .eq("user_id", payment.user_id)
    .eq("status", "active")
    .eq("payment_status", "completed")
    .gt("amount_paid", 0)
    .gt("end_date", now.toISOString())
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const base = current?.end_date ? new Date(current.end_date) : now;
  const end = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  if (current) {
    const { data: extended, error } = await admin
      .from("signal_subscriptions")
      .update({
        end_date: end.toISOString(),
        pricing_id: payment.pricing_id,
        subscription_type: payment.subscription_type,
        amount_paid: Number(current.amount_paid) + payment.amount,
        payment_method: `snippe_${payment.provider}`,
        payment_reference: reference,
        payment_status: "completed",
        status: "active",
      })
      .eq("id", current.id)
      .or(`payment_reference.is.null,payment_reference.neq.${reference}`)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    return extended?.id ?? current.id;
  }

  const { data: created, error } = await admin
    .from("signal_subscriptions")
    .insert({
      user_id: payment.user_id,
      pricing_id: payment.pricing_id,
      subscription_type: payment.subscription_type,
      status: "active",
      payment_status: "completed",
      payment_method: `snippe_${payment.provider}`,
      payment_reference: reference,
      amount_paid: payment.amount,
      start_date: now.toISOString(),
      end_date: end.toISOString(),
      whatsapp_notifications: true,
      email_notifications: true,
      telegram_notifications: false,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: raced } = await admin
        .from("signal_subscriptions")
        .select("id")
        .eq("payment_reference", reference)
        .maybeSingle();
      return raced?.id;
    }
    throw error;
  }
  return created?.id;
}
