import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    discountCode: ''
  });
  const navigate = useNavigate();
  const { toast } = useToast();


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          toast({
            title: "Login Failed",
            description: "Please check your email and password and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Failed",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });

      navigate('/welcome');
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log("Starting registration process...");
      
      // Use new registration function that handles discount codes
      const { data, error } = await supabase.functions.invoke('register-with-discount', {
        body: {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          discountCode: formData.discountCode
        }
      });

      console.log("Registration response:", { data, error });
      console.log("Response fields:", {
        success: data?.success,
        userExists: data?.userExists,
        freeAccess: data?.freeAccess,
        stripeRedirect: data?.stripeRedirect,
        redirectTo: data?.redirectTo,
        message: data?.message
      });

      if (error) {
        console.error("Registration function error:", error);
        toast({
          title: "Registration Failed",
          description: error.message || "An error occurred during registration.",
          variant: "destructive",
        });
        return;
      }

      if (data.success === false || data.error) {
        // Handle specific error types
        if (data.error && data.error.includes("already exists")) {
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
          // Switch to sign-in tab
          const signInTab = document.querySelector('[value="signin"]') as HTMLElement;
          if (signInTab) signInTab.click();
          return;
        }
        
        toast({
          title: data.error.includes("discount code") ? "Invalid Discount Code" : "Registration Failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }


      if (data.userExists) {
        // User already exists - show message and redirect to sign in
        toast({
          title: data.freeAccess ? "Account Updated!" : "Account Already Exists",
          description: data.freeAccess ? data.message : "An account with this email already exists. Please use the Sign In tab below to access your account.",
          variant: data.freeAccess ? "default" : "destructive",
        });
        
        // If not free access, automatically switch to sign-in tab for user convenience
        if (!data.freeAccess) {
          setTimeout(() => {
            const signInTab = document.querySelector('[value="signin"]') as HTMLElement;
            if (signInTab) signInTab.click();
          }, 2000); // 2 second delay to let user read the message
        }
        return;
      }

      if (data.freeAccess) {
        toast({
          title: "Account Created Successfully!",
          description: "Welcome! You have free access to the consultation tool.",
        });
        // Sign in the user automatically for free access
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (signInError) {
          console.error("Auto sign-in error after free registration:", signInError);
          toast({
            title: "Sign In Error",
            description: "Account created but couldn't sign you in automatically. Please sign in manually.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        
        console.log("Free access user signed in successfully, navigating to welcome");
        navigate('/welcome');
      } else {
        toast({
          title: "Account Created Successfully!",
          description: data.discountApplied ? 
            `Discount applied! Your total is £${data.finalAmount}.` : 
            "Please complete your payment to get started.",
        });
        // Sign in the user and navigate to payment
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (signInError) {
          console.error("Auto sign-in error after paid registration:", signInError);
          toast({
            title: "Sign In Error", 
            description: "Account created but couldn't sign you in automatically. Please sign in manually.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        
        console.log("Paid user signed in successfully, navigating to payment");

        // Check if registration returned a direct Stripe URL
        if (data.stripeRedirect && data.redirectTo) {
          console.log("Redirecting directly to Stripe:", data.redirectTo);
          
          // Store user credentials temporarily for session restoration after payment
          // This is needed because opening Stripe in new window breaks session in Lovable
          localStorage.setItem('payment_user_email', formData.email);
          localStorage.setItem('payment_user_password', formData.password);
          console.log("Stored credentials for session restoration after payment");
          
          // Handle Stripe redirect - detect if we're in a sandboxed iframe
          try {
            // First try to detect if we're in a sandboxed iframe
            const isInIframe = window.top !== window;
            let isSandboxed = false;
            
            try {
              // Test if we can access window.top.location
              window.top.location.href;
            } catch (sandboxError) {
              isSandboxed = true;
              console.log("Detected sandboxed iframe, will open Stripe in new window");
            }
            
            if (isInIframe && isSandboxed) {
              // We're in a sandboxed iframe (like Lovable), open in new window
              const stripeWindow = window.open(data.redirectTo, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
              if (stripeWindow) {
                console.log("Opened Stripe in new window");
                // Focus the new window
                stripeWindow.focus();
                
                // Show instruction to user
                toast({
                  title: "Payment Window Opened",
                  description: "Complete your payment in the new window. You'll be automatically logged in afterward.",
                  variant: "default",
                });

                // Listen for messages from the payment window
                const handlePaymentMessage = (event) => {
                  if (event.origin !== window.location.origin) return;
                  
                  if (event.data.type === 'PAYMENT_SUCCESS') {
                    console.log("Received payment success message from popup");
                    
                    // Close the popup
                    if (stripeWindow && !stripeWindow.closed) {
                      stripeWindow.close();
                    }
                    
                    // Restore session and navigate to welcome
                    const restoreSessionAndNavigate = async () => {
                      try {
                        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                          email: formData.email,
                          password: formData.password,
                        });
                        
                        if (signInData.user && !signInError) {
                          console.log("Session restored in main window:", signInData.user.email);
                          
                          // Clear stored credentials
                          localStorage.removeItem('payment_user_email');
                          localStorage.removeItem('payment_user_password');
                          
                          toast({
                            title: "Payment Successful! 🎉",
                            description: "Welcome back! Redirecting to your assessment...",
                            variant: "default",
                          });
                          
                          // Navigate to welcome page
                          setTimeout(() => {
                            navigate('/welcome');
                          }, 1500);
                        } else {
                          console.error("Failed to restore session:", signInError);
                          toast({
                            title: "Session Error",
                            description: "Payment successful, but please sign in to continue.",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error("Error restoring session:", error);
                      }
                    };
                    
                    restoreSessionAndNavigate();
                    
                    // Clean up event listener
                    window.removeEventListener('message', handlePaymentMessage);
                  }
                };
                
                // Add event listener for messages from popup
                window.addEventListener('message', handlePaymentMessage);
                
                // Clean up if popup is closed manually
                const checkClosed = setInterval(() => {
                  if (stripeWindow.closed) {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', handlePaymentMessage);
                    console.log("Payment popup was closed");
                  }
                }, 1000);
                
              } else {
                console.error("Failed to open Stripe window - popup blocked?");
                toast({
                  title: "Popup Blocked",
                  description: "Please allow popups and try again, or copy this link: " + data.redirectTo,
                  variant: "destructive",
                });
              }
            } else if (isInIframe) {
              // We're in an iframe but not sandboxed, try top navigation
              window.top.location.href = data.redirectTo;
            } else {
              // We're at top level, normal redirect
              window.location.href = data.redirectTo;
            }
          } catch (e) {
            console.warn("Error during Stripe redirect, falling back to new window:", e);
            // Fallback: open in new window
            window.open(data.redirectTo, '_blank');
          }
          return;
        }
        
        // If no direct Stripe URL, log for debugging
        console.log("No direct Stripe redirect, using fallback", {
          stripeRedirect: data.stripeRedirect,
          redirectTo: data.redirectTo,
          freeAccess: data.freeAccess
        });

        // Fallback to payment page if direct redirect failed
        const params = new URLSearchParams();
        if (data.discountApplied) {
          params.set('discount_applied', 'true');
          params.set('discount_amount', data.discountAmount.toString());
          params.set('final_amount', data.finalAmount.toString());
          params.set('original_amount', data.originalAmount.toString());
        }
        navigate(`/payment?${params.toString()}`);

      }

      // Clear form only for successful free access (don't clear for paid redirects)
      if (data.freeAccess) {
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          discountCode: ''
        });
      }

    } catch (error) {
      console.error("Unexpected error during registration:", error);
      toast({
        title: "Sign Up Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background section-padding">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-4 sm:mb-6">
            <img 
              src="https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/logos/website_logo_transparent.png" 
              alt="The Empowered Patient Logo" 
              className="h-12 w-auto sm:h-16 sm:w-auto"
            />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Access your personalized menopause consultation tool
          </p>
        </div>

        {/* Auth Tabs */}
        <Card className="card-gradient">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-center font-serif text-lg sm:text-xl">Account Access</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Sign in to your existing account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11">
                <TabsTrigger value="signin" className="text-sm sm:text-base">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm sm:text-base">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                <form onSubmit={handleSignIn} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm sm:text-base">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm sm:text-base">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-foreground touch-target"
                      >
                        {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full touch-target"
                    disabled={isLoading || !formData.email || !formData.password}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Signing in...
                      </>
                    ) : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                <form onSubmit={handleSignUp} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm sm:text-base">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          placeholder="First name"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm sm:text-base">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          placeholder="Last name"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm sm:text-base">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm sm:text-base">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-foreground touch-target"
                      >
                        {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-9 sm:pl-10 h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discountCode" className="text-sm sm:text-base">Discount Code (Optional)</Label>
                    <div className="relative">
                      <Input
                        id="discountCode"
                        name="discountCode"
                        type="text"
                        placeholder="Enter discount code (optional)"
                        value={formData.discountCode}
                        onChange={handleInputChange}
                        className="h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full touch-target"
                    disabled={isLoading || !formData.email || !formData.password || !formData.firstName || !formData.lastName}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Creating account...
                      </>
                    ) : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-xs sm:text-sm text-muted-foreground">
            By signing up, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;