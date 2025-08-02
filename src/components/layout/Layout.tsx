import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Breadcrumbs } from "./Breadcrumbs";
import { ConsultationNav } from "./ConsultationNav";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  className?: string;
  showFooter?: boolean;
}

export const Layout = ({ 
  children, 
  className,
  showFooter = true 
}: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Header />
      <Breadcrumbs />
      <ConsultationNav />
      
      <main className={cn("flex-1 relative z-10", className)}>
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
};