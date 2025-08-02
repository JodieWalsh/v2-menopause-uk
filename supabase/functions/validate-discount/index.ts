import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { discountCode, amount } = await req.json();
    
    if (!discountCode) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Discount code is required" 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("stripesecret") || "", {
      apiVersion: "2023-10-16",
    });

    try {
      // List promotion codes from Stripe
      const promotionCodes = await stripe.promotionCodes.list({
        code: discountCode,
        active: true,
        limit: 1,
      });

      if (promotionCodes.data.length === 0) {
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: "Invalid discount code" 
          }), 
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      const promotionCode = promotionCodes.data[0];
      const coupon = promotionCode.coupon;

      // Calculate discount
      let discountAmount = 0;
      let finalAmount = amount;

      if (coupon.percent_off) {
        discountAmount = Math.round((amount * coupon.percent_off) / 100);
      } else if (coupon.amount_off) {
        discountAmount = coupon.amount_off / 100; // Convert from cents to pounds
      }

      finalAmount = Math.max(0, amount - discountAmount);

      return new Response(
        JSON.stringify({
          valid: true,
          discountAmount,
          finalAmount,
          discountType: coupon.percent_off ? 'percentage' : 'fixed',
          discountValue: coupon.percent_off || (coupon.amount_off ? coupon.amount_off / 100 : 0),
          currency: coupon.currency || 'gbp'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (stripeError) {
      console.error("Stripe error:", stripeError);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Error validating discount code" 
        }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

  } catch (error) {
    console.error("General error:", error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: "Internal server error" 
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});