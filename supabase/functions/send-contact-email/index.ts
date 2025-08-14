import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  email: string;
  title: string;
  content: string;
}

serve(async (req) => {
  console.log("=== Contact Email Function Called ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    console.error("Invalid method:", req.method);
    return new Response(
      JSON.stringify({ error: "Method not allowed", success: false }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }

  try {
    console.log("Processing POST request...");
    
    // Parse request body
    let requestBody: ContactFormData;
    try {
      const rawBody = await req.text();
      console.log("Raw request body length:", rawBody.length);
      requestBody = JSON.parse(rawBody);
      console.log("Parsed request body:", { 
        email: requestBody.email?.substring(0, 10) + "...", 
        title: requestBody.title,
        contentLength: requestBody.content?.length 
      });
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body", success: false }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    const { email, title, content } = requestBody;
    
    // Validate required fields
    const missingFields = [];
    if (!email || email.trim() === "") missingFields.push("email");
    if (!title || title.trim() === "") missingFields.push("title");
    if (!content || content.trim() === "") missingFields.push("content");
    
    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return new Response(
        JSON.stringify({ 
          error: `Missing required fields: ${missingFields.join(", ")}`, 
          success: false 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format", success: false }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not found in environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Email service not configured. Please contact the administrator.", 
          success: false 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }
    
    console.log("Resend API key found, initializing client...");
    const resend = new Resend(resendApiKey);

    // Prepare email content
    const emailSubject = `Contact Form: ${title}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Contact Form Submission</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .content { background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0; color: #2c5aa0;">New Contact Form Submission</h2>
              <p style="margin: 5px 0 0 0; color: #666;">Received from The Empowered Patient website</p>
            </div>
            
            <div class="field">
              <div class="label">From Email:</div>
              <div>${email}</div>
            </div>
            
            <div class="field">
              <div class="label">Subject:</div>
              <div>${title}</div>
            </div>
            
            <div class="field">
              <div class="label">Message:</div>
              <div class="content">${content.replace(/\n/g, '<br>')}</div>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #888;">
              This email was sent from the contact form on The Empowered Patient website.
              To reply, use the email address provided above.
            </p>
          </div>
        </body>
      </html>
    `;
    
    const emailText = `New Contact Form Submission

From: ${email}
Subject: ${title}

Message:
${content}

---
This email was sent from the contact form on The Empowered Patient website.`;

    console.log("Attempting to send email via Resend...");
    console.log("Email subject:", emailSubject);
    console.log("From:", "The Empowered Patient <support@the-empowered-patient.org>");
    console.log("To:", "support@the-empowered-patient.org");
    console.log("Reply-To:", email);
    
    // Send email
    const result = await resend.emails.send({
      from: "The Empowered Patient <support@the-empowered-patient.org>",
      to: ["support@the-empowered-patient.org"],
      replyTo: email, // Allow replying directly to the user
      subject: emailSubject,
      html: emailHtml,
      text: emailText
    });

    console.log("Resend API response:", result);

    // Check for errors
    if (result.error) {
      console.error("Resend API error details:", result.error);
      
      // Provide specific error messages for common issues
      let errorMessage = "Failed to send email";
      if (result.error.message) {
        if (result.error.message.includes("domain")) {
          errorMessage = "Email domain not verified. Please contact the administrator.";
        } else if (result.error.message.includes("testing")) {
          errorMessage = "Email service is in testing mode. Please contact the administrator.";
        } else {
          errorMessage = result.error.message;
        }
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, success: false }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    console.log("Email sent successfully! Message ID:", result.data?.id);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.data?.id,
        message: "Your message has been sent successfully!"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error("=== Contact Form Error ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error details:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error occurred. Please try again later.",
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});