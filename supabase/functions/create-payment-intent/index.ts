import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-INTENT] ${step}${detailsStr}`);
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

    const { amount, email, discountCode } = await req.json();
    logStep("Request parsed", { amount, email, discountCode });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check for free access (amount < 50 pence or 0)
    if (amount < 50) {
      logStep("Free access granted", { amount });
      
      const { error: subError } = await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          amount_paid: 0,
          currency: "gbp",
          subscription_type: "free",
          status: "active",
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          welcome_email_sent: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (subError) {
        logStep("ERROR creating free subscription", { error: subError.message });
        throw new Error(`Failed to create free subscription: ${subError.message}`);
      }

      logStep("Free subscription created successfully");
      return new Response(JSON.stringify({ 
        free_access: true,
        message: "Free access granted" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripeKey = Deno.env.get("stripesecret");
    if (!stripeKey) throw new Error("Stripe secret key not configured");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({ 
        email: user.email,
        metadata: { user_id: user.id }
      });
      customerId = newCustomer.id;
      logStep("Created new customer", { customerId });
    }

    // If discount code provided, use Checkout Session for proper redemption tracking
    if (discountCode) {
      logStep("Creating Checkout Session with discount code", { discountCode });
      
      // Look up the promotion code
      const promotionCodes = await stripe.promotionCodes.list({
        code: discountCode,
        active: true,
        limit: 1,
      });

      if (promotionCodes.data.length === 0) {
        logStep("Invalid discount code", { discountCode });
        return new Response(JSON.stringify({ error: "Invalid discount code" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const promotionCode = promotionCodes.data[0];
      logStep("Found valid promotion code", { promotionCodeId: promotionCode.id });

      // Create Checkout Session with promotion code
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: { name: "Premium Access" },
              unit_amount: amount * 100, // Convert to pence
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        discounts: [{ promotion_code: promotionCode.id }],
        success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/payment`,
        metadata: {
          user_id: user.id,
          original_amount: (amount * 100).toString(),
          discount_code: discountCode,
        },
      });

      logStep("Checkout Session created", { sessionId: session.id, url: session.url });

      return new Response(JSON.stringify({
        checkout_session: true,
        session_id: session.id,
        url: session.url,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // No discount code - use PaymentIntent as before
    logStep("Creating PaymentIntent without discount", { amount });

    const paymentIntentParams: any = {
      amount: amount * 100, // Convert to pence
      currency: "gbp",
      customer: customerId,
      metadata: {
        user_id: user.id,
        user_email: user.email,
      },
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
    logStep("PaymentIntent created", { paymentIntentId: paymentIntent.id, amount });

    return new Response(JSON.stringify({
      client_secret: paymentIntent.client_secret,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment-intent", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});