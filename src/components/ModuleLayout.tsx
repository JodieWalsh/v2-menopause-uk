import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ConsultationProgress } from "@/components/ConsultationProgress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIntelligentPreloader } from "@/hooks/useResourcePreloader";
import { useLocation } from "react-router-dom";

interface ModuleLayoutProps {
  title: string;
  children: ReactNode;
  onNext: () => void;
  onPrevious?: () => void;
  isFirstModule?: boolean;
  isLastModule?: boolean;
  isLoading?: boolean;
}

export function ModuleLayout({
  title,
  children,
  onNext,
  onPrevious,
  isFirstModule = false,
  isLastModule = false,
  isLoading = false,
}: ModuleLayoutProps) {
  const location = useLocation();
  
  // Preload next likely routes
  useIntelligentPreloader(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      
      {/* Progress Bar - Prominent at top */}
      <div className="relative z-10">
        <ConsultationProgress />
      </div>
      
      {/* Use the main Header component */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm mt-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <img 
              src="https://oconnpquknkpxmcoqvmo.supabase.co/storage/v1/object/public/logos-tep//facebook_header_logo.png" 
              alt="The Empowered Patient Logo" 
              className="h-12 w-auto sm:h-16"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Module Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
        </div>

        {/* Content */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6 mb-8">
          {children}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border transition-all duration-200 hover:bg-muted/30">
          <div>
            {!isFirstModule && onPrevious && (
              <Button variant="outline" onClick={onPrevious} className="flex items-center gap-2 transition-all duration-200 hover:scale-105">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Saving your responses...
              </div>
            )}
            <Button 
              onClick={onNext} 
              disabled={isLoading}
              className="flex items-center gap-2"
              variant={isLastModule ? "hero" : "default"}
              size={isLastModule ? "lg" : "default"}
            >
              {isLoading ? "Saving..." : isLastModule ? "Complete Assessment" : "Continue"}
              {!isLastModule && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}