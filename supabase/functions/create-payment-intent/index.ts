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
    console.log(`Creating PaymentIntent for ${amount} GBP for ${email}`);

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
    if (amount === 0 || amount < 0.50) {
      console.log(`Granting free access to user ${user.id} with amount: ${amount}`);
      
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
      
      return new Response(JSON.stringify({ 
        client_secret: null,
        free_access: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("stripesecret") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim(),
        metadata: {
          user_id: user.id,
        }
      });
      customerId = customer.id;
    }

    // Handle discount code by finding the Stripe promotion code
    let promotionCodeId = null;
    const originalAmountInPence = Math.round(amount * 100);
    
    if (discountCode) {
      console.log(`Looking for promotion code: ${discountCode}`);
      try {
        // Find the promotion code in Stripe
        const promotionCodes = await stripe.promotionCodes.list({
          code: discountCode,
          active: true,
          limit: 1
        });
        
        if (promotionCodes.data.length > 0) {
          promotionCodeId = promotionCodes.data[0].id;
          console.log(`Found promotion code ID: ${promotionCodeId} for code: ${discountCode}`);
        } else {
          console.log(`Promotion code ${discountCode} not found or inactive`);
        }
      } catch (promoError) {
        console.error('Error looking up promotion code:', promoError);
        // Continue without discount if there's an error
      }
    }
    
    // Create PaymentIntent - let Stripe calculate the final amount when promotion code is applied
    const paymentIntentParams: any = {
      amount: originalAmountInPence, // Always use original amount - Stripe will apply discount
      currency: "gbp",
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      description: "Menopause Doctors Visit UK - 12 months access",
      metadata: {
        user_id: user.id,
        user_email: user.email,
        discount_code: discountCode || "",
      },
    };
    
    // Apply promotion code if found - this ensures Stripe tracks the redemption properly
    if (promotionCodeId) {
      paymentIntentParams.discounts = [{ promotion_code: promotionCodeId }];
      console.log(`Applying promotion code ${promotionCodeId} to PaymentIntent - Stripe will calculate final amount and track redemption`);
    }
    
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    console.log(`PaymentIntent created: ${paymentIntent.id} with final amount: ${paymentIntent.amount} pence`);

    return new Response(JSON.stringify({ 
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount / 100, // Return the final amount from Stripe (after discount)
      currency: "gbp"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment Intent creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});