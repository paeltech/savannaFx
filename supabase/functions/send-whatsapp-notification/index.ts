import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// WaSender API credentials from environment variables
const WASENDER_API_KEY = Deno.env.get("WASENDER_API_KEY");
const WASENDER_SESSION_ID = Deno.env.get("WASENDER_SESSION_ID");

// Rate limiting configuration
const BATCH_SIZE = 5; // Reduced batch size to avoid rate limits (Wasender free tier is very limited)
const BATCH_DELAY_MS = 3000; // Increased delay between batches (3 seconds)
const MAX_RETRIES = 3; // Maximum retry attempts for failed messages
const RETRY_DELAYS = [5000, 10000, 20000]; // Longer delays for rate limit retries (5s, 10s, 20s)
const RATE_LIMIT_RETRY_DELAYS = [10000, 30000, 60000]; // Even longer delays specifically for 429 errors (10s, 30s, 60s)

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
    message += `\n\n🔗 Click here to view: https://savannaFX.co/dashboard/signals\n\n`;
    message += `_Trade responsibly. Manage your risk._`;

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

// Check if a phone number is on WhatsApp (optional optimization)
async function isOnWhatsApp(phoneNumber: string): Promise<boolean> {
    try {
        const cleanPhoneNumber = phoneNumber.replace('+', '').replace(/\s/g, '');
        const url = `https://api.wasenderapi.com/api/on-whatsapp/${cleanPhoneNumber}`;
        
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${WASENDER_API_KEY}`,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();
        return response.ok && data?.onWhatsApp === true;
    } catch (error) {
        console.error(`Error checking if ${phoneNumber} is on WhatsApp:`, error);
        return true; // Assume on WhatsApp if check fails to avoid blocking sends
    }
}

// WaSender API implementation with retry logic
async function sendWhatsAppMessage(
    phoneNumber: string, 
    message: string, 
    retryCount: number = 0
): Promise<any> {
    const url = `https://api.wasenderapi.com/api/send-message`;

    // Remove + from phone number if present (WaSender expects format without +)
    const cleanPhoneNumber = phoneNumber.replace('+', '').replace(/\s/g, '');

    try {
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

        const data = await response.json();

        // Log response for debugging
        console.log(`Wasender API response for ${cleanPhoneNumber}:`, {
            status: response.status,
            data: JSON.stringify(data).substring(0, 200) // Log first 200 chars
        });

        // Handle rate limiting (429) with longer retry delays
        if (response.status === 429 && retryCount < MAX_RETRIES) {
            // Use longer delays specifically for rate limits
            const delay = RATE_LIMIT_RETRY_DELAYS[retryCount] || RATE_LIMIT_RETRY_DELAYS[RATE_LIMIT_RETRY_DELAYS.length - 1];
            
            // Check for Retry-After header if available
            const retryAfter = response.headers.get('Retry-After');
            const actualDelay = retryAfter ? parseInt(retryAfter) * 1000 : delay;
            
            console.log(`Rate limited (429). Waiting ${actualDelay}ms before retry (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            console.log(`Rate limit response:`, JSON.stringify(data).substring(0, 200));
            
            await new Promise(resolve => setTimeout(resolve, actualDelay));
            return sendWhatsAppMessage(phoneNumber, message, retryCount + 1);
        }

        // Handle server errors (5xx) with retry
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
            console.log(`Server error. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return sendWhatsAppMessage(phoneNumber, message, retryCount + 1);
        }

        // Extract error message from response if present
        const errorMessage = data.error || data.error_message || data.message || 
            (data.error_code ? `Error code: ${data.error_code}` : null) ||
            (response.status === 429 ? 'Rate limit exceeded' : null) ||
            (response.status >= 400 && response.status < 500 ? `Client error: ${response.status}` : null) ||
            (response.status >= 500 ? `Server error: ${response.status}` : null);

        // Return response with HTTP status and error info included
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
            return sendWhatsAppMessage(phoneNumber, message, retryCount + 1);
        }
        
        // Max retries reached or non-retryable error
        throw error;
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

        // Check if WhatsApp session is connected
        console.log("Checking WhatsApp session status...");
        const isConnected = await checkSessionStatus();
        if (!isConnected) {
            console.warn("WhatsApp session is not connected. Messages may fail.");
            // Continue anyway - let individual sends handle the error
        } else {
            console.log("WhatsApp session is connected ✓");
        }

        // Format the message
        const message = formatSignalMessage(signal);

        console.log(`Preparing to send WhatsApp messages to ${profiles.length} subscribers`);

        // Process messages in batches to respect rate limits
        const batches: typeof profiles[] = [];
        for (let i = 0; i < profiles.length; i += BATCH_SIZE) {
            batches.push(profiles.slice(i, i + BATCH_SIZE));
        }

        console.log(`Processing ${batches.length} batches of up to ${BATCH_SIZE} messages each`);

        const allResults: any[] = [];

        // Process batches sequentially with delay between batches
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} messages)`);

            // Send messages in current batch in parallel
            const batchPromises = batch.map(async (profile) => {
            try {
                console.log(`Sending WhatsApp message to ${profile.phone_number} (user: ${profile.id})`);
                
                // Send message with retry logic
                const result = await sendWhatsAppMessage(profile.phone_number!, message);

                // Determine success based on HTTP status and response data
                // Wasender API may return 200 even for some failures, so check response body carefully
                const httpSuccess = result.httpStatus >= 200 && result.httpStatus < 300;
                
                // Check for various error indicators in Wasender response
                const hasError = 
                    result.error || 
                    result.error_code || 
                    result.error_message ||
                    result.message === false ||
                    (result.httpStatus && (result.httpStatus < 200 || result.httpStatus >= 300));
                
                // Check for success indicators - be strict: require a message ID or explicit success
                const hasSuccessIndicator = 
                    result.success === true ||
                    result.id ||
                    result.messageId ||
                    result.sid ||
                    (result.message && result.message !== false);
                
                // Final success = HTTP success AND no errors AND has success indicator
                // Be conservative: if we don't have clear success indicators, mark as failed
                const finalSuccess = httpSuccess && !hasError && hasSuccessIndicator;

                console.log(`Message to ${profile.phone_number}: ${finalSuccess ? 'SUCCESS' : 'FAILED'}`, {
                    httpStatus: result.httpStatus,
                    error: result.error || result.error_code || result.error_message,
                    messageId: result.id || result.messageId || result.sid
                });

                // Extract error message for logging
                const logErrorMsg = result.error_message || result.error || result.error_code || 
                    (result.httpStatus === 429 ? 'Rate limit exceeded' : null) ||
                    (!finalSuccess ? `HTTP ${result.httpStatus || 'unknown'}` : null);

                // Log the notification (non-blocking, happens after message is sent)
                const logPromise = supabaseClient.from("notification_logs").insert({
                    user_id: profile.id,
                    signal_id: signalId,
                    notification_type: "whatsapp",
                    phone_number: profile.phone_number,
                    message_content: message,
                    status: finalSuccess ? "sent" : "failed",
                    error_message: logErrorMsg,
                    provider_message_id: result.id || result.messageId || result.sid || null,
                    sent_at: new Date().toISOString(),
                }).then(() => {
                    console.log(`Logged notification for ${profile.phone_number}: ${finalSuccess ? 'sent' : 'failed'}`);
                }).catch(err => {
                    console.error(`Failed to log notification for ${profile.phone_number}:`, err);
                });

                // Don't await the log - let it happen in background
                // This ensures message sending isn't blocked by logging
                logPromise.catch(() => {});

                // Extract error message properly
                const errorMsg = result.error_message || result.error || result.error_code || 
                    (result.httpStatus === 429 ? 'Rate limit exceeded - message not sent' : null) ||
                    (!finalSuccess && result.httpStatus ? `HTTP ${result.httpStatus}` : null) ||
                    (!finalSuccess ? 'Unknown error' : null);

                return {
                    userId: profile.id,
                    phoneNumber: profile.phone_number,
                    success: finalSuccess,
                    messageId: result.id || result.messageId || result.sid,
                    error: errorMsg,
                    httpStatus: result.httpStatus,
                };
            } catch (error) {
                console.error(`Error sending to ${profile.phone_number}:`, error);
                
                const errorMessage = error instanceof Error ? error.message : String(error);
                
                // Log failed notification (non-blocking)
                const logPromise = supabaseClient.from("notification_logs").insert({
                    user_id: profile.id,
                    signal_id: signalId,
                    notification_type: "whatsapp",
                    phone_number: profile.phone_number,
                    message_content: message,
                    status: "failed",
                    error_message: errorMessage,
                    sent_at: new Date().toISOString(),
                }).catch(err => {
                    console.error(`Failed to log error for ${profile.phone_number}:`, err);
                });

                logPromise.catch(() => {});

                return {
                    userId: profile.id,
                    phoneNumber: profile.phone_number,
                    success: false,
                    error: errorMessage,
                };
            }
            });

            // Wait for current batch to complete
            const batchResults = await Promise.allSettled(batchPromises);
            allResults.push(...batchResults);

            // Add delay between batches (except for the last batch)
            if (batchIndex < batches.length - 1) {
                console.log(`Waiting ${BATCH_DELAY_MS}ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            }
        }

        console.log(`All batches processed. Total: ${allResults.length} messages`);
        const results = allResults;

        // Categorize results for better reporting
        const fulfilledResults = results.filter(r => r.status === "fulfilled").map(r => r.value);
        const rejectedResults = results.filter(r => r.status === "rejected");
        
        const successCount = fulfilledResults.filter(r => r.success === true).length;
        const failureCount = fulfilledResults.filter(r => r.success === false).length;
        const errorCount = rejectedResults.length;

        // Categorize failures by type
        const rateLimitFailures = fulfilledResults.filter(r => !r.success && r.httpStatus === 429).length;
        const otherFailures = failureCount - rateLimitFailures;

        // Log detailed breakdown
        console.log(`Message sending summary:`, {
            totalAttempted: results.length,
            successful: successCount,
            failed: failureCount,
            rateLimitFailures: rateLimitFailures,
            otherFailures: otherFailures,
            errors: errorCount,
            successRate: `${((successCount / results.length) * 100).toFixed(1)}%`
        });

        // Log failed messages for debugging
        const failedMessages = fulfilledResults.filter(r => !r.success);
        if (failedMessages.length > 0) {
            console.log(`Failed messages (first 5):`, failedMessages.slice(0, 5).map(f => ({
                phone: f.phoneNumber,
                error: f.error,
                httpStatus: f.httpStatus
            })));
        }

        // Generate warning message if rate limited
        let warningMessage: string | null = null;
        if (rateLimitFailures > 0) {
            warningMessage = `${rateLimitFailures} messages failed due to rate limiting. Consider upgrading your Wasender plan or reducing batch size.`;
        }

        return new Response(
            JSON.stringify({
                success: true,
                totalSubscribers: profiles.length,
                totalAttempted: results.length,
                successCount,
                failureCount,
                errorCount,
                rateLimitFailures,
                otherFailures,
                warning: warningMessage,
                results: results.map(r => r.status === "fulfilled" ? r.value : { success: false, error: r.reason }),
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
