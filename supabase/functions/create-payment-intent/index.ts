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

  // Your actual Stripe Product and Price IDs
  const STRIPE_PRODUCT_ID = "prod_SnDJCDMZWdUQGl";
  const STRIPE_PRICE_ID = "price_1RrcsPATHqCGypnRMPr4nbKE";

  serve(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    try {
      logStep("Function started");

      const { discountCode } = await req.json();
      logStep("Request parsed", { discountCode });

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

      // Look up promotion code if provided
      let promotionCodeId = null;
      if (discountCode && discountCode.trim() !== "" && discountCode !== "Applied from registration") {
        logStep("Looking up promotion code", { discountCode });

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
        promotionCodeId = promotionCode.id;
        logStep("Found valid promotion code", {
          promotionCodeId: promotionCode.id,
          couponId: promotionCode.coupon.id,
          couponValid: promotionCode.coupon.valid,
          maxRedemptions: promotionCode.coupon.max_redemptions,
          timesRedeemed: promotionCode.coupon.times_redeemed
        });

        // Check redemption limits
        if (promotionCode.coupon.max_redemptions && promotionCode.coupon.times_redeemed >= promotionCode.coupon.max_redemptions) {
          logStep("Coupon redemption limit exceeded", {
            maxRedemptions: promotionCode.coupon.max_redemptions,
            timesRedeemed: promotionCode.coupon.times_redeemed
          });
          return new Response(JSON.stringify({ error: "Discount code has reached its usage limit" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
      }

      // Create Checkout Session using actual Stripe Product/Price IDs
      logStep("Creating Checkout Session with Product ID", { productId: STRIPE_PRODUCT_ID, priceId: STRIPE_PRICE_ID, promotionCodeId });

      const sessionConfig: any = {
        customer: customerId,
        line_items: [
          {
            price: STRIPE_PRICE_ID, // Use actual Price ID from Stripe
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/payment`,
        locale: "en", // Fix: Explicitly set locale to English
        metadata: {
          user_id: user.id,
          product_id: STRIPE_PRODUCT_ID,
          price_id: STRIPE_PRICE_ID,
          discount_code_applied: discountCode || "none"
        },
        payment_intent_data: {
          metadata: {
            user_id: user.id,
            product_id: STRIPE_PRODUCT_ID
          }
        },
        // For one-time payments, Stripe automatically handles £0.00 payments without requiring payment method collection
        automatic_tax: { enabled: false },
        payment_method_types: ['card'], // Fix: Explicitly specify payment methods
        billing_address_collection: 'auto' // Fix: Improve address collection
      };

      // Apply promotion code if valid - this will properly redeem the code and increment times_redeemed
      if (promotionCodeId) {
        sessionConfig.discounts = [{ promotion_code: promotionCodeId }];
        logStep("Applied promotion code to session - redemption will be tracked by Stripe", { promotionCodeId });
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);

      logStep("Checkout Session created", {
        sessionId: session.id,
        url: session.url,
        amountTotal: session.amount_total,
        currency: session.currency,
        paymentStatus: session.payment_status
      });

      return new Response(JSON.stringify({
        checkout_session: true,
        session_id: session.id,
        url: session.url,
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
