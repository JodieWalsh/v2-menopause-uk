import { useLocation } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

export const ConsultationProgress = () => {
  const location = useLocation();

  const modules = [
    "/consultation/module-1",
    "/consultation/module-2a",
    "/consultation/module-2b", 
    "/consultation/module-2c",
    "/consultation/module-2d",
    "/consultation/module-3",
    "/consultation/module-4",
    "/consultation/module-5",
    "/consultation/module-6"
  ];

  const getCurrentModuleIndex = () => {
    return modules.findIndex(module => location.pathname === module);
  };

  const currentIndex = getCurrentModuleIndex();
  const progressPercentage = currentIndex >= 0 ? ((currentIndex + 1) / modules.length) * 100 : 0;

  // Only show on consultation pages
  if (!location.pathname.startsWith("/consultation/module-")) {
    return null;
  }

  const getModuleName = (path: string) => {
    const moduleMap: { [key: string]: string } = {
      "/consultation/module-1": "Personal Information",
      "/consultation/module-2a": "Health History: Getting to know you",
      "/consultation/module-2b": "Gynaecological History", 
      "/consultation/module-2c": "Family and Personal Cancer History",
      "/consultation/module-2d": "Cardiovascular, Bone and Mental Health",
      "/consultation/module-3": "Medical History",
      "/consultation/module-4": "Lifestyle Factors",
      "/consultation/module-5": "Treatment Preferences",
      "/consultation/module-6": "Helpful Hints"
    };
    return moduleMap[path] || "";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary/5 border-b border-primary/20 py-4 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              Assessment Progress
            </h2>
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentIndex + 1} of {modules.length}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-muted"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {getModuleName(location.pathname)}
              </span>
              <span className="font-medium text-primary">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};