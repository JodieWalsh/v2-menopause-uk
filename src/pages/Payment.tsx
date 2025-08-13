import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CreditCard, Shield, CheckCircle, ArrowLeft, Percent } from "lucide-react";
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
  const [discountInfo, setDiscountInfo] = useState<{
    applied: boolean;
    code: string;
  }>({
    applied: false,
    code: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const basePrice = 19;

  // Load user email and check for discount from URL parameters
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setPaymentData(prev => ({
          ...prev,
          email: user.email || ""
        }));
      }

      // Check URL parameters for discount info
      const discountAppliedParam = searchParams.get('discount_applied');
      const discountCodeParam = searchParams.get('discount_code');

      if (discountAppliedParam === 'true' && discountCodeParam) {
        setDiscountInfo({
          applied: true,
          code: discountCodeParam
        });
        
        console.log(`Discount code loaded from URL: ${discountCodeParam}`);
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
    if (!paymentData.discountCode.trim()) {
      toast({
        title: "Discount Code Required",
        description: "Please enter a discount code to apply.",
        variant: "destructive",
      });
      return;
    }

    // Simple validation - let Stripe handle the actual discount calculation
    setDiscountInfo({
      applied: true,
      code: paymentData.discountCode.trim()
    });
    
    toast({
      title: "Discount Code Applied!",
      description: "Your discount will be calculated during checkout.",
    });
  };

  const handlePaymentSuccess = () => {
    console.log("Payment successful - redirecting handled by payment form");
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
              src="https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/logos/website_logo_transparent.png" 
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
                    <span className="text-muted-foreground">The Empowered Patient - Menopause Patient Empowerment UK</span>
                    <span className="font-medium">£{basePrice.toFixed(2)} GBP</span>
                  </div>
                  
                  {discountInfo.applied && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Discount Code Applied</span>
                      <span>Will be calculated at checkout</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total</span>
                      <span>{discountInfo.applied ? "Calculated at checkout" : `£${basePrice.toFixed(2)} GBP`}</span>
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
                
                {/* Discount Code Section - Only show if no discount already applied */}
                {!discountInfo.applied && (
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
                      </div>
                    )}
                  </div>
                )}

                {/* Show applied discount info */}
                {discountInfo.applied && (
                  <div className="pt-4 border-t">
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                      ✅ Discount code applied! Final amount will be calculated at checkout.
                      <div className="text-xs text-green-500 mt-1">Code: {discountInfo.code}</div>
                    </div>
                  </div>
                )}

                {/* Payment Form */}
                {paymentData.email && (
                  <div className="pt-4 border-t">
                    <StripePaymentForm 
                      amount={basePrice * 100} // Always use base price - Stripe handles discounts
                      discountCode={discountInfo.applied ? discountInfo.code : ""}
                      onSuccess={handlePaymentSuccess}
                    />
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