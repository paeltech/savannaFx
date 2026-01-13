import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// WaSender API credentials from environment variables
const WASENDER_API_KEY = Deno.env.get("WASENDER_API_KEY");
const WASENDER_SESSION_ID = Deno.env.get("WASENDER_SESSION_ID");

// Group messaging configuration
const GROUP_MESSAGE_DELAY_MS = 2000; // 2 seconds delay between group messages
const MAX_RETRIES = 2; // Maximum retry attempts for failed group messages
const RETRY_DELAYS = [5000, 10000]; // Retry delays (5s, 10s)

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

    // Use signal title as the main message title
    let message = `🚨 *${signal.title}* 🚨\n\n`;
    
    // Trading pair and signal type
    message += `📊 *Pair*: ${signal.trading_pair}\n`;
    message += `${emoji} *Type*: ${signal.signal_type.toUpperCase()}\n\n`;
    
    // Entry price
    message += `💰 *Entry*: ${signal.entry_price}\n`;
    
    // Take profit levels
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

    // Risk/Reward and Confidence
    if (signal.risk_reward_ratio) {
        message += `⚖️ *R:R*: 1:${signal.risk_reward_ratio}\n`;
    }
    if (signal.confidence_level) {
        message += `💪 *Confidence*: ${signal.confidence_level.toUpperCase()}\n`;
    }

    // Include full analysis if available (WhatsApp messages can be up to 4096 characters)
    if (signal.analysis && signal.analysis.trim()) {
        message += `\n📝 *Analysis*\n`;
        message += `${signal.analysis}\n`;
    }

    // Footer with link
    message += `\n_Login to the dashboard to view the full signal details with SL and bonus TPs_\n`;
    message += `\n🔗 https://savannaFX.co/dashboard/signals\n`;
    message += `\n_Trade responsibly. Manage your risk._`;

    return message;
}

// Check if WhatsApp session is connected
async function checkSessionStatus(): Promise<boolean> {
    try {
        const url = `https://api.wasenderapi.com/api/status`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${WASENDER_API_KEY}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.warn(`Session status check returned ${response.status}`);
            return true; // Assume connected if check fails to avoid blocking sends
        }

        const data = await response.json();
        // Check various possible response formats
        const isConnected = 
            data?.connected === true || 
            data?.status === 'connected' || 
            data?.state === 'connected' ||
            (data?.session && data?.session?.status === 'connected');
        
        return isConnected;
    } catch (error) {
        console.error("Error checking session status:", error);
        return true; // Assume connected if check fails to avoid blocking sends
    }
}

// Get current month in YYYY-MM format
function getCurrentMonthYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

