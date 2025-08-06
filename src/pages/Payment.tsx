import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, CreditCard, Shield, CheckCircle, ArrowLeft, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StripePaymentForm } from "@/components/StripePaymentForm";


const Payment = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState({
    email: "",
    discountCode: "",
  });

  const [showDiscountCode, setShowDiscountCode] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // Removed showPaymentForm state since we're integrating the form directly
  const basePrice = 19;
  const finalPrice = Math.round((discountApplied ? basePrice - discountAmount : basePrice) * 100) / 100;

  // Auto-fill email from authenticated user and check for discount from URL or database
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setPaymentData(prev => ({
          ...prev,
          email: user.email || ""
        }));

        // First check URL parameters for discount info from registration
        const discountAppliedParam = searchParams.get('discount_applied');
        const discountAmountParam = searchParams.get('discount_amount');
        
        if (discountAppliedParam === 'true' && discountAmountParam) {
          setDiscountApplied(true);
          setDiscountAmount(parseFloat(discountAmountParam));
          console.log(`Discount from URL: £${discountAmountParam}`);
          return; // Use URL params, don't check database
        }

        // Fallback: Check if user has a subscription with discount info
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (subscription && subscription.amount_paid !== null && subscription.amount_paid < 19) {
          // User has a discounted amount from registration
          const discountFromRegistration = 19 - (subscription.amount_paid || 0);
          setDiscountApplied(true);
          setDiscountAmount(discountFromRegistration);
          console.log(`Discount from DB: £${discountFromRegistration}`);
        }
      }
    };
    getUser();
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentData({
      ...paymentData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDiscountCode = async () => {
    console.log("=== DISCOUNT VALIDATION STARTED ===");
    console.log("Discount code entered:", paymentData.discountCode);
    
    if (!paymentData.discountCode.trim()) {
      console.log("Empty discount code");
      toast({
        title: "Discount Code Required",
        description: "Please enter a discount code to apply.",
        variant: "destructive",
      });
      return;
    }

    console.log("Setting loading to true");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-discount', {
        body: {
          discountCode: paymentData.discountCode.trim(),
          amount: basePrice,
        },
      });

      if (error) throw error;

      console.log("Discount validation response:", data);
      
      if (data.valid) {
        setDiscountApplied(true);
        setDiscountAmount(data.discountAmount);
        toast({
          title: "Discount Applied!",
          description: `You saved £${data.discountAmount} GBP`,
        });
        console.log("Discount applied successfully");
      } else {
        setDiscountApplied(false);
        setDiscountAmount(0);
        // Clear the discount code field when invalid
        setPaymentData(prev => ({ ...prev, discountCode: "" }));
        toast({
          title: "❌ Invalid Discount Code", 
          description: data.error || "This discount code is not valid. Please check and try again.",
          variant: "destructive",
          duration: 5000, // Show for 5 seconds
        });
        console.log("Invalid discount code:", data.error);
      }
    } catch (error) {
      console.error("Discount validation error:", error);
      toast({
        title: "Error",
        description: "There was an error validating your discount code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Remove the intermediate screen logic since we're integrating payment form directly

  const handleFreeAccess = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: 0, // Free access - amount is already in pence
          email: paymentData.email,
          discountCode: paymentData.discountCode || "",
        },
      });

      if (error) throw error;

      if (data?.free_access) {
        toast({
          title: "Free Access Granted!",
          description: "You have been granted free access. Redirecting to your assessment...",
        });
        setTimeout(() => {
          navigate('/welcome');
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to grant free access",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Payment success is handled in StripePaymentForm
    console.log("Payment successful - redirecting to welcome page");
  };

  return (
    <div className="min-h-screen bg-background section-padding">
      <div className="container-wellness max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/register" className="inline-flex items-center space-x-2 mb-6 text-muted-foreground hover:text-foreground transition-smooth">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Registration</span>
          </Link>
          <div className="flex items-center justify-center mb-6">
            <img 
              src="https://oconnpquknkpxmcoqvmo.supabase.co/storage/v1/object/public/logos-tep//revised_logo.png" 
              alt="The Empowered Patient Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-muted-foreground">
            Secure payment processing - Get instant access to your assessment tool
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="font-serif">Order Summary</CardTitle>
                <CardDescription>
                  Your purchase includes 12 months of access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Menopause Assessment Tool</span>
                    <span className="font-medium">£{basePrice.toFixed(2)} GBP</span>
                  </div>
                  
                  {discountApplied && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Discount Applied</span>
                      <span>-£{discountAmount.toFixed(2)} GBP</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total</span>
                      <span>£{finalPrice.toFixed(2)} GBP</span>
                    </div>
                  </div>
                </div>

                {/* What's Included */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-medium text-foreground">What's Included:</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Guided assessment tool (45 minutes)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Personalized doctor-ready report</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">12 months access with progress saving</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">Email delivery of your document</span>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Secure 256-bit SSL encryption
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-2">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Complete your purchase securely
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Address */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={paymentData.email}
                    onChange={handleInputChange}
                    required
                    className="transition-smooth focus:ring-primary"
                  />
                </div>
                
                {/* Discount Code Section */}
                <div className="pt-4 border-t">
                  {!showDiscountCode ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDiscountCode(true)}
                      className="w-full"
                    >
                      <Percent className="mr-2 h-4 w-4" />
                      Have a discount code?
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="discountCode">Discount Code</Label>
                        <div className="flex gap-2">
                          <Input
                            id="discountCode"
                            name="discountCode"
                            type="text"
                            placeholder="Enter discount code"
                            value={paymentData.discountCode}
                            onChange={handleInputChange}
                            className="transition-smooth focus:ring-primary"
                          />
                          <Button
                            type="button"
                            onClick={handleDiscountCode}
                            disabled={isLoading || !paymentData.discountCode.trim()}
                            variant="outline"
                          >
                            {isLoading ? "Checking..." : "Apply"}
                          </Button>
                        </div>
                      </div>
                      
                      {discountApplied && (
                        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                          ✅ Discount applied! You saved £{discountAmount.toFixed(2)} GBP
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Form - Integrated */}
                {paymentData.email && (
                  <div className="pt-4 border-t">
                    {finalPrice === 0 ? (
                      <Button 
                        onClick={handleFreeAccess}
                        className="w-full" 
                        size="lg" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Processing..." : "Start Free Assessment"}
                      </Button>
                    ) : (
                      <StripePaymentForm 
                        amount={Math.round(finalPrice * 100)} // Send amount in pence
                        discountCode={paymentData.discountCode}
                        onSuccess={handlePaymentSuccess}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;