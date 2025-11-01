import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT-V2] ${step}${detailsStr}`);
};

const STRIPE_PRODUCT_ID = "prod_SnDJCDMZWdUQGl";

// Market-specific pricing IDs
const MARKET_PRICE_IDS = {
  UK: "price_1SLgBQATHqCGypnRWbcR9Inl", // £10
  US: "price_1SLgF9ATHqCGypnRO3pWMDTd", // $10 USD
  AU: "price_1SLgCMATHqCGypnRWZY6tC10", // AU$10 AUD
};

// Market configuration
const MARKET_CONFIG = {
  UK: { currency: 'gbp', symbol: '£', amount: 10 },
  US: { currency: 'usd', symbol: '$', amount: 10 },
  AU: { currency: 'aud', symbol: 'AU$', amount: 10 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email, firstName, lastName, password, discountCode, marketCode = 'UK' } = await req.json();
    
    // Validate required fields
    if (!email || !firstName || !lastName || !password) {
      logStep("Missing required fields", { email: !!email, firstName: !!firstName, lastName: !!lastName, password: !!password });
      return new Response(JSON.stringify({ 
        success: false,
        error: "Missing required fields. Please provide email, first name, last name, and password." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate email format
    if (!email.includes("@") || email.length < 5) {
      logStep("Invalid email format", { email });
      return new Response(JSON.stringify({ 
        success: false,
        error: "Please provide a valid email address." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate password length
    if (password.length < 6) {
      logStep("Password too short", { length: password.length });
      return new Response(JSON.stringify({ 
        success: false,
        error: "Password must be at least 6 characters long." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate names
    if (firstName.trim().length === 0 || lastName.trim().length === 0) {
      logStep("Invalid names", { firstName: firstName.trim(), lastName: lastName.trim() });
      return new Response(JSON.stringify({ 
        success: false,
        error: "Please provide valid first and last names." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Request parsed and validated", { email, firstName, lastName, hasPassword: !!password, discountCode, marketCode });
    
    // Validate market code
    const validMarketCode = ['UK', 'US', 'AU'].includes(marketCode) ? marketCode : 'UK';
    const marketConfig = MARKET_CONFIG[validMarketCode];
    const priceId = MARKET_PRICE_IDS[validMarketCode];
    
    logStep("Market configuration", { marketCode: validMarketCode, currency: marketConfig.currency, priceId });

    const stripeKey = Deno.env.get("stripesecret");
    if (!stripeKey) throw new Error("Stripe secret key not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get or create Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const newCustomer = await stripe.customers.create({
        email,
        name: `${firstName} ${lastName}`,
        metadata: {
          first_name: firstName,
          last_name: lastName
        }
      });
      customerId = newCustomer.id;
      logStep("Created new customer", { customerId });
    }

    // STRIPE BEST PRACTICE: Always create checkout session (even for $0 orders)
    // Let Stripe validate promotion codes, check product restrictions, and track redemptions
    // For 100% discounts, Stripe will automatically skip payment collection and fire
    // checkout.session.completed with payment_status="no_payment_required"

    let promotionCodeToApply = null;

    // If discount code provided, validate it exists before creating checkout
    // This gives immediate feedback to users if they entered an invalid/expired code
    if (discountCode && discountCode.trim() !== "") {
      logStep("Validating discount code", { discountCode: discountCode.trim() });

      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: discountCode.trim(),
          active: true,
          limit: 1,
        });

        if (promotionCodes.data.length > 0) {
          promotionCodeToApply = promotionCodes.data[0].id;
          logStep("Found valid promotion code - will pre-apply to session", {
            discountCode: discountCode.trim(),
            promotionCodeId: promotionCodeToApply,
            percentOff: promotionCodes.data[0].coupon.percent_off,
            amountOff: promotionCodes.data[0].coupon.amount_off
          });
        } else {
          // Code not found - return error immediately so user knows
          logStep("Discount code not found or inactive", { discountCode: discountCode.trim() });
          return new Response(JSON.stringify({
            success: false,
            error: `The discount code "${discountCode.trim()}" is not valid or has expired. Please check the code and try again.`
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
      } catch (error) {
        logStep("Error validating discount code", {
          discountCode: discountCode.trim(),
          error: error.message
        });
        return new Response(JSON.stringify({
          success: false,
          error: `Unable to validate discount code "${discountCode.trim()}". Please try again or proceed without a discount code.`
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }

    // Continue with Stripe checkout for all orders (paid and free)

    // Create Checkout Session with user data in metadata
    const sessionConfig: any = {
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/auth`,
      locale: "en",
      payment_method_types: ["card"],
      metadata: {
        email,
        first_name: firstName,
        last_name: lastName,
        password, // Store password temporarily in Stripe metadata
        discount_code_applied: discountCode || "none",
        market_code: validMarketCode
      },
      automatic_tax: { enabled: false },
      billing_address_collection: 'auto'
    };

    // Stripe doesn't allow both 'discounts' and 'allow_promotion_codes' in the same session
    // If we found a promotion code, pre-apply it. Otherwise, allow users to enter codes in Stripe UI.
    if (promotionCodeToApply) {
      sessionConfig.discounts = [{ promotion_code: promotionCodeToApply }];
      logStep("Pre-applied promotion code to session", {
        promotionCodeId: promotionCodeToApply,
        discountCode: discountCode.trim()
      });
    } else {
      // If no code to pre-apply, allow users to enter codes in Stripe UI
      sessionConfig.allow_promotion_codes = true;
      logStep("Enabled promotion code field in Stripe UI");
    }

    logStep("Creating checkout session", {
      allowPromotionCodes: sessionConfig.allow_promotion_codes,
      hasPreAppliedDiscount: !!sessionConfig.discounts,
      priceId: priceId,
      market: validMarketCode
    });

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout Session created", {
      sessionId: session.id,
      url: session.url,
      amountTotal: session.amount_total,
      currency: session.currency
    });

    return new Response(JSON.stringify({
      success: true,
      session_id: session.id,
      url: session.url,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});