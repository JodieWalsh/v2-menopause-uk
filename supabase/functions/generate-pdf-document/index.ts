import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-PDF-DOCUMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    const { htmlContent, userName, userEmail } = await req.json();
    logStep("Received PDF generation request", { userName, userEmail, hasHtmlContent: !!htmlContent });
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Convert HTML to PDF using jsPDF
    try {
      // Use an external API service for HTML to PDF conversion
      // We'll use the HTMLPDFapi service
      const apiKey = Deno.env.get("HTMLPDF_API_KEY");
      if (!apiKey) {
        logStep("ERROR: HTMLPDF_API_KEY not configured");
        throw new Error("HTMLPDF_API_KEY not configured");
      }

      logStep("Converting HTML to PDF using HTMLPDFapi");
      
      const pdfResponse = await fetch('https://api.htmlpdfapi.com/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify({
          html: htmlContent,
          css: '',
          format: 'A4',
          orientation: 'portrait',
          margin: {
            top: '20mm',
            bottom: '20mm',
            left: '15mm',
            right: '15mm'
          },
          printBackground: true,
          scale: 0.8
        })
      });

      if (!pdfResponse.ok) {
        logStep("ERROR: PDF API request failed", { status: pdfResponse.status, statusText: pdfResponse.statusText });
        throw new Error(`PDF API error: ${pdfResponse.status} ${pdfResponse.statusText}`);
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

      logStep("PDF generated successfully", { size: pdfBuffer.byteLength });

      // Send the PDF via email
      logStep("Attempting to send PDF email");
      const { data: emailData, error: emailError } = await supabaseClient.functions.invoke('send-document-email', {
        body: {
          email: userEmail,
          documentContent: pdfBase64,
          userName: userName,
          isBase64PDF: true
        }
      });

      if (emailError) {
        logStep("ERROR: PDF email sending failed", { error: emailError });
        throw new Error(`Failed to send email: ${emailError.message || JSON.stringify(emailError)}`);
      }

      logStep("PDF email sent successfully", { emailData });

      return new Response(JSON.stringify({ 
        success: true,
        message: "PDF document generated and sent successfully",
        pdfBase64: pdfBase64
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (pdfError) {
      logStep("PDF generation failed, falling back to HTML email", { error: pdfError.message });
      
      // Fallback to HTML email if PDF generation fails
      logStep("Attempting to send HTML email fallback");
      
      const { data: emailData, error: emailError } = await supabaseClient.functions.invoke('send-document-email', {
        body: {
          email: userEmail,
          documentContent: htmlContent,
          userName: userName,
          isBase64PDF: false
        }
      });

      if (emailError) {
        logStep("ERROR: Fallback HTML email also failed", { error: emailError });
        throw new Error(`Fallback HTML email also failed: ${emailError.message || JSON.stringify(emailError)}`);
      }

      logStep("HTML email fallback sent successfully", { emailData });

      return new Response(JSON.stringify({ 
        success: true,
        message: "HTML document sent successfully (PDF generation unavailable)",
        fallbackToHtml: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    logStep("ERROR in generate-pdf-document", { error: error.message });
    console.error("Document generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});