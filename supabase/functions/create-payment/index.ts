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
    const { amount, email, discountCode } = await req.json();

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

    // Handle free access (amount = 0) or amounts below Stripe's minimum threshold
    // Stripe requires minimum 50 cents, which is about £0.40
    if (amount === 0 || amount < 0.50) {
      console.log(`Granting free access to user ${user.id} with amount: ${amount}, discount code: ${discountCode}`);
      
      // Create a free subscription record
      const { error: subError } = await supabaseService
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          subscription_type: 'free',
          status: 'active',
          amount_paid: 0,
          currency: 'gbp',
          expires_at: null, // Free access doesn't expire
          stripe_customer_id: null,
          stripe_session_id: null
        }, {
          onConflict: 'user_id'
        });

      if (subError) {
        console.error('Error creating free subscription:', subError);
        throw new Error('Failed to create free subscription');
      }
      
      // Return success URL for free access
      return new Response(JSON.stringify({ 
        url: `${req.headers.get("origin")}/payment-success?free_access=true` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("stripesecret") || "", {
      apiVersion: "2023-10-16",
    });

    // Discount codes are now handled by Stripe checkout
    // Remove hardcoded "free" discount - let Stripe manage all discount codes

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Round the amount to avoid floating point precision issues
    const amountInPence = Math.round(amount * 100);
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Menopause Doctors Visit UK",
              description: "12 months access to guided assessment tool with personalized report"
            },
            unit_amount: amountInPence, // Use the actual discounted amount
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment`,
      metadata: {
        user_id: user.id,
      },
      // Enable discount codes in Stripe checkout
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});