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
      from: "Health Assessment <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Your Health Assessment Journey!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">Welcome${firstName ? ` ${firstName}` : ''}!</h1>
          
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for ${isPaid ? 'your purchase and' : ''} joining our health assessment platform. 
            We're excited to help you on your wellness journey.
          </p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e40af; margin-top: 0;">What's Next?</h2>
            <ul style="line-height: 1.8;">
              <li>Complete your comprehensive health assessment</li>
              <li>Receive personalized recommendations</li>
              <li>Track your progress over time</li>
              <li>Access expert insights and guidance</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/welcome" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Start Your Assessment
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; text-align: center;">
            If you have any questions, please don't hesitate to reach out to our support team.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Health Assessment Platform<br>
            Your journey to better health starts here.
          </p>
        </div>
      `,
      text: `
        Welcome${firstName ? ` ${firstName}` : ''}!
        
        Thank you for ${isPaid ? 'your purchase and' : ''} joining our health assessment platform. 
        We're excited to help you on your wellness journey.
        
        What's Next?
        - Complete your comprehensive health assessment
        - Receive personalized recommendations  
        - Track your progress over time
        - Access expert insights and guidance
        
        Start your assessment: ${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/welcome
        
        If you have any questions, please don't hesitate to reach out to our support team.
        
        Health Assessment Platform
        Your journey to better health starts here.
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