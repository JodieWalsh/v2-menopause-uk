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
    const { payment_intent_id } = await req.json();
    console.log(`Confirming payment for PaymentIntent: ${payment_intent_id}`);

    if (!payment_intent_id) {
      throw new Error("Payment Intent ID is required");
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

    // Retrieve the PaymentIntent from Stripe
    console.log(`Retrieving PaymentIntent: ${payment_intent_id}`);
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    console.log(`PaymentIntent status: ${paymentIntent.status}, amount: ${paymentIntent.amount}`);

    if (paymentIntent.status === "succeeded") {
      // Check if subscription already exists to prevent duplicates
      const { data: existingSub } = await supabaseService
        .from('user_subscriptions')
        .select('*')
        .eq('stripe_session_id', payment_intent_id)
        .single();

      if (!existingSub) {
        // Create or update subscription
        const { error: subError } = await supabaseService
          .from("user_subscriptions")
          .upsert({
            user_id: user.id,
            subscription_type: "paid",
            status: "active",
            stripe_customer_id: paymentIntent.customer as string,
            stripe_session_id: payment_intent_id, // Store PaymentIntent ID
            amount_paid: paymentIntent.amount,
            currency: paymentIntent.currency,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          }, {
            onConflict: 'user_id'
          });

        if (subError) {
          console.error('Error creating/updating subscription:', subError);
          throw new Error('Failed to create subscription');
        }

        console.log(`Subscription created/updated for user ${user.id}`);

        // Send welcome email after successful payment
        try {
          await supabaseService.functions.invoke('send-welcome-email', {
            body: {
              email: user.email,
              firstName: user.user_metadata?.first_name,
              isPaid: true
            }
          });
          console.log(`Welcome email sent to ${user.email}`);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail the payment confirmation if email fails
        }
      } else {
        console.log(`Subscription already exists for user ${user.id}, skipping welcome email to prevent duplicates`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        verified: true,
        payment_status: paymentIntent.status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.log(`Payment not succeeded. Status: ${paymentIntent.status}`);
      return new Response(JSON.stringify({ 
        success: false, 
        verified: false,
        payment_status: paymentIntent.status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});