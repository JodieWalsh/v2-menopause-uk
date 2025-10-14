import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

const Privacy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield className="h-4 w-4" />
            Privacy Policy
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Your privacy and data security are our top priorities
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How We Protect Your Privacy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              We take your privacy seriously and are committed to protecting your personal and medical information. When you use our app to share your menopause journey and book consultations, we collect only the information you choose to provide. Your data is safely stored in a secure Supabase database and is kept for up to one year to help you have a smoother consultation experience. We use encryption both in transit and at rest to keep your information safe. We won't share your information with anyone unless you ask us to or the law requires it. Feel confident that we care about your privacy as much as you do!
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Privacy;