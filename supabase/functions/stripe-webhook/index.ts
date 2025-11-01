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
    logStep("Webhook received", { 
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });

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

    // Verify webhook signature (using async version for Supabase Edge Functions)
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
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

      // Handle BOTH paid orders and free orders (100% discount = no_payment_required)
      // This is Stripe's official best practice for handling all checkout completions
      if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
        const isFree = session.payment_status === "no_payment_required";
        logStep(isFree ? "Processing FREE order (100% discount)" : "Processing PAID order", {
          amountTotal: session.amount_total
        });
        // Extract user data from session metadata
        const metadata = session.metadata || {};
        const email = metadata.email;
        const firstName = metadata.first_name;
        const lastName = metadata.last_name;
        const password = metadata.password;

        if (!email) {
          logStep("No email found in metadata");
          return new Response(JSON.stringify({ received: true, processed: false, reason: "no_email" }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
          });
        }

        logStep("User data extracted from metadata", { email, firstName, lastName, hasPassword: !!password });

        // Check if user already exists
        const { data: userData, error: userError } = await supabaseService.auth.admin.listUsers();
        if (userError) {
          logStep("Error fetching users", { error: userError.message });
          throw new Error(`Failed to fetch users: ${userError.message}`);
        }

        let user = userData.users.find(u => u.email === email);
        
        // Create user if doesn't exist
        if (!user && password) {
          logStep("Creating new user", { email });
          
          const { data: newUserData, error: createError } = await supabaseService.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              first_name: firstName,
              last_name: lastName
            }
          });

          if (createError) {
            logStep("Error creating user", { error: createError.message });
            return new Response(JSON.stringify({ 
              received: true,
              processed: false,
              reason: 'user_creation_failed',
              error: createError.message
            }), {
              headers: { "Content-Type": "application/json" },
              status: 200,
            });
          }

          user = newUserData.user;
          logStep("User created successfully", { userId: user.id });
        }

        if (!user) {
          logStep("Could not create or find user");
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
          // Create subscription (free or paid based on amount)
          const subscriptionType = session.amount_total === 0 ? "free" : "paid";
          const { error: subError } = await supabaseService
            .from("user_subscriptions")
            .insert({
              user_id: user.id,
              subscription_type: subscriptionType,
              status: "active",
              stripe_customer_id: session.customer as string || null,
              stripe_session_id: session.id,
              amount_paid: session.amount_total || 0, // Keep in pence/cents as integer
              currency: session.currency || "gbp",
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              welcome_email_sent: false, // Will be set to true by email function after successful send
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
          logStep("Subscription already exists, updating to active status", { userId: user.id, existingStatus: existingSub.status });

          // Update existing subscription to active status and reset email flag for email function
          const subscriptionType = session.amount_total === 0 ? "free" : "paid";
          const { error: updateError } = await supabaseService
            .from("user_subscriptions")
            .update({
              subscription_type: subscriptionType,
              status: "active",
              stripe_customer_id: session.customer as string || null,
              stripe_session_id: session.id,
              amount_paid: session.amount_total || 0, // Keep in pence/cents as integer
              currency: session.currency || "gbp",
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
              welcome_email_sent: false, // Reset to false so email function can send email
            })
            .eq('user_id', user.id);

          if (updateError) {
            logStep("ERROR updating existing subscription", { error: updateError.message });
            throw new Error(`Failed to update subscription: ${updateError.message}`);
          }

          logStep("Subscription updated to active via webhook", { userId: user.id });

          // Send welcome email for updated subscription
          try {
            logStep("About to send welcome email for updated subscription", { 
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
                isPaid: session.amount_total > 0
              }
            });

            if (emailError) {
              logStep("ERROR sending welcome email for updated subscription", { 
                error: emailError,
                userId: user.id,
                email: user.email 
              });
            } else {
              logStep("Welcome email sent for updated subscription", { 
                email: user.email, 
                amountPaid: session.amount_total,
                skipped: emailData?.skipped,
                emailId: emailData?.id,
                success: emailData?.success
              });
            }
          } catch (emailError) {
            logStep("ERROR in welcome email process for updated subscription", { 
              error: emailError,
              errorMessage: emailError?.message,
              userId: user.id,
              email: user.email 
            });
          }
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