
  import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
  import Stripe from "https://esm.sh/stripe@14.21.0";
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[REGISTER-WITH-DISCOUNT] ${step}${detailsStr}`);
  };

  serve(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      logStep("Function started");

      const body = await req.json();
      const { email, password, firstName, lastName, discountCode } = body;

      logStep("Request parsed", { email, firstName, lastName, hasDiscountCode: !!discountCode });

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        logStep("Missing required fields");
        return new Response(JSON.stringify({
          error: "Missing required fields: email, password, firstName, and lastName are required"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      // Create Supabase client using service role
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Validate discount code if provided
      let isValidDiscount = false;
      let discountAmount = 0;
      let finalAmount = 19; // Base price

      if (discountCode && discountCode.trim()) {
        logStep("Validating discount code", { code: discountCode.trim() });

        try {
          const stripe = new Stripe(Deno.env.get("stripesecret") || "", {
            apiVersion: "2023-10-16",
          });

          const promotionCodes = await stripe.promotionCodes.list({
            code: discountCode.trim(),
            active: true,
            limit: 1,
          });

          if (promotionCodes.data.length > 0) {
            const promotionCodeData = promotionCodes.data[0];
            const coupon = promotionCodeData.coupon;

            if (coupon.percent_off) {
              discountAmount = Math.round((finalAmount * coupon.percent_off)) / 100;
            } else if (coupon.amount_off) {
              discountAmount = coupon.amount_off / 100;
            }

            finalAmount = Math.max(0, Math.round((finalAmount - discountAmount) * 100) / 100);
            isValidDiscount = true;
            logStep("Valid discount code applied", { discountAmount, finalAmount });
          } else {
            logStep("Invalid discount code", { code: discountCode.trim() });
            return new Response(JSON.stringify({
              success: false,
              error: `Invalid discount code "${discountCode.trim()}". Please check the code and try again.`
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            });
          }
        } catch (stripeError) {
          logStep("Stripe discount validation error", { error: stripeError.message });
          // Continue with registration even if discount validation fails
        }
      }

      // Create user with Supabase Auth
      logStep("Creating user with Supabase Auth", { email });
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
        logStep("User creation error", { error: authError.message });

        if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
          // Handle existing user with free discount code
          if (isValidDiscount && finalAmount === 0) {
            const { data: existingUsers } = await supabaseService.auth.admin.listUsers();
            const existingUser = existingUsers.users.find(u => u.email === email);

            if (existingUser) {
              // Update existing user subscription to free
              const { error: subError } = await supabaseService
                .from('user_subscriptions')
                .upsert({
                  user_id: existingUser.id,
                  subscription_type: 'free',
                  status: 'active',
                  amount_paid: 0,
                  currency: 'gbp',
                  expires_at: null,
                  welcome_email_sent: false,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id'
                });

              if (!subError) {
                // Send welcome email for existing user with free access
                

                return new Response(JSON.stringify({
                  success: true,
                  message: "Account updated with free access! Check your email for a welcome message. Please sign
  in to continue.",
                  userExists: true,
                  freeAccess: true
                }), {
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                  status: 200,
                });
              }
            }
          }

          return new Response(JSON.stringify({
            error: "An account with this email already exists. Please sign in instead."
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }

        return new Response(JSON.stringify({
          error: authError.message
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const newUser = authData.user;
      if (!newUser) {
        throw new Error("Failed to create user");
      }

      logStep("User created successfully", { userId: newUser.id });

      // Create subscription record
      const subscriptionData = {
        user_id: newUser.id,
        subscription_type: finalAmount === 0 ? 'free' : 'pending',
        status: finalAmount === 0 ? 'active' : 'pending',
        amount_paid: finalAmount,
        currency: 'gbp',
        expires_at: null,
        welcome_email_sent: false,
        updated_at: new Date().toISOString(),
      };

      const { error: subError } = await supabaseService
        .from('user_subscriptions')
        .insert(subscriptionData);

      if (subError) {
        logStep("Subscription creation error", { error: subError.message });
        // Don't fail the registration, but log the error
      } else {
        logStep("Subscription created successfully");
      }

      // Handle free access (send welcome email immediately)
      if (finalAmount === 0 && isValidDiscount) {
        

        return new Response(JSON.stringify({
          success: true,
          message: "Account created successfully! Your discount code gave you free access.",
          userId: newUser.id,
          redirectTo: "/welcome",
          freeAccess: true,
          discountApplied: true,
          originalAmount: 19,
          discountAmount: discountAmount
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Paid access - create Stripe Checkout session directly
        try {
          const stripe = new Stripe(Deno.env.get("stripesecret") || "", {
            apiVersion: "2023-10-16",
          });

          // Get or create Stripe customer
          const customers = await stripe.customers.list({ email, limit: 1 });
          let customerId = customers.data[0]?.id;

          if (!customerId) {
            const customer = await stripe.customers.create({
              email,
              name: `${firstName} ${lastName}`,
              metadata: { user_id: newUser.id }
            });
            customerId = customer.id;
          }

          // Find promotion code if discount was applied
          let promotionCodeId;
          if (isValidDiscount && discountCode) {
            const promotionCodes = await stripe.promotionCodes.list({
              code: discountCode.trim(),
              active: true,
              limit: 1,
            });
            if (promotionCodes.data.length > 0) {
              promotionCodeId = promotionCodes.data[0].id;
            }
          }

          // Create Stripe Checkout Session
          const sessionConfig: any = {
            customer: customerId,
            line_items: [{ price: "price_1RrcsPATHqCGypnRMPr4nbKE", quantity: 1 }],
            mode: "payment",
            success_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth`,
            locale: "en",
            payment_method_types: ["card"],
            metadata: {
              user_id: newUser.id,
              discount_code_applied: discountCode || "none"
            }
          };

          if (promotionCodeId) {
            sessionConfig.discounts = [{ promotion_code: promotionCodeId }];
          }

          const session = await stripe.checkout.sessions.create(sessionConfig);

          return new Response(JSON.stringify({
            success: true,
            message: `Account created successfully! ${isValidDiscount ? `Discount applied - reduced from £19 to £${finalAmount}.` : ''} Redirecting to payment...`,
            userId: newUser.id,
            redirectTo: session.url,
            freeAccess: false,
            stripeRedirect: true,
            finalAmount,
            discountApplied: isValidDiscount,
            originalAmount: 19,
            discountAmount: discountAmount
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } catch (stripeError) {
          logStep("Stripe checkout creation failed", { error: stripeError.message });
          // Fallback to payment page
          return new Response(JSON.stringify({
            success: true,
            message: `Account created successfully! ${isValidDiscount ? `Discount applied - reduced from £19 to £${finalAmount}.` : ''} Complete payment to get started.`,
            userId: newUser.id,
            redirectTo: "/payment",
            freeAccess: false,
            finalAmount,
            discountApplied: isValidDiscount,
            originalAmount: 19,
            discountAmount: discountAmount
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
 

    } catch (error) {
      logStep("ERROR in register-with-discount", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return new Response(JSON.stringify({
        error: error.message || "Registration failed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  });