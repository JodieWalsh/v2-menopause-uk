import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Contact email function called");
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing request...");
    
    // Get form data
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body parsed:", requestBody);
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      throw new Error("Invalid JSON in request body");
    }
    
    const { email, title, content } = requestBody;
    
    // Validate required fields
    if (!email || !title || !content) {
      console.error("Missing fields:", { email: !!email, title: !!title, content: !!content });
      throw new Error("Missing required fields: email, title, content");
    }

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not found in environment");
      throw new Error("RESEND_API_KEY environment variable not configured");
    }
    
    console.log("Resend API key found, initializing...");
    const resend = new Resend(resendApiKey);

    console.log("Sending email...");
    
    // Send email
    const result = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
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

    console.log("Resend result:", result);

    // Check for errors
    if (result.error) {
      console.error("Resend API error:", result.error);
      throw new Error(`Resend API error: ${JSON.stringify(result.error)}`);
    }

    console.log("Email sent successfully:", result.data?.id);

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
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});