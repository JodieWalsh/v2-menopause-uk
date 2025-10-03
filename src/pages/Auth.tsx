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

  // Check if we're in a popup window (redirected here from /welcome after payment)
  useEffect(() => {
    if (window.opener && window.opener !== window) {
      console.log("Auth page: Detected popup window, this is likely a post-payment redirect");
      
      // Send message to parent window that payment was successful
      try {
        window.opener.postMessage({
          type: 'PAYMENT_SUCCESS',
          timestamp: Date.now()
        }, window.location.origin);
        
        console.log("Auth page: Sent PAYMENT_SUCCESS message to parent window");
        
        // Show brief message and close popup
        toast({
          title: "Payment Successful!",
          description: "Closing window and logging you in...",
          variant: "default",
        });
        
        setTimeout(() => {
          console.log("Auth page: Closing popup window");
          window.close();
        }, 2000);
        
      } catch (error) {
        console.error("Error communicating with parent window:", error);
        setTimeout(() => {
          window.close();
        }, 3000);
      }
      
      return; // Don't render the normal auth form in popup
    }
  }, [toast]);


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
      console.log("Creating checkout session...");
      
      const { data, error } = await supabase.functions.invoke('create-checkout-public', {
        body: {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          discountCode: formData.discountCode || undefined
        }
      });

      console.log("Checkout session response:", { data, error });

      if (error) {
        console.error("Checkout error:", error);
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to create checkout session",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!data.success || !data.url) {
        toast({
          title: "Registration Failed",
          description: data.error || "Failed to create checkout session",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Store email and password for auto-login after payment
      sessionStorage.setItem('pendingAuth', JSON.stringify({
        email: formData.email,
        password: formData.password,
        timestamp: Date.now()
      }));

      console.log("Redirecting to Stripe checkout...");
      
      // Redirect to Stripe in the same tab
      window.location.href = data.url;

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