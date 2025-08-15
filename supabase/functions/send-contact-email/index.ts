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
    
    console.log("Sending email via Resend API...")
    
    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Contact Form <onboarding@resend.dev>',
        to: ['support@the-empowered-patient.org', 'the.empowered.patient73@gmail.com'],
        reply_to: email,
        subject: `Contact Form: ${title}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${title}</p>
          <p><strong>Message:</strong></p>
          <p>${content.replace(/\n/g, '<br>')}</p>
        `,
      }),
    })

    const result = await response.json()
    console.log("Resend response:", { status: response.status, result })
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      console.error("Resend API error:", result)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: result }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!result.id) {
      console.error("No message ID returned from Resend:", result)
      return new Response(
        JSON.stringify({ error: 'Email sending failed - no message ID', details: result }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log("Email sent successfully!")
    return new Response(
      JSON.stringify({ success: true, messageId: result.id, message: 'Email sent successfully!' }),
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