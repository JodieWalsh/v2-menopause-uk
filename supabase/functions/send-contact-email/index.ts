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
    
    // Check if RESEND_API_KEY exists
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      logStep("ERROR: RESEND_API_KEY environment variable not found");
      throw new Error("RESEND_API_KEY environment variable not found");
    }
    logStep("RESEND_API_KEY found", { keyLength: apiKey.length });
    
    const emailResponse = await resend.emails.send({
      from: "Delivered <delivered@resend.dev>",
      to: ["support@the-empowered-patient.org"],
      subject: `Contact Form: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${title}</p>
          <p><strong>Message:</strong></p>
          <p>${content.replace(/\n/g, '<br>')}</p>
        </div>
      `,
      text: `New Contact Form Submission\n\nFrom: ${email}\nSubject: ${title}\n\nMessage:\n${content}`,
    });
    
    logStep("Raw Resend API response", emailResponse);
    
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