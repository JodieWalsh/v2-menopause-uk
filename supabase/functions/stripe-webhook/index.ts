import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("stripesecret");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type, id: event.id });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if we've already processed this event (idempotency)
    const { data: existingEvent } = await supabaseService
      .from("webhook_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .single();

    if (existingEvent) {
      logStep("Event already processed", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, processed: false, reason: "duplicate" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Log the event as processed
    await supabaseService
      .from("webhook_events")
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      });

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout.session.completed", { 
        sessionId: session.id, 
        customerId: session.customer,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency
      });

      if (session.payment_status === "paid" && session.customer) {
        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(session.customer as string);
        if (customer.deleted) {
          logStep("Customer was deleted", { customerId: session.customer });
          return new Response(JSON.stringify({ received: true, processed: false, reason: "customer_deleted" }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          });
        }

        const customerEmail = customer.email;
        if (!customerEmail) {
          logStep("No email found for customer", { customerId: session.customer });
          return new Response(JSON.stringify({ received: true, processed: false, reason: "no_email" }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Find user by email
        const { data: userData, error: userError } = await supabaseService.auth.admin.listUsers();
        if (userError) {
          logStep("Error fetching users", { error: userError.message });
          throw new Error(`Failed to fetch users: ${userError.message}`);
        }

        const user = userData.users.find(u => u.email === customerEmail);
        if (!user) {
          logStep("User not found", { email: customerEmail });
          return new Response(JSON.stringify({ received: true, processed: false, reason: "user_not_found" }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Check if subscription already exists
        const { data: existingSub } = await supabaseService
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!existingSub) {
          // Create subscription
          const { error: subError } = await supabaseService
            .from("user_subscriptions")
            .insert({
              user_id: user.id,
              subscription_type: "paid",
              status: "active",
              stripe_customer_id: session.customer as string,
              stripe_session_id: session.id,
              amount_paid: (session.amount_total || 0) / 100,
              currency: session.currency || "gbp",
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              welcome_email_sent: false,
              updated_at: new Date().toISOString(),
            });

          if (subError) {
            logStep("ERROR creating subscription", { error: subError.message });
            throw new Error(`Failed to create subscription: ${subError.message}`);
          }

          logStep("Subscription created via webhook", { userId: user.id });

          // PRIMARY PATH: Send welcome email after successful payment
          try {
            logStep("About to send welcome email", { 
              userId: user.id, 
              email: user.email, 
              firstName: user.user_metadata?.first_name,
              amountPaid: session.amount_total 
            });

            const { data: emailData, error: emailError } = await supabaseService.functions.invoke('send-welcome-email-idempotent', {
              body: {
                user_id: user.id,
                email: user.email!,
                firstName: user.user_metadata?.first_name,
                isPaid: session.amount_total > 0 // True for paid, false for £0.00 payments
              }
            });

            if (emailError) {
              logStep("ERROR sending welcome email via webhook", { 
                error: emailError,
                userId: user.id,
                email: user.email 
              });
            } else {
              logStep("Welcome email sent via webhook", { 
                email: user.email, 
                amountPaid: session.amount_total,
                skipped: emailData?.skipped,
                emailId: emailData?.id,
                success: emailData?.success
              });
            }
          } catch (emailError) {
            logStep("ERROR in welcome email process via webhook", { 
              error: emailError,
              errorMessage: emailError?.message,
              userId: user.id,
              email: user.email 
            });
          }
        } else {
          logStep("Subscription already exists via webhook", { userId: user.id });
        }
      }
    }

    return new Response(JSON.stringify({ received: true, processed: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});