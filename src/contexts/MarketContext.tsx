import React, { createContext, useContext, useEffect, useState } from 'react';
import { MarketConfig, MarketCode, detectMarketFromHostname, MARKET_CONFIGS } from '@/config/markets';

interface MarketContextType {
  market: MarketConfig;
  setMarket: (code: MarketCode) => void;
  isLoading: boolean;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [market, setMarketState] = useState<MarketConfig>(MARKET_CONFIGS.UK);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect market from hostname on initial load
    const detectedMarketCode = detectMarketFromHostname(window.location.hostname);
    setMarketState(MARKET_CONFIGS[detectedMarketCode]);
    setIsLoading(false);
    
    console.log('Market detected:', detectedMarketCode, 'from hostname:', window.location.hostname);
  }, []);

  const setMarket = (code: MarketCode) => {
    setMarketState(MARKET_CONFIGS[code]);
  };

  return (
    <MarketContext.Provider value={{ market, setMarket, isLoading }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket(): MarketContextType {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}