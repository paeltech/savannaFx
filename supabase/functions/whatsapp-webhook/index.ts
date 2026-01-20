import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
};

// Webhook verification token (set this in Supabase secrets)
const WEBHOOK_VERIFY_TOKEN = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "your_verify_token_here";

// Webhook app secret for signature verification (optional but recommended)
const WEBHOOK_APP_SECRET = Deno.env.get("WHATSAPP_WEBHOOK_APP_SECRET") || "";

// Verify Facebook webhook signature (for POST requests)
async function verifyWebhookSignature(payload: string, signature: string | null): Promise<boolean> {
    if (!WEBHOOK_APP_SECRET || !signature) {
        // If no app secret configured, skip signature verification
        // This is less secure but allows webhook to work without app secret
        console.warn("Webhook signature verification skipped (no app secret configured)");
        return true;
    }

    try {
        // Facebook sends signature as "sha256=HASH"
        const expectedSignature = signature.replace("sha256=", "");
        
        // Create HMAC SHA256 hash
        const encoder = new TextEncoder();
        const keyData = encoder.encode(WEBHOOK_APP_SECRET);
        const messageData = encoder.encode(payload);
        
        const key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        
        const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
        const signatureArray = Array.from(new Uint8Array(signatureBuffer));
        const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, "0")).join("");
        
        // Compare signatures using constant-time comparison
        if (signatureHex.length !== expectedSignature.length) {
            return false;
        }
        
        let match = true;
        for (let i = 0; i < signatureHex.length; i++) {
            if (signatureHex[i] !== expectedSignature[i]) {
                match = false;
            }
        }
        
        return match;
    } catch (error) {
        console.error("Error verifying webhook signature:", error);
        return false;
    }
}

interface WebhookEntry {
    id: string;
    changes: Array<{
        value: {
            messaging_product?: string;
            metadata?: {
                phone_number_id: string;
            };
            statuses?: Array<{
                id: string;
                status: "sent" | "delivered" | "read" | "failed";
                timestamp: string;
                recipient_id: string;
                errors?: Array<{
                    code: number;
                    title: string;
                    message: string;
                }>;
            }>;
            contacts?: Array<{
                profile: {
                    name: string;
                };
                wa_id: string;
            }>;
            messages?: Array<{
                from: string;
                id: string;
                timestamp: string;
                type: string;
                text?: {
                    body: string;
                };
            }>;
        };
        field: string;
    }>;
}

// Handle webhook verification (GET request)
// This endpoint must be accessible without authentication for Facebook verification
function handleVerification(req: Request): Response {
    try {
        const url = new URL(req.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        console.log("Webhook verification request:", { 
            mode, 
            token: token ? (token === WEBHOOK_VERIFY_TOKEN ? "MATCH" : "NO_MATCH") : "MISSING", 
            challenge: challenge ? "PRESENT" : "MISSING",
            verifyTokenConfigured: !!WEBHOOK_VERIFY_TOKEN && WEBHOOK_VERIFY_TOKEN !== "your_verify_token_here"
        });

        // Verify the token
        if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
            console.log("Webhook verified successfully");
            return new Response(challenge, {
                status: 200,
                headers: { 
                    "Content-Type": "text/plain",
                    ...corsHeaders
                },
            });
        }

        console.error("Webhook verification failed:", { 
            mode, 
            tokenMatch: token === WEBHOOK_VERIFY_TOKEN,
            expectedToken: WEBHOOK_VERIFY_TOKEN !== "your_verify_token_here" ? "SET" : "NOT_SET"
        });
        return new Response("Forbidden", { 
            status: 403,
            headers: corsHeaders
        });
    } catch (error) {
        console.error("Error in webhook verification:", error);
        return new Response("Internal Server Error", { 
            status: 500,
            headers: corsHeaders
        });
    }
}

// Update notification log status
async function updateNotificationStatus(
    supabaseClient: any,
    messageId: string,
    status: "sent" | "delivered" | "read" | "failed",
    errorMessage: string | null = null
) {
    try {
        const updateData: any = {
            status: status,
        };

        // Set appropriate timestamp based on status
        const now = new Date().toISOString();
        if (status === "sent") {
            updateData.sent_at = now;
        } else if (status === "delivered") {
            updateData.delivered_at = now;
        } else if (status === "read") {
            updateData.read_at = now;
        }

        if (errorMessage) {
            updateData.error_message = errorMessage;
        }

        const { error } = await supabaseClient
            .from("notification_logs")
            .update(updateData)
            .eq("provider_message_id", messageId)
            .eq("notification_type", "whatsapp");

        if (error) {
            console.error(`Failed to update notification status for ${messageId}:`, error);
        } else {
            console.log(`Updated notification status: ${messageId} -> ${status}`);
        }
    } catch (error) {
        console.error(`Error updating notification status for ${messageId}:`, error);
    }
}

