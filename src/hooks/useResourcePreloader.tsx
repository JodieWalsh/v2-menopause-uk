import { useEffect } from 'react';

interface PreloadResource {
  href: string;
  as: 'image' | 'video' | 'font' | 'script' | 'style';
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
}

interface UseResourcePreloaderOptions {
  resources: PreloadResource[];
  priority?: 'high' | 'low';
  condition?: boolean;
}

export const useResourcePreloader = ({ 
  resources, 
  priority = 'high',
  condition = true 
}: UseResourcePreloaderOptions) => {
  useEffect(() => {
    if (!condition) return;

    const preloadedElements: HTMLLinkElement[] = [];

    resources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      
      if (resource.type) {
        link.type = resource.type;
      }
      
      if (resource.crossOrigin) {
        link.crossOrigin = resource.crossOrigin;
      }

      // Set fetchpriority for supported browsers
      if ('fetchPriority' in link) {
        (link as any).fetchPriority = priority;
      }

      document.head.appendChild(link);
      preloadedElements.push(link);
    });

    // Cleanup function to remove preload links when component unmounts
    return () => {
      preloadedElements.forEach((link) => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [resources, priority, condition]);
};

// Hook for preloading critical route components
export const useRoutePreloader = (routes: string[]) => {
  useEffect(() => {
    const preloadRoute = async (route: string) => {
      try {
        // Preload route by creating a temporary link
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
        
        // Remove after a delay
        setTimeout(() => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        }, 5000);
      } catch (error) {
        console.warn(`Failed to preload route: ${route}`, error);
      }
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    const schedulePreload = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 100);
      }
    };

    routes.forEach((route) => {
      schedulePreload(() => preloadRoute(route));
    });
  }, [routes]);
};

// Hook for preloading next likely routes based on current location
export const useIntelligentPreloader = (currentPath: string) => {
  const getNextLikelyRoutes = (path: string): string[] => {
    switch (path) {
      case '/':
        return ['/auth', '/register'];
      case '/auth':
      case '/register':
        return ['/payment', '/welcome'];
      case '/payment':
        return ['/payment-success', '/welcome'];
      case '/welcome':
        return ['/consultation/module-1'];
      case '/consultation/module-1':
        return ['/consultation/module-2a'];
      case '/consultation/module-2a':
        return ['/consultation/module-2b'];
      case '/consultation/module-2b':
        return ['/consultation/module-2c'];
      case '/consultation/module-2c':
        return ['/consultation/module-2d'];
      case '/consultation/module-2d':
        return ['/consultation/module-3'];
      case '/consultation/module-3':
        return ['/consultation/module-4'];
      case '/consultation/module-4':
        return ['/consultation/module-5'];
      case '/consultation/module-5':
        return ['/consultation/module-6'];
      case '/consultation/module-6':
        return ['/consultation/summary'];
      case '/consultation/summary':
        return ['/consultation/complete'];
      default:
        return [];
    }
  };

  const nextRoutes = getNextLikelyRoutes(currentPath);
  useRoutePreloader(nextRoutes);
};

export default useResourcePreloader;