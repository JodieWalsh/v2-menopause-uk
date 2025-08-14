import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[TEST-CONTACT] Function started");
    
    const body = await req.json();
    console.log("[TEST-CONTACT] Body received:", body);
    
    // Check environment variables
    const resendKey = Deno.env.get("RESEND_API_KEY");
    console.log("[TEST-CONTACT] RESEND_API_KEY exists:", !!resendKey);
    console.log("[TEST-CONTACT] RESEND_API_KEY length:", resendKey?.length || 0);
    
    if (!resendKey) {
      throw new Error("RESEND_API_KEY not found");
    }
    
    // Test Resend initialization
    console.log("[TEST-CONTACT] Initializing Resend client");
    const resend = new Resend(resendKey);
    
    // Test simple email send
    console.log("[TEST-CONTACT] Attempting to send test email");
    const emailResponse = await resend.emails.send({
      from: "Delivered <delivered@resend.dev>",
      to: ["support@the-empowered-patient.org"],
      subject: "Test Email from Debug Function",
      html: "<h1>Test Email</h1><p>This is a test email from the debug function.</p>",
      text: "Test Email - This is a test email from the debug function.",
    });
    
    console.log("[TEST-CONTACT] Resend response:", emailResponse);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email test successful",
      hasResendKey: true,
      keyLength: resendKey.length,
      emailResult: {
        id: emailResponse.data?.id,
        error: emailResponse.error,
        success: !emailResponse.error
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: any) {
    console.error("[TEST-CONTACT] ERROR:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      name: error.name
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});