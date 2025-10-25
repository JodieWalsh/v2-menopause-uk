export type MarketCode = 'UK' | 'US' | 'AU';

export interface MarketConfig {
  code: MarketCode;
  name: string;
  currency: {
    symbol: string;
    code: string;
  };
  pricing: {
    regular: number;
    display: string;
  };
  videos: {
    landing: string;
    welcome: string;
  };
  content: {
    terminology: {
      doctor: string; // 'GP' vs 'doctor' vs 'doctor'
      mum: string; // 'mum' vs 'mom' vs 'mum'
    };
    regulations: {
      hasGovernmentSupport: boolean;
      supportDetails?: string;
    };
  };
  domains: string[];
}

export const MARKET_CONFIGS: Record<MarketCode, MarketConfig> = {
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    currency: {
      symbol: '£',
      code: 'GBP'
    },
    pricing: {
      regular: 10,
      display: '£10'
    },
    videos: {
      landing: 'https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/videos/VSL1%20Menopause%20UK%202.mp4',
      welcome: 'https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/videos/Welcome%20Menopause%20Australia%20descript%20video.mp4'
    },
    content: {
      terminology: {
        doctor: 'doctor',
        mum: 'mum'
      },
      regulations: {
        hasGovernmentSupport: false
      }
    },
    domains: ['menopause.the-empowered-patient.org', 'localhost']
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    currency: {
      symbol: '$',
      code: 'AUD'
    },
    pricing: {
      regular: 10,
      display: '$10'
    },
    videos: {
      landing: 'https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/videos/VSL%20Menopause%20Australia%20V4.mp4',
      welcome: 'https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/videos/Welcome%20Menopause%20Australia%20descript%20video.mp4'
    },
    content: {
      terminology: {
        doctor: 'doctor',
        mum: 'mum'
      },
      regulations: {
        hasGovernmentSupport: false
      }
    },
    domains: ['menopause.the-empowered-patient.com.au']
  },
  US: {
    code: 'US',
    name: 'United States',
    currency: {
      symbol: '$',
      code: 'USD'
    },
    pricing: {
      regular: 10,
      display: '$10'
    },
    videos: {
      landing: 'https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/videos/VSL%20Menopause%20USA%20V1.mp4',
      welcome: 'https://ppnunnmjvpiwrrrbluno.supabase.co/storage/v1/object/public/videos/Welcome%20Menopause%20Australia%20descript%20video.mp4'
    },
    content: {
      terminology: {
        doctor: 'doctor',
        mum: 'mom'
      },
      regulations: {
        hasGovernmentSupport: false
      }
    },
    domains: ['menopause.the-empowered-patient.com']
  }
};

// Function to detect market from hostname
export function detectMarketFromHostname(hostname: string): MarketCode {
  // Check each market's domains
  for (const [marketCode, config] of Object.entries(MARKET_CONFIGS)) {
    if (config.domains.some(domain => hostname.includes(domain))) {
      return marketCode as MarketCode;
    }
  }

  // Default to UK if no match
  return 'UK';
}

// Function to get market config
export function getMarketConfig(marketCode?: MarketCode): MarketConfig {
  const code = marketCode || detectMarketFromHostname(window.location.hostname);
  return MARKET_CONFIGS[code];
}

// Hook for React components
export function useMarket(): MarketConfig {
  return getMarketConfig();
}