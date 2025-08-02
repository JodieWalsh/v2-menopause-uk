import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, FileText, Heart, Mail, Shield, Star, Users } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useResourcePreloader } from "@/hooks/useResourcePreloader";

const Landing = () => {
  // Preload critical resources for better performance
  useResourcePreloader({
    resources: [
      {
        href: 'https://oconnpquknkpxmcoqvmo.supabase.co/storage/v1/object/public/logos-tep//facebook_header_logo.png',
        as: 'image'
      },
      {
        href: 'https://oconnpquknkpxmcoqvmo.supabase.co/storage/v1/object/public/logos-tep//revised_logo.png',
        as: 'image'
      }
    ],
    priority: 'high'
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen hero-gradient overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-4 w-48 h-48 sm:w-72 sm:h-72 sm:left-10 bg-primary rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-4 w-48 h-48 sm:w-72 sm:h-72 sm:right-10 bg-accent rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-10 left-1/2 w-48 h-48 sm:w-72 sm:h-72 bg-secondary rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-screen py-16 lg:py-20">
            {/* Content Column */}
            <div className="text-center animate-fade-in order-1 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 mx-auto">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                Trusted by Women Worldwide
              </div>
              
              <h1 className="responsive-heading font-serif font-bold text-foreground mb-4 sm:mb-6 leading-tight">
                Navigate Menopause with Confidence: Save Time, Money, and Stress
              </h1>
              
              <p className="text-base sm:text-lg text-foreground drop-shadow-lg mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto">
                Our new tool helps you be fully ready for your doctors visit, so you feel confident, heard, and get the right care with fewer doctor visits.
              </p>
              
              <div className="flex justify-center">
                <Button variant="hero" size="xl" className="group touch-target" asChild>
                  <Link to="/register">
                    Start Your Assessment
                    <Heart className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Visual Column */}
            <div className="relative animate-fade-in order-2 lg:order-2" style={{ animationDelay: '0.3s' }}>
              <div className="relative max-w-md mx-auto lg:max-w-none">
                {/* Main Image Container */}
                <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-elegant">
                  <div className="aspect-[4/5] bg-gradient-to-br from-primary-light via-background to-secondary-light">
                    <OptimizedImage
                      src="https://oconnpquknkpxmcoqvmo.supabase.co/storage/v1/object/public/photos-for-tep//Ladies%20laughing%20(1).png"
                      alt="Women laughing together, representing support and empowerment"
                      className="w-full h-full brightness-75 contrast-90 saturate-75"
                      priority={true}
                      aspectRatio="4/5"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Sales Letter Section */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="responsive-heading font-serif font-bold text-foreground mb-4">
              Discover How This Tool Can Transform Your Healthcare Experience
            </h2>
          </div>
          
          <div className="relative max-w-3xl mx-auto">
            <video 
              className="w-full aspect-video rounded-xl shadow-lg touch-friendly"
              controls
              preload="none"
              playsInline
              poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2NzUiIHZpZXdCb3g9IjAgMCAxMjAwIDY3NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjc1IiBmaWxsPSJoc2woMCAwJSA5NiUpIi8+Cjx0ZXh0IHg9IjYwMCIgeT0iMzM3LjUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSJoc2woMCAwJSA2MyUpIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7igJZDbGljayB0byBQbGF5IFZpZGVvPC90ZXh0Pgo8L3N2Zz4="
              src="https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/videos//VSL1%20Menopause%20UK.mp4"
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                video.currentTime = 1;
              }}
              onEnded={(e) => {
                const video = e.target as HTMLVideoElement;
                video.currentTime = 1;
                video.pause();
              }}
              onLoadStart={() => {
                // Add loading state if needed
              }}
            >
              <p className="text-center p-8 text-muted-foreground">
                Your browser doesn't support HTML video. 
                <a href="https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/videos//VSL1%20Menopause%20UK.mp4" 
                   className="text-primary hover:underline ml-1">
                  Download the video
                </a>
              </p>
            </video>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section-padding bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="responsive-heading font-serif font-bold text-foreground mb-4">
              How It Works: Your Path to a Productive Consultation
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your doctor's visit experience
            </p>
          </div>
          
          <div className="responsive-grid">
            <Card className="card-gradient text-center p-6 sm:p-8 animate-slide-up">
              <CardContent className="p-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-semibold mb-3 sm:mb-4">1. Answer Questions</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Complete our comprehensive questionnaire about your symptoms, 
                  medical history, and concerns at your own pace.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-primary bg-primary/10 rounded-full px-2 sm:px-3 py-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  Takes about 45 minutes
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-gradient text-center p-6 sm:p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-accent-dark" />
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-semibold mb-3 sm:mb-4">2. Generate Document</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Our system creates a professional, doctor-focused document 
                  summarizing your information in medical terminology.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-gradient text-center p-6 sm:p-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary/60 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-secondary-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-serif font-semibold mb-3 sm:mb-4">3. Share with Doctor</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Bring your document to your appointment for more focused, 
                  productive discussions and better healthcare outcomes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="responsive-heading font-serif font-bold text-foreground mb-4">
              What Our Users Say
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Real experiences from women who transformed their healthcare journey
            </p>
          </div>
          
          <div className="responsive-grid">
            <Card className="card-gradient p-4 sm:p-6">
              <CardContent className="p-0">
                <div className="flex items-center mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary mr-0.5" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  "This tool completely changed my doctor's visit. I was able to clearly 
                  communicate all my symptoms and got the help I needed in just one appointment."
                </p>
                <p className="text-xs sm:text-sm font-medium text-foreground">— Sarah M., 52</p>
              </CardContent>
            </Card>
            
            <Card className="card-gradient p-4 sm:p-6">
              <CardContent className="p-0">
                <div className="flex items-center mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary mr-0.5" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  "I felt so prepared and confident walking into my appointment. 
                  My doctor was impressed with how organized my information was."
                </p>
                <p className="text-xs sm:text-sm font-medium text-foreground">— Jennifer K., 48</p>
              </CardContent>
            </Card>
            
            <Card className="card-gradient p-4 sm:p-6 md:col-span-2 lg:col-span-1">
              <CardContent className="p-0">
                <div className="flex items-center mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary mr-0.5" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                  "Finally, a tool that helps me remember and articulate everything 
                  I want to discuss. No more forgetting important details!"
                </p>
                <p className="text-xs sm:text-sm font-medium text-foreground">— Maria L., 50</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-padding bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="responsive-heading font-serif font-bold text-foreground mb-4">
              Simple Pricing, Clear Value
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              One-time payment for 12 months of access
            </p>
          </div>
          
          <Card className="max-w-sm sm:max-w-md mx-auto card-gradient p-6 sm:p-8 text-center">
            <CardContent className="p-0">
              <div className="mb-6">
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">£19</div>
                <div className="text-sm sm:text-base text-muted-foreground">GBP</div>
              </div>
              <ul className="space-y-3 mb-6 sm:mb-8 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base text-muted-foreground">Comprehensive questionnaire</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base text-muted-foreground">Doctor-focused document</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base text-muted-foreground">12 months access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base text-muted-foreground">Save & resume progress</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span className="text-sm sm:text-base text-muted-foreground">Email delivery</span>
                </li>
              </ul>
              <Button variant="hero" size="lg" className="w-full touch-target" asChild>
                <Link to="/register">
                  Get Access Now
                </Link>
              </Button>
              <p className="text-xs sm:text-sm text-muted-foreground mt-4">
                💳 Secure payment • 30-day satisfaction guarantee • Discount codes available
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Dr. Jodie Section */}
      <section id="about" className="section-padding">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="responsive-heading font-serif font-bold text-foreground mb-4">
                Meet Dr Jodie: Your Guide to Empowered Health
              </h2>
            </div>
            
            <Card className="card-gradient overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
                  <div className="p-6 sm:p-8 lg:p-12">
                    <h3 className="text-xl sm:text-2xl font-serif font-semibold mb-4 sm:mb-6 text-foreground">
                      Dedicated to Women's Health Excellence
                    </h3>
                    <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-muted-foreground">
                      <p>
                        Dr Jodie brings over 15 years of experience in women's health, 
                        specializing in menopause care and patient empowerment. Her passion 
                        for helping women navigate this important life transition led to 
                        the creation of The Empowered Patient.
                      </p>
                      <p>
                        After witnessing countless patients struggle to communicate their 
                        symptoms effectively during appointments, Dr Jodie developed this 
                        comprehensive tool to bridge the gap between patient experience 
                        and medical understanding.
                      </p>
                      <p>
                        Her approach combines clinical expertise with deep empathy, 
                        ensuring every woman feels heard, understood, and empowered 
                        in her healthcare journey.
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-primary-light to-secondary-light p-6 sm:p-8 lg:p-12 flex items-center justify-center min-h-48 lg:min-h-0">
                    <div className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80">
                      <OptimizedImage
                        src="https://oconnpquknkpxmcoqvmo.supabase.co/storage/v1/object/public/logos-tep//Jodie%20Headshot%20(1).png"
                        alt="Dr Jodie - Women's Health Specialist"
                        className="w-full h-full rounded-full shadow-elegant border-4 border-white/20"
                        aspectRatio="1/1"
                        sizes="(max-width: 768px) 256px, (max-width: 1024px) 320px, 384px"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="responsive-heading font-serif font-bold text-foreground mb-4">
              Your Questions, Answered
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            <Card className="card-gradient">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  How long does it take to complete the questionnaire?
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  The comprehensive questionnaire takes approximately 45 minutes to complete. 
                  You can save your progress at any time and return to finish later.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-gradient">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  Is my personal health information secure?
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Absolutely. We use industry-standard encryption and security measures 
                  to protect your personal health information. Your data is never shared 
                  with third parties without your explicit consent.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-gradient">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  Can I modify my answers after completing the questionnaire?
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Yes, you have 12 months of access to review and update your responses. 
                  You can generate new documents as your situation changes.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-gradient">
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                  How will I receive my consultation document?
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Your personalized consultation document will be sent to your registered 
                  email address immediately after completion. You can also download it 
                  directly from the platform.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;