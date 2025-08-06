import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-CHECKOUT-SESSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { session_id } = await req.json();
    logStep("Request parsed", { session_id });

    if (!session_id) {
      throw new Error("Session ID is required");
    }

    // Create Supabase client using service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripeKey = Deno.env.get("stripesecret");
    if (!stripeKey) throw new Error("Stripe secret key not configured");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session from Stripe
    logStep("Retrieving checkout session", { session_id });
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'payment_intent', 'total_details']
    });
    logStep("Checkout session retrieved", { 
      status: session.payment_status, 
      amount_total: session.amount_total,
      customer: session.customer 
    });

    if (session.payment_status === "paid") {
      // Check if subscription already exists to prevent duplicates
      const { data: existingSub } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .or(`stripe_session_id.eq.${session_id},user_id.eq.${user.id}`)
        .single();

      logStep("Checked for existing subscription", { exists: !!existingSub });

      if (!existingSub) {
        // Create or update subscription record
        const subscriptionData = {
          user_id: user.id,
          subscription_type: "paid",
          status: "active",
          stripe_customer_id: session.customer as string,
          stripe_session_id: session_id,
          amount_paid: session.amount_total || 0,
          currency: session.currency || "gbp",
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          welcome_email_sent: false,
          updated_at: new Date().toISOString(),
        };

        const { error: subError } = await supabaseService
          .from("user_subscriptions")
          .upsert(subscriptionData, { onConflict: 'user_id' });

        if (subError) {
          logStep("ERROR creating subscription", { error: subError.message });
          throw new Error(`Failed to create subscription: ${subError.message}`);
        }

        logStep("Subscription created/updated", { user_id: user.id });

        // Send welcome email only if payment is confirmed and email not already sent
        try {
          const { data: emailData, error: emailError } = await supabaseService.functions.invoke('send-welcome-email', {
            body: {
              email: user.email,
              firstName: user.user_metadata?.first_name,
              isPaid: true
            }
          });

          if (emailError) {
            logStep("ERROR sending welcome email", { error: emailError });
          } else {
            logStep("Welcome email sent successfully", { email: user.email });
            
            // Mark email as sent
            await supabaseService
              .from("user_subscriptions")
              .update({ welcome_email_sent: true })
              .eq('user_id', user.id);
            
            logStep("Welcome email marked as sent");
          }
        } catch (emailError) {
          logStep("ERROR in welcome email process", { error: emailError });
          // Don't fail the payment confirmation if email fails
        }
      } else {
        logStep("Subscription already exists, skipping duplicate");
      }

      return new Response(JSON.stringify({ 
        success: true,
        payment_status: session.payment_status,
        amount_total: session.amount_total
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      logStep("Payment not completed", { payment_status: session.payment_status });
      return new Response(JSON.stringify({ 
        success: false,
        payment_status: session.payment_status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-checkout-session", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});