import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Lazy load components for better performance
const Landing = React.lazy(() => import("./pages/Landing"));
const Auth = React.lazy(() => import("./pages/Auth"));
const Register = React.lazy(() => import("./pages/Register"));
const Payment = React.lazy(() => import("./pages/Payment"));
const PaymentSuccess = React.lazy(() => import("./pages/PaymentSuccess"));
const Welcome = React.lazy(() => import("./pages/Welcome"));
const Module1 = React.lazy(() => import("./pages/Module1"));
const Module2a = React.lazy(() => import("./pages/Module2a"));
const Module2b = React.lazy(() => import("./pages/Module2b"));
const Module2c = React.lazy(() => import("./pages/Module2c"));
const Module2d = React.lazy(() => import("./pages/Module2d"));
const Module3 = React.lazy(() => import("./pages/Module3"));
const Module4 = React.lazy(() => import("./pages/Module4"));
const Module5 = React.lazy(() => import("./pages/Module5"));
const Module6 = React.lazy(() => import("./pages/Module6"));
const Summary = React.lazy(() => import("./pages/Summary"));
const ConsultationComplete = React.lazy(() => import("./pages/ConsultationComplete"));
const Index = React.lazy(() => import("./pages/Index"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Contact = React.lazy(() => import("./pages/Contact"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Enhanced loading component with better UX
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary"></div>
      <div className="absolute inset-0 animate-pulse">
        <div className="rounded-full h-12 w-12 bg-primary/10"></div>
      </div>
    </div>
    <p className="text-muted-foreground mt-4 animate-fade-in">Loading...</p>
  </div>
);

// Optimized Query Client with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/welcome" element={
              <ProtectedRoute requiresSubscription={true}>
                <Welcome />
              </ProtectedRoute>
            } />
            <Route path="/consultation/module-1" element={
              <ProtectedRoute requiresSubscription={true}>
                <Module1 />
              </ProtectedRoute>
            } />
            <Route path="/consultation/module-2a" element={
              <ProtectedRoute requiresSubscription={true}>
                <Module2a />
              </ProtectedRoute>
            } />
            <Route path="/consultation/module-2b" element={
              <ProtectedRoute requiresSubscription={true}>
                <Module2b />
              </ProtectedRoute>
            } />
            <Route path="/consultation/module-2c" element={
              <ProtectedRoute requiresSubscription={true}>
                <Module2c />
              </ProtectedRoute>
            } />
            <Route path="/consultation/module-2d" element={
              <ProtectedRoute requiresSubscription={true}>
                <Module2d />
              </ProtectedRoute>
            } />
            <Route path="/consultation/module-3" element={
              <ProtectedRoute requiresSubscription={true}>
                <Module3 />
              </ProtectedRoute>
            } />
            <Route path="/consultation/module-4" element={
              <ProtectedRoute requiresSubscription={true}>
                <Module4 />
              </ProtectedRoute>
            } />
            <Route path="/consultation/module-5" element={
              <ProtectedRoute requiresSubscription={true}>
                <Module5 />
              </ProtectedRoute>
            } />
            <Route path="/consultation/module-6" element={
              <ProtectedRoute requiresSubscription={true}>
                <Module6 />
              </ProtectedRoute>
            } />
            <Route path="/consultation/summary" element={
              <ProtectedRoute requiresSubscription={true}>
                <Summary />
              </ProtectedRoute>
            } />
            <Route path="/consultation/complete" element={
              <ProtectedRoute requiresSubscription={true}>
                <ConsultationComplete />
              </ProtectedRoute>
            } />
            <Route path="/assessment" element={<Index />} />
            <Route path="/profile" element={
              <ProtectedRoute requiresSubscription={false}>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/contact" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
