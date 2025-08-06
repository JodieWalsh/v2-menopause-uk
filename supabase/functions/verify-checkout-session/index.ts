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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { session_id } = await req.json();
    logStep("Verifying Checkout Session", { session_id });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get("stripesecret");
    if (!stripeKey) throw new Error("Stripe secret key not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Checkout Session retrieved", { sessionId: session.id, status: session.payment_status });

    if (session.payment_status === 'paid') {
      // Check if we've already processed this session
      const { data: existingSub } = await supabaseClient
        .from('user_subscriptions')
        .select('*')
        .eq('stripe_session_id', session_id)
        .single();

      if (!existingSub) {
        logStep("Creating subscription for successful checkout session");
        
        // Create or update subscription
        const { error: subError } = await supabaseClient
          .from("user_subscriptions")
          .upsert({
            user_id: user.id,
            stripe_customer_id: session.customer as string,
            stripe_session_id: session_id,
            amount_paid: session.amount_total || 0,
            currency: session.currency || "gbp",
            subscription_type: "paid",
            status: "active",
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
            welcome_email_sent: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (subError) {
          logStep("ERROR creating subscription", { error: subError.message });
          throw new Error(`Failed to create subscription: ${subError.message}`);
        }

        logStep("Subscription created/updated successfully");

        // Send welcome email only if not already sent
        const { data: subscription } = await supabaseClient
          .from('user_subscriptions')
          .select('welcome_email_sent')
          .eq('user_id', user.id)
          .single();

        if (subscription && !subscription.welcome_email_sent) {
          logStep("Sending welcome email");
          
          const { error: emailError } = await supabaseClient.functions.invoke('send-welcome-email', {
            body: { 
              email: user.email,
              firstName: user.user_metadata?.first_name || user.email?.split('@')[0] || 'there',
              isPaid: true
            },
          });

          if (emailError) {
            logStep("ERROR sending welcome email", { error: emailError.message });
          } else {
            logStep("Welcome email sent successfully");
            
            // Mark email as sent
            await supabaseClient
              .from("user_subscriptions")
              .update({ welcome_email_sent: true })
              .eq('user_id', user.id);
          }
        } else {
          logStep("Welcome email already sent, skipping");
        }
      } else {
        logStep("Session already processed, skipping duplicate");
      }

      return new Response(JSON.stringify({ 
        success: true,
        subscription_created: true 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      logStep("Payment not completed", { payment_status: session.payment_status });
      return new Response(JSON.stringify({ 
        success: false,
        error: "Payment not completed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
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