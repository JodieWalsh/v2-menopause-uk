import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { Heart, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    discountCode: "",
    agreeToTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide your first and last name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please provide a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please check and try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Creating Stripe checkout session...");
      console.log("Discount code entered:", formData.discountCode);
      
      const result = await supabase.functions.invoke('create-checkout-v2', {
        body: {
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          password: formData.password,
          discountCode: formData.discountCode.trim() || undefined
        }
      });
      
      console.log("create-checkout-public result:", result);
      const data = result.data;
      const error = result.error;

      if (error) {
        console.error("Edge function error:", error);
        console.error("Full error object:", JSON.stringify(error, null, 2));
        const errorMessage = error.message || "Failed to create checkout session";
        
        // Provide user-friendly error messages
        let friendlyMessage = errorMessage;
        if (errorMessage.includes("email")) {
          friendlyMessage = "There's an issue with the email address. Please check and try again.";
        } else if (errorMessage.includes("discount")) {
          friendlyMessage = "The discount code is invalid or has expired.";
        }
        
        toast({
          title: "Unable to Process",
          description: friendlyMessage,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!data || !data.success) {
        console.error("Checkout creation failed:", data);
        console.error("Full response data:", JSON.stringify(data, null, 2));
        const errorMsg = data?.error || "Failed to create checkout session";
        
        toast({
          title: "Unable to Process",
          description: errorMsg.includes("already") 
            ? "An account with this email already exists. Please sign in instead." 
            : "Unable to process your request. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if this is free access or paid access
      if (data.freeAccess) {
        console.log("Free access granted, redirecting to welcome");
      } else if (data.url) {
        console.log("Checkout session created, redirecting to Stripe:", data.url);
        
        toast({
          title: "Redirecting to Payment",
          description: "Taking you to our secure payment page...",
        });

        // Store user data temporarily for post-payment authentication
        localStorage.setItem('temp_user_email', formData.email.trim());
        localStorage.setItem('temp_user_password', formData.password);
        
        // Extended delay to read console logs
        console.log("🚀 REDIRECTING TO STRIPE IN 10 SECONDS...");
        console.log("🚀 Check logs above before redirect!");
        setTimeout(() => {
          console.log("🚀 REDIRECTING NOW to:", data.url);
          window.location.href = data.url;
        }, 10000);
        return;
      }

      // Handle free access case 
      if (data.freeAccess) {
        // Handle free access case - user is created but we need to sign them in
        toast({
          title: "Account Created Successfully!",
          description: "Welcome! You have free access.",
        });
        
        // Sign in the user automatically for free access
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email.trim(),
            password: formData.password,
          });
          
          if (signInError) {
            console.error("Free access sign-in error:", signInError);
            toast({
              title: "Please Sign In",
              description: "Your account was created successfully. Please sign in to continue.",
              variant: "default",
            });
            navigate('/auth');
          } else {
            // Clean up any stored credentials since we don't need them for free access
            localStorage.removeItem('temp_user_email');
            localStorage.removeItem('temp_user_password');
            navigate('/welcome');
          }
        } catch (authError) {
          console.error("Free access authentication error:", authError);
          navigate('/auth');
        }
      } else {
        // Fallback to payment page
        navigate('/payment');
      }

    } catch (err) {
      console.error("Unexpected error during signup:", err);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      agreeToTerms: checked,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center section-padding">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <img 
              src="https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/logos/website_logo_transparent.png" 
              alt="The Empowered Patient Logo" 
              className="h-16 w-auto"
            />
          </Link>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
            Join The Empowered Patient
          </h1>
          <p className="text-muted-foreground">
            Start your journey to better healthcare communication
          </p>
        </div>

        {/* Benefits Banner */}
        <Card className="card-gradient mb-6">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">Guided assessment tool will take around 45 minutes to complete</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">Doctor-focused consultation document</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">12 months access with progress saving</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-center font-serif">Create Your Account</CardTitle>
            <CardDescription className="text-center">
              Join thousands of women taking control of their healthcare
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Info Banner */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
              <p className="text-xs sm:text-sm text-foreground">
                <strong>Secure Process:</strong> Enter your details below and you'll be redirected to our secure payment page. 
                Your account will be created only after successful payment—no commitment until you pay!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                    required
                    className="transition-smooth focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    required
                    className="transition-smooth focus:ring-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                  className="transition-smooth focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    required
                    className="pr-10 transition-smooth focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                    className="pr-10 transition-smooth focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountCode">Discount Code (Optional)</Label>
                <Input
                  id="discountCode"
                  name="discountCode"
                  type="text"
                  value={formData.discountCode}
                  onChange={handleInputChange}
                  placeholder="Enter discount code (optional)"
                  className="transition-smooth focus:ring-primary"
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={handleCheckboxChange}
                  className="mt-1"
                />
                <Label htmlFor="agreeToTerms" className="text-sm leading-5">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:text-primary-dark">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:text-primary-dark">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button 
                type="submit" 
                variant="default" 
                size="lg" 
                className="w-full"
                disabled={isLoading || !formData.agreeToTerms}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Continue to Secure Payment"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link 
              to="/login" 
              className="text-primary hover:text-primary-dark font-medium transition-smooth"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;