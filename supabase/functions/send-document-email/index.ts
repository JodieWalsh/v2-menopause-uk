import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-DOCUMENT-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    const { email, documentContent, userName, isBase64PDF } = await req.json();
    logStep("Request parsed", { email, userName, isBase64PDF, hasContent: !!documentContent });

    const emailData = {
      from: "The Empowered Patient <support@the-empowered-patient.org>",
      to: [email],
      subject: "Your Menopause Consultation Document",
      html: `
        <div style="font-family: 'Open Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #FFFFFF;">
          <div style="text-align: center; margin-bottom: 30px; background: #F5F5F5; padding: 30px; border-radius: 8px; border: 1px solid #A8DADC;">
            <img src="https://oconnpquknkpxmcoqvmo.supabase.co/storage/v1/object/public/logos-tep//revised_logo.png" alt="The Empowered Patient Logo" style="width: 120px; height: auto; margin-bottom: 20px;">
            <h1 style="color: #333333; font-size: 24px; margin-bottom: 10px; font-weight: 700;">The Empowered Patient</h1>
            <p style="color: #A0A0A0; font-size: 16px;">Your Menopause Consultation Document</p>
          </div>
          
          <div style="background: #FFFFFF; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #A8DADC;">
            <h2 style="color: #333333; font-size: 20px; margin-bottom: 15px; font-weight: 600;">Hello ${userName || 'Patient'},</h2>
            <p style="color: #333333; line-height: 1.6; margin-bottom: 15px; font-size: 14px;">
              Thank you for completing your menopause consultation assessment. Your personalized document has been professionally formatted and is included below.
            </p>
            <p style="color: #333333; line-height: 1.6; font-size: 14px;">
              This comprehensive report contains all the information you provided during your consultation, including the Modified Greene Scale with calculated scores, beautifully organized to help facilitate more effective healthcare conversations.
            </p>
          </div>
          
          <div style="background: #E0D8C8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333333; font-size: 16px; margin-bottom: 12px; font-weight: 600;">What to do next:</h3>
            <ul style="color: #333333; line-height: 1.6; margin: 0; padding-left: 20px; font-size: 14px;">
              <li style="margin-bottom: 6px;">Print the document below (it's optimized for printing)</li>
              <li style="margin-bottom: 6px;">Bring it to your next doctor's appointment</li>
              <li style="margin-bottom: 6px;">Share it with your healthcare provider before your consultation</li>
              <li>Save this email and document for your records</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #F5F5F5;">
            <img src="https://oconnpquknkpxmcoqvmo.supabase.co/storage/v1/object/public/logos-tep//revised_logo.png" alt="The Empowered Patient Logo" style="width: 80px; height: auto; margin-bottom: 15px;">
            <p style="color: #A0A0A0; font-size: 12px; margin-bottom: 5px;">
              You have 12 months access to this tool from your purchase date.
            </p>
            <p style="color: #A0A0A0; font-size: 12px;">
              For support, contact us at: support@the-empowered-patient.org
            </p>
          </div>
        </div>
      `,
      text: `
Hello ${userName || 'Patient'},

Thank you for completing your menopause consultation assessment. Your personalized document has been professionally formatted and is attached as a PDF.

This comprehensive report contains all the information you provided during your consultation, including the Modified Greene Scale with calculated scores, beautifully organized to help facilitate more effective healthcare conversations.

What to do next:
- Download and print the attached PDF document
- Bring it to your next doctor's appointment  
- Share it with your healthcare provider before your consultation
- Save this email and document for your records

You have 12 months access to this tool from your purchase date.

For support, contact us at: support@the-empowered-patient.org

Best regards,
The Empowered Patient Team
      `
    };

    // Handle HTML document content
    if (!isBase64PDF && documentContent) {
      // For HTML content, we'll embed it in the email with proper styling
      emailData.html = emailData.html.replace('</div>', `
        </div>
        
        <!-- Document Content -->
        <div style="margin-top: 40px; border-top: 3px solid #A8DADC; padding-top: 40px;">
          ${documentContent}
        </div>
      `);
    } else if (isBase64PDF && documentContent) {
      // Add PDF attachment if provided
      emailData.attachments = [{
        filename: `Menopause_Consultation_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        content: documentContent,
        type: 'application/pdf'
      }];
    }

    logStep("Attempting to send email via Resend", { 
      to: email, 
      from: emailData.from,
      fromDomain: emailData.from.split('@')[1]?.split('>')[0] || 'unknown'
    });
    const emailResponse = await resend.emails.send(emailData);
    
    logStep("Resend API response received", { 
      emailId: emailResponse.data?.id, 
      error: emailResponse.error,
      success: !emailResponse.error 
    });

    // Check if the email send failed
    if (emailResponse.error) {
      logStep("ERROR: Resend API failed to send email", { 
        error: emailResponse.error,
        email: email
      });
      throw new Error(`Failed to send email via Resend: ${JSON.stringify(emailResponse.error)}`);
    }

    if (!emailResponse.data?.id) {
      logStep("ERROR: No email ID returned from Resend", { response: emailResponse });
      throw new Error("Resend API did not return an email ID");
    }

    logStep("Email sent successfully", { emailId: emailResponse.data.id });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    logStep("ERROR in send-document-email", { error: error.message });
    console.error("Error sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});