import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    console.log(`Verifying payment for session: ${session_id}`);

    if (!session_id) {
      throw new Error("Session ID is required");
    }

    // Create Supabase client using service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }
    console.log(`User authenticated: ${user.id}`);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("stripesecret") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the session from Stripe
    console.log(`Retrieving Stripe session: ${session_id}`);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log(`Session payment status: ${session.payment_status}, amount: ${session.amount_total}`);

    if (session.payment_status === "paid") {
      // Check if subscription already exists to prevent duplicates
      const { data: existingSub } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!existingSub || existingSub.status !== 'active') {
        // Create or update subscription
        await supabaseService.from("user_subscriptions").upsert({
          user_id: user.id,
          subscription_type: "paid",
          status: "active",
          stripe_customer_id: session.customer as string,
          stripe_session_id: session_id,
          amount_paid: session.amount_total,
          currency: session.currency,
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        }, {
          onConflict: 'user_id'
        });

        // Welcome email will be sent by confirm-payment function to avoid duplicates
        console.log(`Subscription created/updated for user ${user.id}, welcome email will be sent by confirm-payment`);
      } else {
        console.log(`Subscription already exists for user ${user.id}, skipping welcome email`);
      }

      return new Response(JSON.stringify({ success: true, verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ success: false, verified: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});