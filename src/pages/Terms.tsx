import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Terms = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <FileText className="h-4 w-4" />
            Terms of Service
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground">
            Our commitment to supporting your wellness journey
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Terms of Use</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              Welcome! By using our app, you agree to our goal of helping you have more efficient menopause consultations with your doctor. Our app offers general information and tips but does not provide medical advice or promise specific results. You use the app at your own risk, and we encourage you to consult your doctor for professional medical advice. You are responsible for the accuracy of the information you provide in the app. We strive to keep your data secure with trusted technology but are not liable for issues beyond our control. Thank you for trusting us to support your wellness journey!
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Terms;