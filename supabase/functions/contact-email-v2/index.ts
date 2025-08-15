import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

serve(async (req) => {
  console.log("TEST FUNCTION STARTED")
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      } 
    })
  }

  try {
    console.log("Processing request")
    const body = await req.json()
    console.log("Got body:", body)
    
    return new Response(
      JSON.stringify({ success: true, message: 'Test successful', body }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        } 
      }
    )
    
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        } 
      }
    )
  }
})