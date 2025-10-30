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

    // Check for 100% discount codes that should bypass payment entirely
    let promotionCodeToApply = null;
    
    if (discountCode && discountCode.trim() !== "") {
      logStep("Processing discount code", { discountCode: discountCode.trim() });
      
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: discountCode.trim(),
          active: true,
          limit: 1,
        });

        if (promotionCodes.data.length > 0) {
          const promotionCode = promotionCodes.data[0];
          logStep("Found valid promotion code", { 
            discountCode: discountCode.trim(),
            promotionCodeId: promotionCode.id,
            percentOff: promotionCode.coupon.percent_off,
            amountOff: promotionCode.coupon.amount_off
          });
          
          // Handle 100% discounts specially (free access)
          if (promotionCode.coupon.percent_off === 100) {
            logStep("100% discount detected - providing free access", { discountCode });

            // CRITICAL: Create a $0 invoice with the promotion code to track usage
            // This works with one-time payment prices and ensures Stripe tracks redemptions
            try {
              // Create invoice item for the product
              const invoiceItem = await stripe.invoiceItems.create({
                customer: customerId,
                price: priceId,
                description: `Menopause Consultation Tool - Free with ${discountCode.trim()}`,
              });

              logStep("Created invoice item", { invoiceItemId: invoiceItem.id });

              // Create invoice
              const invoice = await stripe.invoices.create({
                customer: customerId,
                auto_advance: false, // Don't auto-finalize
                discounts: [{ promotion_code: promotionCode.id }], // Apply promotion code
                metadata: {
                  free_access: 'true',
                  discount_code: discountCode.trim(),
                  email: email,
                  first_name: firstName,
                  last_name: lastName,
                  market_code: validMarketCode
                }
              });

              logStep("Created invoice with promotion code", {
                invoiceId: invoice.id,
                promotionCodeId: promotionCode.id,
                amountDue: invoice.amount_due,
                total: invoice.total
              });

              // Finalize the invoice to apply the discount and track usage
              const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

              logStep("Finalized invoice", {
                invoiceId: finalizedInvoice.id,
                amountDue: finalizedInvoice.amount_due,
                status: finalizedInvoice.status
              });

              // If amount is $0, mark as paid
              if (finalizedInvoice.amount_due === 0) {
                await stripe.invoices.pay(finalizedInvoice.id);
                logStep("Marked $0 invoice as paid - promotion code usage tracked", {
                  invoiceId: finalizedInvoice.id
                });
              }

            } catch (stripeError) {
              logStep("Failed to create invoice with promotion code", { error: stripeError.message });
              // Check if it's because the promotion code reached its limit or doesn't apply
              if (stripeError.message.includes('promotion') || stripeError.message.includes('coupon') || stripeError.message.includes('discount')) {
                return new Response(JSON.stringify({
                  success: false,
                  error: "This discount code has reached its usage limit, doesn't apply to this product, or is no longer valid."
                }), {
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                  status: 400,
                });
              }
              throw stripeError;
            }

            // Create user immediately for free access
            const supabaseService = createClient(
              Deno.env.get("SUPABASE_URL") ?? "",
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            );

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
              if (authError.message.includes('already been registered')) {
                return new Response(JSON.stringify({
                  success: false,
                  error: "An account with this email already exists. Please sign in instead."
                }), {
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                  status: 400,
                });
              }
              throw new Error(`Failed to create user: ${authError.message}`);
            }

            const newUser = authData.user;
            if (!newUser) throw new Error("Failed to create user for free access");

            // Create subscription for free access
            await supabaseService.from('user_subscriptions').insert({
              user_id: newUser.id,
              subscription_type: 'free',
              status: 'active',
              amount_paid: 0,
              currency: marketConfig.currency,
              expires_at: null,
              welcome_email_sent: false,
              updated_at: new Date().toISOString(),
            });

            // Send welcome email
            try {
              await supabaseService.functions.invoke('send-welcome-email-idempotent', {
                body: {
                  user_id: newUser.id,
                  email: email,
                  firstName: firstName,
                  isPaid: false
                }
              });
            } catch (emailError) {
              logStep("Failed to send welcome email", { error: emailError });
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
          } else {
            // For all other discounts, store to apply to Stripe session
            promotionCodeToApply = promotionCode.id;
            logStep("Will apply partial discount to Stripe session", { 
              discountCode: discountCode.trim(),
              promotionCodeId: promotionCodeToApply,
              percentOff: promotionCode.coupon.percent_off 
            });
          }
        } else {
          logStep("Discount code not found in Stripe", { discountCode: discountCode.trim() });
        }
      } catch (error) {
        logStep("Error validating discount code", { 
          discountCode: discountCode.trim(),
          error: error.message 
        });
      }
    }

    // Continue with Stripe checkout for paid access

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
      allow_promotion_codes: true, // Let Stripe handle ALL discount code validation
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

    // Apply promotion code if we found one
    if (promotionCodeToApply) {
      sessionConfig.discounts = [{ promotion_code: promotionCodeToApply }];
      logStep("Applied promotion code to Stripe session", { 
        promotionCodeId: promotionCodeToApply,
        discountCode: discountCode.trim()
      });
    }
    
    logStep("Final session config", { 
      allowPromotionCodes: sessionConfig.allow_promotion_codes,
      hasPreAppliedDiscount: !!sessionConfig.discounts,
      discountCode: discountCode || "none"
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