// Handle webhook events (POST request)
async function handleWebhookEvent(req: Request, supabaseKey: string): Promise<Response> {
    try {
        // Get raw body for signature verification
        const rawBody = await req.text();
        const signature = req.headers.get("x-hub-signature-256");
        
        // Verify webhook signature if app secret is configured
        if (WEBHOOK_APP_SECRET) {
            const isValid = await verifyWebhookSignature(rawBody, signature);
            if (!isValid) {
                console.error("Invalid webhook signature");
                return new Response(
                    JSON.stringify({ success: false, error: "Invalid signature" }),
                    {
                        status: 401,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    }
                );
            }
            console.log("Webhook signature verified successfully");
        }
        
        // Parse JSON body
        const body = JSON.parse(rawBody);
        console.log("Webhook event received:", JSON.stringify(body, null, 2));

        // Initialize Supabase client with provided key (from URL, header, or env)
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            supabaseKey
        );

        // Process each entry
        if (body.object === "whatsapp_business_account" && body.entry) {
            for (const entry of body.entry as WebhookEntry[]) {
                for (const change of entry.changes) {
                    // Handle status updates
                    if (change.value.statuses && change.value.statuses.length > 0) {
                        for (const statusUpdate of change.value.statuses) {
                            const messageId = statusUpdate.id;
                            const status = statusUpdate.status;
                            const timestamp = statusUpdate.timestamp;
                            const errors = statusUpdate.errors;

                            console.log(`Status update for ${messageId}:`, {
                                status,
                                timestamp,
                                recipient_id: statusUpdate.recipient_id,
                                errors: errors?.length || 0,
                            });

                            // Extract error message if failed
                            let errorMessage: string | null = null;
                            if (status === "failed" && errors && errors.length > 0) {
                                errorMessage = errors.map(e => `${e.title}: ${e.message}`).join("; ");
                            }

                            // Update notification log
                            await updateNotificationStatus(
                                supabaseClient,
                                messageId,
                                status,
                                errorMessage
                            );
                        }
                    }

                    // Handle incoming messages (optional - for future use)
                    if (change.value.messages && change.value.messages.length > 0) {
                        console.log("Incoming messages received:", change.value.messages.length);
                        // You can handle incoming messages here if needed
                        // For example, auto-replies, message forwarding, etc.
                    }
                }
            }
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Error processing webhook event:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // Log request for debugging (without sensitive data)
    const url = new URL(req.url);
    const hasApikey = url.searchParams.has("apikey");
    console.log(`Webhook request: ${req.method} ${url.pathname}${hasApikey ? " (with apikey)" : ""}`);

    // Extract apikey from URL if present (required for Supabase infrastructure auth)
    // This is necessary because Supabase Edge Functions require auth at infrastructure level
    // The anon key is safe to use here as it's designed to be public and protected by RLS
    const apikey = url.searchParams.get("apikey");
    const authHeader = req.headers.get("authorization");
    const headerApikey = req.headers.get("apikey");
    
    // Determine which key to use (prefer service role for POST, anon for GET verification)
    let supabaseKey: string;
    if (req.method === "POST") {
        // POST requests use service role key (more secure, can update data)
        supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        if (!supabaseKey) {
            console.error("SUPABASE_SERVICE_ROLE_KEY not configured");
            return new Response(
                JSON.stringify({ success: false, error: "Server configuration error" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }
    } else {
        // GET requests can use anon key from URL (required for Facebook verification)
        // Anon key is safe - it's designed to be public and protected by RLS policies
        supabaseKey = apikey || headerApikey || authHeader?.replace("Bearer ", "") || "";
    }

    // Handle GET request for webhook verification
    // Note: Supabase requires auth at infrastructure level, so apikey in URL is necessary
    // The anon key is acceptable here as it's meant to be public
    if (req.method === "GET") {
        return handleVerification(req);
    }

    // Handle POST request for webhook events
    // Uses service role key from environment (secure, no key in URL needed for POST)
    if (req.method === "POST") {
        return await handleWebhookEvent(req, supabaseKey);
    }

    // Method not allowed
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});