// Send message to WhatsApp group via WaSender API
async function sendGroupMessage(
    groupJid: string,
    message: string,
    retryCount: number = 0
): Promise<any> {
    const url = `https://api.wasenderapi.com/api/send-group-message`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${WASENDER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                session: WASENDER_SESSION_ID,
                groupId: groupJid,
                text: message,
            }),
        });

        const data = await response.json();

        // Log response for debugging
        console.log(`Wasender API response for group ${groupJid}:`, {
            status: response.status,
            data: JSON.stringify(data).substring(0, 200)
        });

        // Handle rate limiting (429) with retry
        if (response.status === 429 && retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
            const retryAfter = response.headers.get('Retry-After');
            const actualDelay = retryAfter ? parseInt(retryAfter) * 1000 : delay;
            
            console.log(`Rate limited (429). Waiting ${actualDelay}ms before retry (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, actualDelay));
            return sendGroupMessage(groupJid, message, retryCount + 1);
        }

        // Handle server errors (5xx) with retry
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
            console.log(`Server error. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return sendGroupMessage(groupJid, message, retryCount + 1);
        }

        // Extract error message from response if present
        const errorMessage = data.error || data.error_message || data.message || 
            (data.error_code ? `Error code: ${data.error_code}` : null) ||
            (response.status === 429 ? 'Rate limit exceeded' : null) ||
            (response.status >= 400 && response.status < 500 ? `Client error: ${response.status}` : null) ||
            (response.status >= 500 ? `Server error: ${response.status}` : null);

        // Return response with HTTP status and error info
        return {
            ...data,
            httpStatus: response.status,
            error: errorMessage,
            error_code: data.error_code,
            error_message: data.error_message || errorMessage,
            isSuccess: response.status >= 200 && response.status < 300 && !data.error && !data.error_code && !errorMessage
        };
    } catch (error) {
        // Network errors - retry if attempts remaining
        if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
            console.log(`Network error. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return sendGroupMessage(groupJid, message, retryCount + 1);
        }
        
        // Max retries reached or non-retryable error
        throw error;
    }
}

// Helper function to log group operations
async function logGroupOperation(
    supabaseClient: any,
    operationType: string,
    groupId: string | null,
    groupJid: string | null,
    signalId: string,
    success: boolean,
    errorMessage: string | null,
    responseData: any = null
) {
    try {
        await supabaseClient.from("whatsapp_group_operations").insert({
            operation_type: operationType,
            group_id: groupId,
            group_jid: groupJid,
            signal_id: signalId,
            success,
            error_message: errorMessage,
            response_data: responseData,
        });
    } catch (error) {
        console.error("Failed to log group operation:", error);
    }
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

        // Check if WhatsApp session is connected
        console.log("Checking WhatsApp session status...");
        const isConnected = await checkSessionStatus();
        if (!isConnected) {
            console.warn("WhatsApp session is not connected. Messages may fail.");
        } else {
            console.log("WhatsApp session is connected ✓");
        }

        // Format the message
        const message = formatSignalMessage(signal);

        // Get current month for group lookup
        const currentMonthYear = getCurrentMonthYear();
        console.log(`Fetching active WhatsApp groups for ${currentMonthYear}`);

        // Fetch active groups for current month
        const { data: activeGroups, error: groupsError } = await supabaseClient
            .from("whatsapp_groups")
            .select("*")
            .eq("is_active", true)
            .eq("month_year", currentMonthYear)
            .order("group_number", { ascending: true });

        if (groupsError) {
            throw new Error(`Failed to fetch groups: ${groupsError.message}`);
        }

        if (!activeGroups || activeGroups.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: `No active WhatsApp groups found for ${currentMonthYear}. Please run group refresh first.`,
                    totalGroups: 0,
                    totalMembers: 0,
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Found ${activeGroups.length} active groups. Sending message to each group.`);

        const groupResults: any[] = [];
        let totalMembers = 0;

        // Send message to each group sequentially
        for (let i = 0; i < activeGroups.length; i++) {
            const group = activeGroups[i];
            totalMembers += group.member_count || 0;

            // Add delay before each group message (except the first)
            if (i > 0) {
                console.log(`Waiting ${GROUP_MESSAGE_DELAY_MS}ms before next group...`);
                await new Promise(resolve => setTimeout(resolve, GROUP_MESSAGE_DELAY_MS));
            }

            try {
                console.log(`Sending message to group ${group.group_name} (${group.group_number}) - ${group.member_count} members [${i + 1}/${activeGroups.length}]`);

                const sendResult = await sendGroupMessage(group.group_jid, message);

                // Determine success
                const httpSuccess = sendResult.httpStatus >= 200 && sendResult.httpStatus < 300;
                const hasError = sendResult.error || sendResult.error_code || sendResult.error_message ||
                    (sendResult.httpStatus && (sendResult.httpStatus < 200 || sendResult.httpStatus >= 300));
                const hasSuccessIndicator = sendResult.success === true ||
                    sendResult.id || sendResult.messageId || sendResult.sid ||
                    (sendResult.message && sendResult.message !== false);

                const finalSuccess = httpSuccess && !hasError && hasSuccessIndicator;

                console.log(`Message to group ${group.group_jid}: ${finalSuccess ? 'SUCCESS' : 'FAILED'}`, {
                    httpStatus: sendResult.httpStatus,
                    error: sendResult.error || sendResult.error_code || sendResult.error_message,
                    messageId: sendResult.id || sendResult.messageId || sendResult.sid
                });

                // Log group operation
                await logGroupOperation(
                    supabaseClient,
                    "send_message",
                    group.id,
                    group.group_jid,
                    signalId,
                    finalSuccess,
                    sendResult.error || sendResult.error_message || null,
                    sendResult
                );

                groupResults.push({
                    groupId: group.id,
                    groupName: group.group_name,
                    groupNumber: group.group_number,
                    groupJid: group.group_jid,
                    memberCount: group.member_count,
                    success: finalSuccess,
                    messageId: sendResult.id || sendResult.messageId || sendResult.sid,
                    error: sendResult.error || sendResult.error_message || null,
                    httpStatus: sendResult.httpStatus,
                });
            } catch (error) {
                console.error(`Error sending to group ${group.group_jid}:`, error);
                const errorMessage = error instanceof Error ? error.message : String(error);

                // Log failed operation
                await logGroupOperation(
                    supabaseClient,
                    "send_message",
                    group.id,
                    group.group_jid,
                    signalId,
                    false,
                    errorMessage,
                    null
                );

                groupResults.push({
                    groupId: group.id,
                    groupName: group.group_name,
                    groupNumber: group.group_number,
                    groupJid: group.group_jid,
                    memberCount: group.member_count,
                    success: false,
                    error: errorMessage,
                });
            }
        }

        const successCount = groupResults.filter(r => r.success === true).length;
        const failureCount = groupResults.filter(r => r.success === false).length;

        console.log(`Group message sending summary:`, {
            totalGroups: activeGroups.length,
            successful: successCount,
            failed: failureCount,
            totalMembers,
        });

        // Generate warning message if any groups failed
        let warningMessage: string | null = null;
        if (failureCount > 0) {
            warningMessage = `${failureCount} out of ${activeGroups.length} groups failed to receive the message.`;
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Sent signal notification to ${successCount} out of ${activeGroups.length} groups`,
                totalGroups: activeGroups.length,
                totalMembers,
                successCount,
                failureCount,
                warning: warningMessage,
                results: groupResults,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error in send-whatsapp-notification:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({
                success: false,
                error: errorMessage
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
