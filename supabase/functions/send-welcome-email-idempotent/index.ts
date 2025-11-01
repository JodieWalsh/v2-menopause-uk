import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  user_id: string;
  email: string;
  firstName?: string;
  isPaid: boolean;
  marketCode?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WELCOME-EMAIL-IDEMPOTENT] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { user_id, email, firstName, isPaid, marketCode = 'UK' }: WelcomeEmailRequest = await req.json();
    logStep("Request parsed", { user_id, email, isPaid, marketCode });

    if (!user_id || !email) {
      throw new Error("user_id and email are required");
    }

    // Use service role for atomic operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if email already sent (idempotency check)
    const { data: subscription, error: checkError } = await supabaseService
      .from("user_subscriptions")
      .select("welcome_email_sent")
      .eq("user_id", user_id)
      .single();

    if (checkError) {
      logStep("ERROR checking email status", { error: checkError.message });
      throw new Error(`Failed to check email status: ${checkError.message}`);
    }

    if (subscription?.welcome_email_sent) {
      logStep("Email already sent, skipping", { user_id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Email already sent",
        skipped: true 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    logStep("Email not yet sent, proceeding");

    // Map market code to correct domain
    const MARKET_DOMAINS = {
      'UK': 'https://menopause.the-empowered-patient.org',
      'US': 'https://menopause.the-empowered-patient.com',
      'AU': 'https://menopause.the-empowered-patient.com.au'
    };

    const siteUrl = MARKET_DOMAINS[marketCode as keyof typeof MARKET_DOMAINS] || MARKET_DOMAINS['UK'];
    logStep("Using site URL for market", { marketCode, siteUrl });

    // Generate idempotency key for email service
    const idempotencyKey = `welcome_${user_id}_${Date.now()}`;

    // Send email with idempotency
    logStep("Attempting to send email via Resend", { email, idempotencyKey });
    
    const emailResponse = await resend.emails.send({
      from: "The Empowered Patient <support@the-empowered-patient.org>",
      to: [email],
      subject: "Welcome to Your Health Assessment Journey!",
      headers: {
        'X-Idempotency-Key': idempotencyKey,
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header with Logo -->
            <div style="text-align: center; margin-bottom: 30px;">
              <img 
                src="https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/logos//website_logo_transparent.png" 
                alt="The Empowered Patient Logo" 
                style="height: 80px; width: auto; margin-bottom: 20px;"
              />
              <h1 style="color: #9ec0b7; margin: 0; font-size: 28px; font-weight: bold;">
                Welcome${firstName ? ` ${firstName}` : ''}!
              </h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">
              Thank you for ${isPaid ? 'your purchase and' : ''} joining The Empowered Patient community. 
              We're excited to support you on your personalized menopause wellness journey.
            </p>
            
            <div style="background: linear-gradient(135deg, #9ec0b7 0%, #7ba49e 100%); padding: 20px 15px; border-radius: 8px; margin: 20px 0; width: 100%; box-sizing: border-box;">
              <h2 style="color: white; margin-top: 0; margin-bottom: 15px; font-size: 20px; line-height: 1.4;">What's Next?</h2>
              <ul style="line-height: 1.6; color: white; margin: 0; padding-left: 20px; font-size: 15px;">
                <li style="margin-bottom: 8px;">Complete your comprehensive menopause assessment</li>
                <li>Receive your personalised "doctor ready" document to bring to your appointment</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${siteUrl}/welcome" 
                 style="background: linear-gradient(135deg, #9ec0b7 0%, #7ba49e 100%); color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;
                        box-shadow: 0 4px 6px rgba(158, 192, 183, 0.3);">
                Start Your Assessment Now
              </a>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
                <strong>Need help?</strong> Our support team is here for you. 
                Simply reply to this email or contact us at 
                <a href="mailto:support@the-empowered-patient.org" style="color: #9ec0b7;">support@the-empowered-patient.org</a>
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <div style="text-align: center;">
              <p style="font-size: 14px; color: #64748b; margin: 10px 0;">
                <strong>The Empowered Patient</strong><br>
                Empowering women through personalized menopause care
              </p>
              <p style="font-size: 12px; color: #94a3b8; margin: 5px 0;">
                You're receiving this email because you created an account with us.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
        Welcome${firstName ? ` ${firstName}` : ''}!
        
        Thank you for ${isPaid ? 'your purchase and' : ''} joining The Empowered Patient community. 
        We're excited to support you on your personalized menopause wellness journey.
        
        What's Next?
        • Complete your comprehensive menopause assessment
        • Receive your personalised "doctor ready" document to bring to your appointment
        
        Start your assessment: ${siteUrl}/welcome
        
        Need help? Our support team is here for you. Simply reply to this email or contact us at support@the-empowered-patient.org
        
        The Empowered Patient
        Empowering women through personalized menopause care
      `
    });

    logStep("Resend API response received", { 
      emailId: emailResponse.data?.id, 
      error: emailResponse.error,
      success: !emailResponse.error 
    });

    // Check if the email send failed
    if (emailResponse.error) {
      logStep("ERROR: Resend API failed to send email", { 
        error: emailResponse.error,
        email: email,
        user_id: user_id 
      });
      throw new Error(`Failed to send email via Resend: ${JSON.stringify(emailResponse.error)}`);
    }

    if (!emailResponse.data?.id) {
      logStep("ERROR: No email ID returned from Resend", { response: emailResponse });
      throw new Error("Resend API did not return an email ID");
    }

    logStep("Email sent successfully", { emailId: emailResponse.data.id });

    // Atomically mark email as sent
    const { error: updateError } = await supabaseService
      .from("user_subscriptions")
      .update({ 
        welcome_email_sent: true,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user_id);

    if (updateError) {
      logStep("ERROR updating email flag", { error: updateError.message });
      // Email was sent but flag update failed - this should be logged but not fail the request
      console.error("CRITICAL: Email sent but flag update failed:", updateError);
    } else {
      logStep("Email flag updated successfully");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      id: emailResponse.data?.id,
      idempotency_key: idempotencyKey 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    logStep("ERROR in send-welcome-email-idempotent", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);