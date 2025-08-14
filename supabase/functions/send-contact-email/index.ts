import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("=== FUNCTION STARTED ===")
  
  if (req.method === 'OPTIONS') {
    console.log("CORS preflight")
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Processing request...")
    const { email, title, content } = await req.json()
    console.log("Got data:", { email, title })
    
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    console.log("API Key:", RESEND_API_KEY ? 'Found' : 'NOT FOUND')
    
    if (!RESEND_API_KEY) {
      console.log("No API key - returning error")
      return new Response(
        JSON.stringify({ error: 'No API key found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log("All checks passed - returning success")
    return new Response(
      JSON.stringify({ success: true, message: 'Test successful' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})