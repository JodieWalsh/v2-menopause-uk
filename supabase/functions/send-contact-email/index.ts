import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get form data
    const { email, title, content } = await req.json();
    
    // Validate required fields
    if (!email || !title || !content) {
      throw new Error("Missing required fields: email, title, content");
    }

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable not configured");
    }

    const resend = new Resend(resendApiKey);

    // Send email
    const result = await resend.emails.send({
      from: "Contact Form <delivered@resend.dev>",
      to: ["support@the-empowered-patient.org"],
      subject: `Contact Form: ${title}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${title}</p>
        <p><strong>Message:</strong></p>
        <p>${content}</p>
      `,
      text: `New Contact Form Submission\n\nFrom: ${email}\nSubject: ${title}\n\nMessage:\n${content}`
    });

    // Check for errors
    if (result.error) {
      throw new Error(`Resend API error: ${JSON.stringify(result.error)}`);
    }

    // Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("Contact form error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});