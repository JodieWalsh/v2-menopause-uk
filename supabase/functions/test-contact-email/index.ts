import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Test function working",
      hasResendKey: !!resendKey,
      keyLength: resendKey?.length || 0
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
    
  } catch (error: any) {
    console.error("[TEST-CONTACT] ERROR:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});