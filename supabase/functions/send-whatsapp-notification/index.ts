import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// WaSender API credentials from environment variables
const WASENDER_API_KEY = Deno.env.get("WASENDER_API_KEY");
const WASENDER_SESSION_ID = Deno.env.get("WASENDER_SESSION_ID");

// Twilio credentials (commented out for future use)
// const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
// const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
// const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

interface SignalData {
    id: string;
    trading_pair: string;
    signal_type: string;
    entry_price: number;
    stop_loss: number;
    take_profit_1?: number;
    take_profit_2?: number;
    take_profit_3?: number;
    title: string;
    analysis?: string;
    risk_reward_ratio?: number;
    confidence_level?: string;
}

function formatSignalMessage(signal: SignalData): string {
    const emoji = signal.signal_type === 'buy' ? '📈' : '📉';

    let message = `🚨 *New Trading Signal* 🚨\n\n`;
    message += `📊 *Pair*: ${signal.trading_pair}\n`;
    message += `${emoji} *Type*: ${signal.signal_type.toUpperCase()}\n\n`;
    message += `💰 *Entry*: ${signal.entry_price}\n`;
    // message += `🛑 *Stop Loss*: ${signal.stop_loss}\n`;

    if (signal.take_profit_1) {
        message += `🎯 *TP1*: ${signal.take_profit_1}\n`;
    }
    if (signal.take_profit_2) {
        message += `🎯 *TP2*: ${signal.take_profit_2}\n`;
    }
    if (signal.take_profit_3) {
        message += `🎯 *TP3*: ${signal.take_profit_3}\n`;
    }

    message += `\n`;

    if (signal.risk_reward_ratio) {
        message += `⚖️ *R:R*: 1:${signal.risk_reward_ratio}\n`;
    }
    if (signal.confidence_level) {
        message += `💪 *Confidence*: ${signal.confidence_level.toUpperCase()}\n`;
    }

    if (signal.analysis) {
        message += `\n📝 *Analysis*: ${signal.analysis.substring(0, 200)}${signal.analysis.length > 200 ? '...' : ''}\n`;
    }

    message += `\n Login to the dashboard to view the full signal details with SL and bonus TPs`;
    message += `\n🔗 Click here to view: https://savannaFX.com/dashboard/signals\n\n`;
    message += `_Trade responsibly. Manage your risk._`;

    return message;
}

// WaSender API implementation
async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<any> {
    const url = `https://api.wasenderapi.com/api/send-message`;

    // Remove + from phone number if present (WaSender expects format without +)
    const cleanPhoneNumber = phoneNumber.replace('+', '');

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${WASENDER_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            session: WASENDER_SESSION_ID,
            to: cleanPhoneNumber,
            text: message,
        }),
    });

    return await response.json();
}

// Twilio implementation (commented out for future use)
/*
async function sendWhatsAppMessageTwilio(phoneNumber: string, message: string): Promise<any> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
            To: `whatsapp:${phoneNumber}`,
            Body: message,
        }),
    });

    return await response.json();
}
*/

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { signalId } = await req.json();

        if (!signalId) {
            throw new Error("signalId is required");
        }

        // Validate WaSender credentials
        if (!WASENDER_API_KEY || !WASENDER_SESSION_ID) {
            throw new Error("WaSender API credentials not configured");
        }

        // Twilio validation (commented out)
        // if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
        //     throw new Error("Twilio credentials not configured");
        // }

        // Initialize Supabase client with service role
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        console.log("Fetching signal with ID:", signalId);

        // Fetch signal details
        const { data: signal, error: signalError } = await supabaseClient
            .from("signals")
            .select("*")
            .eq("id", signalId)
            .single();

        console.log("Signal fetch result:", { signal, error: signalError });

        if (signalError || !signal) {
            console.error("Error fetching signal:", signalError);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: `Failed to fetch signal: ${signalError?.message || 'Signal not found'}`
                }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Fetch active subscribers with WhatsApp enabled and verified phone numbers
        const { data: subscriptions, error: subsError } = await supabaseClient
            .from("signal_subscriptions")
            .select(`
        user_id,
        subscription_type
      `)
            .eq("status", "active")
            .eq("whatsapp_notifications", true);

        if (subsError) {
            throw new Error(`Failed to fetch subscriptions: ${subsError.message}`);
        }

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "No active subscribers with WhatsApp enabled",
                    totalSubscribers: 0,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get user profiles for subscribers
        const userIds = subscriptions.map(sub => sub.user_id);
        const { data: profiles, error: profilesError } = await supabaseClient
            .from("user_profiles")
            .select("id, phone_number, phone_verified, whatsapp_notifications_enabled")
            .in("id", userIds)
            .eq("phone_verified", true)
            .eq("whatsapp_notifications_enabled", true)
            .not("phone_number", "is", null);

        if (profilesError) {
            throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
        }

        if (!profiles || profiles.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "No subscribers with verified phone numbers",
                    totalSubscribers: 0,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Format the message
        const message = formatSignalMessage(signal);

        // Send WhatsApp messages to all eligible subscribers
        const results = await Promise.allSettled(
            profiles.map(async (profile) => {
                try {
                    const result = await sendWhatsAppMessage(profile.phone_number!, message);

                    // Log the notification
                    await supabaseClient.from("notification_logs").insert({
                        user_id: profile.id,
                        signal_id: signalId,
                        notification_type: "whatsapp",
                        phone_number: profile.phone_number,
                        message_content: message,
                        status: result.error_code ? "failed" : "sent",
                        error_message: result.error_message || null,
                        provider_message_id: result.sid || null,
                        sent_at: new Date().toISOString(),
                    });

                    return {
                        userId: profile.id,
                        phoneNumber: profile.phone_number,
                        success: !result.error_code,
                        messageId: result.sid,
                        error: result.error_message,
                    };
                } catch (error) {
                    // Log failed notification
                    await supabaseClient.from("notification_logs").insert({
                        user_id: profile.id,
                        signal_id: signalId,
                        notification_type: "whatsapp",
                        phone_number: profile.phone_number,
                        message_content: message,
                        status: "failed",
                        error_message: error.message,
                        sent_at: new Date().toISOString(),
                    });

                    return {
                        userId: profile.id,
                        phoneNumber: profile.phone_number,
                        success: false,
                        error: error.message,
                    };
                }
            })
        );

        const successCount = results.filter(r => r.status === "fulfilled" && r.value.success).length;
        const failureCount = results.length - successCount;

        return new Response(
            JSON.stringify({
                success: true,
                totalSubscribers: profiles.length,
                successCount,
                failureCount,
                results: results.map(r => r.status === "fulfilled" ? r.value : { success: false, error: r.reason }),
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in send-whatsapp-notification:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
