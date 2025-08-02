import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathname = location.pathname;

  // Define route mappings
  const routeMap: Record<string, string> = {
    "": "Home",
    "auth": "Authentication",
    "login": "Login", 
    "register": "Register",
    "welcome": "Welcome",
    "payment": "Payment",
    "payment-success": "Payment Success",
    "consultation": "Consultation",
    "module-1": "Personal Information",
    "module-2": "Current Symptoms", 
    "module-3": "Medical History",
    "module-4": "Lifestyle Factors",
    "module-5": "Treatment Preferences",
    "module-6": "Helpful Hints",
    "complete": "Complete",
    "assessment": "Assessment",
    "profile": "Profile",
    "help": "Help",
    "contact": "Contact",
    "faq": "FAQ",
    "privacy": "Privacy Policy",
    "terms": "Terms of Service",
    "disclaimer": "Medical Disclaimer",
  };

  // Skip breadcrumbs for home page and auth pages
  if (pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }

  // Split pathname and create breadcrumb items
  const pathSegments = pathname.split("/").filter(segment => segment !== "");
  const breadcrumbItems: BreadcrumbItem[] = [];

  // Always start with home
  breadcrumbItems.push({ label: "Home", href: "/" });

  // Build path segments
  let currentPath = "";
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // Last item shouldn't have href (current page)
    if (index === pathSegments.length - 1) {
      breadcrumbItems.push({ label });
    } else {
      breadcrumbItems.push({ label, href: currentPath });
    }
  });

  // Don't show breadcrumbs if only home + current page
  if (breadcrumbItems.length <= 2) {
    return null;
  }

  return (
    <div className="border-b border-border bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb className="py-3">
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <div key={index} className="flex items-center">
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink asChild>
                      <Link 
                        to={item.href}
                        className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {index === 0 && <Home className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="flex items-center space-x-1 text-foreground font-medium">
                      {index === 0 && <Home className="h-4 w-4" />}
                      <span>{item.label}</span>
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                )}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};