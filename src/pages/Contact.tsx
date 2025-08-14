import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, CheckCircle } from "lucide-react";

const contactFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  title: z.string().min(5, "Title must be at least 5 characters long").max(100, "Title must be less than 100 characters"),
  content: z.string().min(20, "Message must be at least 20 characters long").max(2000, "Message must be less than 2000 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      email: "",
      title: "",
      content: "",
    },
  });


  const onSubmit = async (data: ContactFormData) => {
    console.log('Form submission started');
    setIsSubmitting(true);
    
    try {
      console.log('Calling send-contact-email function...');
      const { data: result, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          email: data.email.trim(),
          title: data.title.trim(),
          content: data.content.trim(),
        },
      });

      console.log('Function response:', { result, error });

      if (error) {
        console.error('Function invocation error:', error);
        
        // Handle different types of errors
        let errorMessage = "Failed to send your message. Please try again.";
        
        if (error.message?.includes("Edge Function returned a non-2xx status code")) {
          errorMessage = "Email service is temporarily unavailable. Please try again later or contact us directly.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Error Sending Message",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Check if the function returned an error in the result
      if (result?.error) {
        console.error('Function returned error:', result.error);
        toast({
          title: "Error Sending Message",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      // Success!
      console.log('Email sent successfully:', result);
      setIsSubmitted(true);
      form.reset();
      toast({
        title: "Message Sent Successfully!",
        description: result?.message || "Thank you for contacting us. We'll respond within 2 business days.",
      });
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isSubmitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Message Sent Successfully!</CardTitle>
              <CardDescription>
                Thank you for contacting us. Our support team will review your message and respond within 2 business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => {
                  setIsSubmitted(false);
                  form.reset();
                }}
                variant="outline"
              >
                Send Another Message
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Mail className="h-4 w-4" />
            Contact Support
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground">
            Have a question or need help? We're here to assist you.
          </p>
        </div>

        <Alert className="mb-6">
          <AlertDescription>
            Our support team typically responds within 2 business days. For urgent matters, 
            please include "URGENT" in your message title.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your.email@example.com" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief description of your question or issue" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide details about your question or the issue you're experiencing..."
                          className="min-h-[120px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Contact;