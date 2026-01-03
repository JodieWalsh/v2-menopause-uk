import { useEffect } from 'react';
import { useMarket } from '@/config/markets';

/**
 * EndorselyTracker Component
 *
 * Dynamically loads the market-specific Endorsely affiliate tracking script.
 * Each market (UK/US/AU) has its own Endorsely organization with a unique tracking ID.
 *
 * The script is injected into the <head> section when the component mounts,
 * and automatically updates if the market changes (though this is rare in production).
 */
export const EndorselyTracker = () => {
  const market = useMarket();

  useEffect(() => {
    // Remove any existing Endorsely script to prevent duplicates
    const existingScript = document.querySelector('script[src*="endorsely.js"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Create and configure the market-specific Endorsely script
    const script = document.createElement('script');
    script.src = 'https://assets.endorsely.com/endorsely.js';
    script.async = true;
    script.setAttribute('data-endorsely', market.endorselyTrackingId);

    // Inject script into the document head
    document.head.appendChild(script);

    console.log(`[Endorsely] Loaded tracking script for ${market.name} (${market.code}): ${market.endorselyTrackingId}`);

    // Cleanup function - removes script when component unmounts or market changes
    return () => {
      const scriptToRemove = document.querySelector('script[src*="endorsely.js"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [market.endorselyTrackingId, market.name, market.code]);

  // This component doesn't render any visible content
  return null;
};
