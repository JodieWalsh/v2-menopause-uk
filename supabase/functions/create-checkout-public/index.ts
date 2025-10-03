import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT-PUBLIC] ${step}${detailsStr}`);
};

const STRIPE_PRODUCT_ID = "prod_SnDJCDMZWdUQGl";
const STRIPE_PRICE_ID = "price_1RrcsPATHqCGypnRMPr4nbKE";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email, firstName, lastName, password, discountCode } = await req.json();
    
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

    logStep("Request parsed and validated", { email, firstName, lastName, hasPassword: !!password, discountCode });

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

    // Look up promotion code if provided
    let promotionCodeId = null;
    if (discountCode && discountCode.trim() !== "") {
      logStep("Looking up promotion code", { discountCode });

      const promotionCodes = await stripe.promotionCodes.list({
        code: discountCode,
        active: true,
        limit: 1,
      });

      if (promotionCodes.data.length === 0) {
        logStep("Invalid discount code", { discountCode });
        return new Response(JSON.stringify({ 
          success: false,
          error: "The discount code you entered is invalid or has expired. Please check and try again, or proceed without a discount code." 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const promotionCode = promotionCodes.data[0];
      promotionCodeId = promotionCode.id;
      logStep("Found valid promotion code", { promotionCodeId });

      // Check redemption limits
      if (promotionCode.coupon.max_redemptions && 
          promotionCode.coupon.times_redeemed >= promotionCode.coupon.max_redemptions) {
        return new Response(JSON.stringify({ 
          success: false,
          error: "Discount code has reached its usage limit" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Check if this is a 100% discount (free access)
      const coupon = promotionCode.coupon;
      const baseAmount = 19; // £19 base price
      let finalAmount = baseAmount;

      if (coupon.percent_off === 100) {
        logStep("100% discount detected - providing free access", { discountCode });
        
        // For 100% discounts, we need to create the user immediately and give them access
        const supabaseService = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        // Create user immediately for free access
        const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
          email,
          password,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
          },
          email_confirm: true,
        });

        if (authError) {
          logStep("User creation error for free access", { error: authError.message });
          
          if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
            return new Response(JSON.stringify({
              success: false,
              error: "An account with this email already exists. Please sign in instead."
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            });
          }

          return new Response(JSON.stringify({
            success: false,
            error: authError.message
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          });
        }

        const newUser = authData.user;
        if (!newUser) {
          throw new Error("Failed to create user for free access");
        }

        // Create subscription record for free access
        const { error: subError } = await supabaseService
          .from('user_subscriptions')
          .insert({
            user_id: newUser.id,
            subscription_type: 'free',
            status: 'active',
            amount_paid: 0,
            currency: 'gbp',
            expires_at: null,
            welcome_email_sent: false,
            updated_at: new Date().toISOString(),
          });

        if (subError) {
          logStep("Subscription creation error for free access", { error: subError.message });
          // Don't fail the registration, but log the error
        }

        // Send welcome email for free access
        try {
          await supabaseService.functions.invoke('send-welcome-email-idempotent', {
            body: {
              user_id: newUser.id,
              email: email,
              firstName: firstName,
              isPaid: false
            }
          });
          logStep("Welcome email sent for free access");
        } catch (emailError) {
          logStep("Failed to send welcome email for free access", { error: emailError });
          // Don't fail the registration if email fails
        }

        return new Response(JSON.stringify({
          success: true,
          freeAccess: true,
          message: "Account created successfully! Your discount code gave you free access.",
          userId: newUser.id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Create Checkout Session with user data in metadata
    const sessionConfig: any = {
      customer: customerId,
      line_items: [
        {
          price: STRIPE_PRICE_ID,
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
        discount_code_applied: discountCode || "none"
      },
      automatic_tax: { enabled: false },
      billing_address_collection: 'auto'
    };

    // Apply promotion code if valid
    if (promotionCodeId) {
      sessionConfig.discounts = [{ promotion_code: promotionCodeId }];
      logStep("Applied promotion code to session", { promotionCodeId });
    }

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