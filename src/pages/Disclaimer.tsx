import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const Disclaimer = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <AlertTriangle className="h-4 w-4" />
            Medical Disclaimer
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
            Medical Disclaimer
          </h1>
          <p className="text-lg text-muted-foreground">
            Important information about using our app
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Important Medical Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              Our app is designed to give you tools for an efficient menopause consultation and general information about menopause only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always talk to your healthcare provider about any symptoms or health concerns. We cannot promise any specific health outcomes from using the app but hope it makes your consultations more focused and effective. If you experience a medical emergency, please contact emergency services immediately.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Disclaimer;