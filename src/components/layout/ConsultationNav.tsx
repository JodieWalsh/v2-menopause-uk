import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  User, 
  Stethoscope, 
  FileText, 
  Heart, 
  Settings, 
  Lightbulb,
  CheckCircle 
} from "lucide-react";

interface ConsultationNavProps {
  className?: string;
}

export const ConsultationNav = ({ className }: ConsultationNavProps) => {
  const location = useLocation();

  const modules = [
    {
      id: "module-1",
      title: "Personal Information",
      href: "/consultation/module-1",
      icon: User,
      description: "Basic details"
    },
    {
      id: "module-2a", 
      title: "Health History",
      href: "/consultation/module-2a",
      icon: Stethoscope,
      description: "Getting to know you"
    },
    {
      id: "module-2b", 
      title: "Gynaecological History",
      href: "/consultation/module-2b",
      icon: Stethoscope,
      description: "Reproductive health"
    },
    {
      id: "module-2c", 
      title: "Cancer History",
      href: "/consultation/module-2c",
      icon: Stethoscope,
      description: "Family and personal history"
    },
    {
      id: "module-2d", 
      title: "Health Systems",
      href: "/consultation/module-2d",
      icon: Stethoscope,
      description: "Cardiovascular, bone, mental"
    },
    {
      id: "module-3",
      title: "Medical History", 
      href: "/consultation/module-3",
      icon: FileText,
      description: "Past medical information"
    },
    {
      id: "module-4",
      title: "Lifestyle Factors",
      href: "/consultation/module-4", 
      icon: Heart,
      description: "Daily habits & lifestyle"
    },
    {
      id: "module-5",
      title: "Treatment Preferences",
      href: "/consultation/module-5",
      icon: Settings,
      description: "Your preferences"
    },
    {
      id: "module-6",
      title: "Helpful Hints",
      href: "/consultation/module-6",
      icon: Lightbulb,
      description: "Tips for your appointment"
    },
  ];

  const isActive = (href: string) => location.pathname === href;
  const getCurrentModuleIndex = () => {
    return modules.findIndex(module => isActive(module.href));
  };

  // Only show on consultation pages
  if (!location.pathname.startsWith("/consultation/module-")) {
    return null;
  }

  return (
    <div className={cn("bg-muted/30 border-b border-border", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Horizontal Navigation */}
        <nav className="hidden lg:flex items-center justify-center py-4 space-x-1">
          {modules.map((module, index) => {
            const IconComponent = module.icon;
            const isCurrentActive = isActive(module.href);
            const isCompleted = getCurrentModuleIndex() > index;
            
            return (
              <Link
                key={module.id}
                to={module.href}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isCurrentActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : isCompleted
                    ? "bg-accent text-accent-foreground hover:bg-accent-dark"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <IconComponent className="h-4 w-4" />
                )}
                <span className="hidden xl:inline">{module.title}</span>
                <span className="xl:hidden">Module {index + 1}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile/Tablet Progress Steps */}
        <div className="lg:hidden py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {getCurrentModuleIndex() + 1} of {modules.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((getCurrentModuleIndex() + 1) / modules.length) * 100)}% Complete
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((getCurrentModuleIndex() + 1) / modules.length) * 100}%` }}
            />
          </div>

          {/* Current Module Info */}
          {modules.map((module, index) => {
            if (!isActive(module.href)) return null;
            const IconComponent = module.icon;
            
            return (
              <div key={module.id} className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <IconComponent className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium text-foreground">{module.title}</h3>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                </div>
              </div>
            );
          })}

          {/* Navigation Dots */}
          <div className="flex justify-center space-x-2 mt-4">
            {modules.map((module, index) => {
              const isCompleted = getCurrentModuleIndex() > index;
              const isCurrentActive = isActive(module.href);
              
              return (
                <Link
                  key={module.id}
                  to={module.href}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-200",
                    isCurrentActive
                      ? "bg-primary scale-125"
                      : isCompleted
                      ? "bg-accent"
                      : "bg-muted hover:bg-muted-dark"
                  )}
                  aria-label={`Go to ${module.title}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};