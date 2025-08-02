import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  aspectRatio?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  sizes,
  aspectRatio,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const generateSrcSet = (baseSrc: string) => {
    // Generate multiple sizes for responsive images
    const widths = [320, 640, 768, 1024, 1280, 1536];
    return widths
      .map(width => `${baseSrc}?w=${width}&q=75 ${width}w`)
      .join(', ');
  };

  return (
    <div 
      ref={placeholderRef}
      className={cn('relative overflow-hidden', className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Blur placeholder */}
      {(isLoading || !isInView) && placeholder === 'blur' && (
        <div 
          className={cn(
            'absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted animate-pulse transition-opacity duration-300',
            !isLoading && 'opacity-0'
          )}
          style={blurDataURL ? {
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
          } : undefined}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse">
          <div className="w-full h-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-shimmer" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-2">🖼️</div>
            <p className="text-sm">Image failed to load</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          srcSet={generateSrcSet(src)}
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
};

// Higher-order component for even easier usage
export const withOptimizedImage = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    // @ts-ignore - Generic forwarded ref type complexity
    <Component {...props} ref={ref} />
  ));
  
  WrappedComponent.displayName = `withOptimizedImage(${Component.displayName || Component.name})`;
  return WrappedComponent;
};