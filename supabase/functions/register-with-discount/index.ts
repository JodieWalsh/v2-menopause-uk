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
    const { email, password, firstName, lastName, discountCode } = await req.json();

    // Create Supabase client using service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // First, validate the discount code if provided
    let isValidDiscount = false;
    let discountAmount = 0;
    let finalAmount = 19; // Base price

    if (discountCode && discountCode.trim()) {
      const stripe = new Stripe(Deno.env.get("stripesecret") || "", {
        apiVersion: "2023-10-16",
      });

      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: discountCode.trim(),
          active: true,
          limit: 1,
        });

        if (promotionCodes.data.length > 0) {
          const promotionCodeData = promotionCodes.data[0];
          const coupon = promotionCodeData.coupon;
          
          if (coupon.percent_off) {
            discountAmount = Math.round((finalAmount * coupon.percent_off) / 100);
          } else if (coupon.amount_off) {
            discountAmount = coupon.amount_off / 100; // Convert from cents to pounds
          }
          
          finalAmount = Math.max(0, finalAmount - discountAmount);
          isValidDiscount = true;
        }
      } catch (stripeError) {
        console.error("Stripe discount validation error:", stripeError);
        // Continue with registration even if discount validation fails
      }
    }

    // Register the user with Supabase Auth
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
      email_confirm: true, // Auto-confirm the email
    });

    if (authError) {
      console.error("User creation error:", authError);
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

    console.log(`Created user ${newUser.id} with email ${email}`);

    // Create subscription record based on discount
    const subscriptionData = {
      user_id: newUser.id,
      subscription_type: finalAmount === 0 ? 'free' : 'pending',
      status: finalAmount === 0 ? 'active' : 'pending',
      amount_paid: finalAmount === 0 ? 0 : null,
      currency: 'gbp',
      expires_at: null,
      stripe_customer_id: null,
      stripe_session_id: null
    };

    const { error: subError } = await supabaseService
      .from('user_subscriptions')
      .insert(subscriptionData);

    if (subError) {
      console.error('Error creating subscription record:', subError);
      // Don't fail the registration, but log the error
    }

    // Return response based on whether it's free or paid
    if (finalAmount === 0) {
      // Free access - direct to welcome
      return new Response(JSON.stringify({ 
        success: true,
        message: "Account created successfully with free access!",
        userId: newUser.id,
        redirectTo: "/welcome",
        freeAccess: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Paid access - need to go to payment
      return new Response(JSON.stringify({ 
        success: true,
        message: "Account created successfully!",
        userId: newUser.id,
        redirectTo: "/payment",
        freeAccess: false,
        finalAmount
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Registration failed" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});