import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGE_LEN = 3500;
const INSERT_CHUNK = 250;

type TipRow = { id: string; title: string; body: string; sort_order: number };

function utcDayNumber(d: Date): number {
  const utcMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor(utcMidnight / 86_400_000);
}

function pickDailyTip(tips: TipRow[], d: Date): TipRow | null {
  if (!tips.length) return null;
  const sorted = [...tips].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.id.localeCompare(b.id);
  });
  const idx = utcDayNumber(d) % sorted.length;
  return sorted[idx] ?? null;
}

function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const dispatchDate = utcDateString(now);

    const { data: tips, error: tipsError } = await supabase
      .from("trading_tips")
      .select("id, title, body, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (tipsError || !tips?.length) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_active_tips", error: tipsError?.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tip = pickDailyTip(tips as TipRow[], now);
    if (!tip) {
      return new Response(JSON.stringify({ skipped: true, reason: "pick_failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: reserveErr } = await supabase.from("trading_tip_daily_dispatch").insert({
      dispatch_date: dispatchDate,
      tip_id: tip.id,
    });

    if (reserveErr) {
      if (reserveErr.code === "23505") {
        return new Response(
          JSON.stringify({ skipped: true, reason: "already_dispatched", dispatch_date: dispatchDate }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("dispatch reserve error:", reserveErr);
      return new Response(JSON.stringify({ error: reserveErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userRows, error: rpcError } = await supabase.rpc("list_user_ids_opted_in_daily_tips");
    if (rpcError) {
      console.error("rpc list_user_ids_opted_in_daily_tips:", rpcError);
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = (userRows as { user_id: string }[] | null)?.map((r) => r.user_id) ?? [];
    if (!userIds.length) {
      await supabase.from("trading_tip_daily_dispatch").delete().eq("dispatch_date", dispatchDate);
      return new Response(
        JSON.stringify({ skipped: true, reason: "no_eligible_users", tip_id: tip.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message =
      tip.body.length > MAX_MESSAGE_LEN ? `${tip.body.slice(0, MAX_MESSAGE_LEN - 3)}...` : tip.body;

    const rows = userIds.map((user_id) => ({
      user_id,
      notification_type: "tip" as const,
      title: tip.title,
      message,
      metadata: { tip_id: tip.id },
    }));

    for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
      const chunk = rows.slice(i, i + INSERT_CHUNK);
      const { error: insErr } = await supabase.from("notifications").insert(chunk);
      if (insErr) {
        console.error("notifications insert error:", insErr);
        return new Response(
          JSON.stringify({
            error: insErr.message,
            partial: true,
            hint: "If some notifications were inserted, remove trading_tip_daily_dispatch for this date before retrying",
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        dispatch_date: dispatchDate,
        tip_id: tip.id,
        notified: userIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("distribute-daily-tip error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
