import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  firstName?: string;
  isPaid: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, isPaid }: WelcomeEmailRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "The Empowered Patient <support@the-empowered-patient.org>",
      to: [email],
      subject: "Welcome to Your Health Assessment Journey!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header with Logo -->
            <div style="text-align: center; margin-bottom: 30px;">
              <img 
                src="https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/logos//website_logo_transparent.png" 
                alt="The Empowered Patient Logo" 
                style="height: 80px; width: auto; margin-bottom: 20px;"
              />
              <h1 style="color: #9ec0b7; margin: 0; font-size: 28px; font-weight: bold;">
                Welcome${firstName ? ` ${firstName}` : ''}!
              </h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 25px;">
              Thank you for ${isPaid ? 'your purchase and' : ''} joining The Empowered Patient community. 
              We're excited to support you on your personalized menopause wellness journey.
            </p>
            
            <div style="background: linear-gradient(135deg, #9ec0b7 0%, #7ba49e 100%); padding: 25px; border-radius: 8px; margin: 25px 0;">
              <h2 style="color: white; margin-top: 0; margin-bottom: 15px; font-size: 22px;">What's Next?</h2>
              <ul style="line-height: 1.8; color: white; margin: 0; padding-left: 20px;">
                <li>Complete your comprehensive menopause assessment</li>
                <li>Receive your personalised "doctor ready" document to bring to your appointment</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/welcome" 
                 style="background: linear-gradient(135deg, #9ec0b7 0%, #7ba49e 100%); color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;
                        box-shadow: 0 4px 6px rgba(158, 192, 183, 0.3);">
                Start Your Assessment Now
              </a>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
                <strong>Need help?</strong> Our support team is here for you. 
                Simply reply to this email or contact us at 
                <a href="mailto:support@the-empowered-patient.org" style="color: #9ec0b7;">support@the-empowered-patient.org</a>
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <div style="text-align: center;">
              <p style="font-size: 14px; color: #64748b; margin: 10px 0;">
                <strong>The Empowered Patient</strong><br>
                Empowering women through personalized menopause care
              </p>
              <p style="font-size: 12px; color: #94a3b8; margin: 5px 0;">
                You're receiving this email because you created an account with us.
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
        Welcome${firstName ? ` ${firstName}` : ''}!
        
        Thank you for ${isPaid ? 'your purchase and' : ''} joining The Empowered Patient community. 
        We're excited to support you on your personalized menopause wellness journey.
        
        What's Next?
        • Complete your comprehensive menopause assessment
        • Receive your personalised "doctor ready" document to bring to your appointment
        
        Start your assessment: ${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/welcome
        
        Need help? Our support team is here for you. Simply reply to this email or contact us at support@the-empowered-patient.org
        
        The Empowered Patient
        Empowering women through personalized menopause care
      `
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);