import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Heart, Download, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ConsultationComplete = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        navigate('/login');
        return;
      }
      setUser(user);
    };
    getUser();
  }, [navigate]);

  const handleResendEmail = async () => {
    try {
      const assessment = await fetchLatestAssessment();
      if (!assessment) {
        toast({
          title: "Error",
          description: "No assessment found to resend email.",
          variant: "destructive",
        });
        return;
      }

      const userName = `${user?.user_metadata?.first_name} ${user?.user_metadata?.last_name}`.trim();
      
      // Use the same approach as the normal email sending - call generate-document with responses
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: { 
          responses: assessment.responses,
          email: user?.email
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Email Sent",
        description: "Your consultation document has been resent to your email.",
      });
    } catch (error) {
      console.error('Error resending email:', error);
      toast({
        title: "Error",
        description: "Failed to resend email. Please try again.",
        variant: "destructive",
      });
    }
  };


  const fetchLatestAssessment = async () => {
    if (!user?.id) return null;
    
    // Get user responses from user_responses table
    const { data, error } = await supabase
      .from('user_responses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Transform the array of responses into the format expected by generate-document
    const responseMap = {};
    data?.forEach(response => {
      responseMap[response.question_id] = response.response_value;
    });
    
    return { responses: responseMap };
  };

  const handleDownload = async () => {
    try {
      const assessment = await fetchLatestAssessment();
      if (!assessment) {
        toast({
          title: "Error",
          description: "No assessment found to download.",
          variant: "destructive",
        });
        return;
      }

      const userName = `${user?.user_metadata?.first_name} ${user?.user_metadata?.last_name}`.trim();
      
      // Generate the same styled HTML document as the email
      const { data, error } = await supabase.functions.invoke('generate-document', {
        body: { 
          responses: assessment.responses
        }
      });
      
      if (error) throw error;
      
      // The function returns HTML content in the response
      const htmlContent = data?.documentContent;
      if (!htmlContent) {
        throw new Error("No document content received");
      }
      
      // Create and trigger download as HTML file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${userName || 'Patient'}_Menopause_Consultation_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Professional document downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center">
            <img 
              src="https://oconnpquknkpxmcoqvmo.supabase.co/storage/v1/object/public/logos-tep//website_logo_transparent.png" 
              alt="The Empowered Patient Logo" 
              className="h-28 w-auto sm:h-32"
            />
          </div>
        </div>

        <Card className="card-gradient">
          <CardHeader className="text-center p-4 sm:p-6">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
              Consultation Complete!
            </CardTitle>
            <p className="text-sm sm:text-base text-muted-foreground">
              Thank you for completing your menopause consultation. Your personalized document has been generated.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="bg-primary/10 p-3 sm:p-4 rounded-lg">
              <h3 className="text-sm sm:text-base font-medium text-foreground mb-2">What happens next?</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Your personalized consultation document has been generated</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>A copy has been sent to your email address: {user?.email}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>You can download the document directly from this page</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Share this document with your healthcare provider for your consultation</span>
                </li>
              </ul>
            </div>

            <div className="stack-mobile">
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full touch-target flex flex-col items-center justify-center space-y-1 py-8 h-20"
                onClick={handleDownload}
              >
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span className="font-semibold">Download Your Document</span>
                </div>
                <span className="text-xs opacity-80 font-normal">
                  This will take about 10 seconds
                </span>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full touch-target flex items-center justify-center space-x-2 py-8 h-20"
                onClick={handleResendEmail}
              >
                <Mail className="h-4 w-4" />
                <span>Resend Email</span>
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Remember to check your spam folder if you don't see the email.
              </p>
              
              <div className="space-y-2">
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="touch-target"
                >
                  <Link to="/welcome">
                    Return to Welcome
                  </Link>
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  You have access to this tool for 12 months from your purchase date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConsultationComplete;