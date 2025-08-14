import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  email: string;
  title: string;
  content: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-CONTACT-EMAIL] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    const { email, title, content }: ContactEmailRequest = await req.json();
    logStep("Contact form data received", { email, title, hasContent: !!content });

    // Send email to support
    logStep("Attempting to send contact email via Resend");
    const emailResponse = await resend.emails.send({
      from: "Website Contact <onboarding@resend.dev>",
      to: ["support@the-empowered-patient.org"],
      subject: `Contact Form: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>From:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${title}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="line-height: 1.6; color: #555;">${content.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              <strong>Response Required:</strong> Please respond to this inquiry within 2 business days.
            </p>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission

From: ${email}
Subject: ${title}

Message:
${content}

Please respond to this inquiry within 2 business days.
      `,
    });

    logStep("Resend API response received", { 
      emailId: emailResponse.data?.id, 
      error: emailResponse.error,
      success: !emailResponse.error 
    });

    // Check if the email send failed
    if (emailResponse.error) {
      logStep("ERROR: Resend API failed to send contact email", { 
        error: emailResponse.error,
        email: email
      });
      throw new Error(`Failed to send contact email via Resend: ${JSON.stringify(emailResponse.error)}`);
    }

    logStep("Contact email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    logStep("ERROR in send-contact-email", { error: error.message });
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to send contact email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);