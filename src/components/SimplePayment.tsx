import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SimplePaymentProps {
  amount: number;
  email: string;
  discountCode?: string;
  onSuccess?: (url: string) => void;
}

export const SimplePayment = ({ amount, email, discountCode = "", onSuccess }: SimplePaymentProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testBasicFetch = async () => {
    addTestResult("Starting basic fetch test...");
    
    try {
      const response = await fetch('https://httpbin.org/json', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        addTestResult("✅ Basic fetch works!");
        return true;
      } else {
        addTestResult(`❌ Basic fetch failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      addTestResult(`❌ Basic fetch error: ${error}`);
      return false;
    }
  };

  const testDirectStripeCall = async () => {
    addTestResult("Testing payment with supabase.functions.invoke...");
    
    try {
      // Use supabase.functions.invoke with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Payment call timed out after 8 seconds')), 8000)
      );
      
      const paymentPromise = supabase.functions.invoke('create-payment', {
        body: {
          amount: amount,
          email: email,
          discountCode: discountCode,
        },
      });

      const result: any = await Promise.race([paymentPromise, timeoutPromise]);
      addTestResult(`Response received: ${JSON.stringify(result)}`);
      
      if (result.error) {
        addTestResult(`❌ Payment call failed: ${result.error.message}`);
        return false;
      }
      
      if (result.data?.url) {
        addTestResult("✅ Got payment URL!");
        if (onSuccess) {
          onSuccess(result.data.url);
        } else {
          window.open(result.data.url, '_blank');
        }
        return true;
      } else {
        addTestResult(`❌ No URL in response: ${JSON.stringify(result.data)}`);
        return false;
      }
    } catch (error: any) {
      addTestResult(`❌ Payment call error: ${error.message}`);
      return false;
    }
  };

  const handlePayment = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Basic fetch
      const fetchWorks = await testBasicFetch();
      if (!fetchWorks) {
        toast({
          title: "Network Error",
          description: "Basic network connectivity failed",
          variant: "destructive",
        });
        return;
      }

      // Test 2: Direct payment call
      await testDirectStripeCall();

    } catch (error) {
      addTestResult(`❌ Unexpected error: ${error}`);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Simple Payment Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Amount: £{amount}</Label>
          <Label>Email: {email}</Label>
          {discountCode && <Label>Discount: {discountCode}</Label>}
        </div>
        
        <Button 
          onClick={handlePayment} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Testing..." : "Test Payment"}
        </Button>
        
        {testResults.length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h4 className="font-medium mb-2">Test Results:</h4>
            <div className="space-y-1 text-sm">
              {testResults.map((result, index) => (
                <div key={index} className="font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};