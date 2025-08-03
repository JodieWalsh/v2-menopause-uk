import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

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
    addTestResult("Testing direct payment call...");
    
    try {
      const response = await fetch('https://ppnunnmjvpiwrrrbluno.supabase.co/functions/v1/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwbnVubm1qdnBpd3JycmJsdW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTc2MjgsImV4cCI6MjA2OTY5MzYyOH0.FjMYIRk6t2PO-E4GChTzyQG9vXU-N1hK-53AGmSesCE'
        },
        body: JSON.stringify({
          amount: amount,
          email: email,
          discountCode: discountCode,
        }),
      });

      addTestResult(`Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        addTestResult("✅ Payment call successful!");
        
        if (data.url) {
          addTestResult("✅ Got Stripe URL!");
          if (onSuccess) {
            onSuccess(data.url);
          } else {
            window.location.href = data.url;
          }
          return true;
        } else {
          addTestResult(`❌ No URL in response: ${JSON.stringify(data)}`);
          return false;
        }
      } else {
        const errorText = await response.text();
        addTestResult(`❌ Payment call failed: ${response.status} - ${errorText}`);
        return false;
      }
    } catch (error) {
      addTestResult(`❌ Payment call error: ${error}`);
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