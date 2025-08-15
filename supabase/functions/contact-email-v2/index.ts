import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("=== NEW CONTACT EMAIL FUNCTION V2 ===")
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, title, content } = await req.json()
    console.log("Processing contact form for:", email)
    
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('No API key found')
    }
    
    console.log("Sending to: the.empowered.patient73@gmail.com")
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Contact Form <onboarding@resend.dev>',
        to: ['the.empowered.patient73@gmail.com'],
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
    console.log("Email result:", result)

    if (!response.ok) {
      throw new Error(`Email failed: ${JSON.stringify(result)}`)
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error("Function error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})