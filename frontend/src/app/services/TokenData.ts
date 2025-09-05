interface TokenCoin {
  name: string;
  symbol: string;
  symbol1: string;
  price: string;
  volume: string;
  liquidity: string;
  mcap: string;
  transactions: string;
  age: string;
  'change-5m': string;
  'change-1h': string;
  'change-6h': string;
  'change-24h': string;
  href: string;
}

interface TokenDataResponse {
  data: TokenCoin[];
}

export interface FormattedMemecoin {
  id: number;
  name?: string;
  symbol: string;
  symbol1: string;
  chain: string;
  price: number;
  volume: string;
  marketCap: string;
  change24h: number;
  age: string;
  favorite: boolean;
  potential: number;
  risk: number;
  rationale?: string;
  href: string;
  imageUrl?: string;
}

// Function to parse price strings, handling various formats
const parsePrice = (priceStr: string): number => {
  // Remove commas and any non-numeric characters except dots
  const cleaned = priceStr.replace(/,/g, '').replace(/[^\d.-]/g, '');
  
  // Parse the cleaned string
  const price = parseFloat(cleaned);
  
  // If parsing fails or results in NaN, return 0
  return isNaN(price) ? 0 : price;
};

// Function to parse percentage change
const parseChange = (changeStr: string): number => {
  if (changeStr === 'N/A') return 0;
  
  // Extract the number and remove the % sign
  const cleaned = changeStr.replace(/[^\d.-]/g, '');
  
  // Parse the cleaned string
  const change = parseFloat(cleaned);
  
  // If parsing fails or results in NaN, return 0
  return isNaN(change) ? 0 : change;
};

// Function to determine risk score based on price volatility and other factors
const calculateRisk = (price: number, changeStr: string): number => {
  const change = parseChange(changeStr);
  // Higher volatility means higher risk
  const volatilityRisk = Math.min(Math.abs(change), 10);
  // Very low-priced coins are generally riskier
  const priceRisk = price < 0.001 ? 8 : price < 0.01 ? 6 : price < 0.1 ? 5 : 3;
  // Return weighted average
  return Math.min(Math.round((volatilityRisk * 0.6 + priceRisk * 0.4)), 10);
};

// Function to determine potential score
const calculatePotential = (price: number, changeStr: string): number => {
  const change = parseChange(changeStr);
  // Coins with positive recent changes have higher potential
  const changePotential = change > 5 ? 8 : change > 0 ? 6 : 4;
  // Low-priced coins have higher potential for big percentage moves
  const pricePotential = price < 0.001 ? 9 : price < 0.01 ? 7 : price < 0.1 ? 6 : 5;
  // Return weighted average
  return Math.min(Math.round((changePotential * 0.5 + pricePotential * 0.5)), 10);
};

// Helper function to parse price strings to numbers
const parseNumericValue = (valueStr: string | undefined): number => {
  if (!valueStr || valueStr === 'N/A' || valueStr === '-') return 0;
  
  // Handle pre-formatted strings like "$20K", "$5.4M", "$1.2B"
  const formattedMatch = valueStr.match(/\$?([0-9,.]+)([KMB]?)/i);
  if (formattedMatch) {
    const [, numberPart, suffix] = formattedMatch;
    const baseValue = parseFloat(numberPart.replace(/,/g, ''));
    if (isNaN(baseValue)) return 0;
    
    const multiplier = {
      'K': 1000,
      'M': 1000000,
      'B': 1000000000
    }[suffix.toUpperCase()] || 1;
    
    return baseValue * multiplier;
  }
  
  // Fallback: remove commas, currency symbols, and any non-numeric characters except dots
  const cleaned = valueStr.replace(/,/g, '').replace(/[^\d.-]/g, '');
  const value = parseFloat(cleaned);
  
  // If parsing fails or results in NaN, return 0
  return isNaN(value) ? 0 : value;
};

// Function to format small numbers for display
export const formatSmallNumber = (value: number | string, type: 'price' | 'volume' | 'fdv' | 'marketCap' = 'price'): string => {
  if (typeof value === 'string') {
    if (value === 'N/A' || value === '-' || value === '') return 'N/A';
    value = parseNumericValue(value);
  }
  
  if (value === 0) return 'N/A';
  
  if (type === 'price') {
    if (value < 0.000001) {
      return value.toExponential(2);
    } else if (value < 0.001) {
      return value.toFixed(6);
    } else if (value < 1) {
      return value.toFixed(4);
    } else {
      return value.toFixed(2);
    }
  }
  
  // For volume, fdv, marketCap
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(0)}`;
  }
};

const processTokenData = (data: any[]): FormattedMemecoin[] => {
  return data.map((coin, index) => {
    const price = typeof coin.price === 'number' ? coin.price : parsePrice(coin.price || '0');
    return {
      id: coin.id || index + 1,
      name: coin.name || coin.symbol,
      symbol: coin.symbol,
      symbol1: coin.symbol1,
      chain: coin.chain || 'unknown',
      price,
      volume: coin.volume || 'N/A',
      marketCap: coin.marketCap || 'N/A',
      change24h: typeof coin.change24h === 'number' ? coin.change24h : parseChange(coin['change-24h'] || '0'),
      age: coin.age || 'N/A',
      favorite: coin.favorite || false,
      potential: coin.potential || 0,
      risk: coin.risk || 0,
      rationale: coin.rationale || 'No analysis available',
      href: coin.href || '',
      imageUrl: coin.imageUrl
    };
  });
};

export const fetchTokenData = async (chain?: string): Promise<FormattedMemecoin[]> => {
  try {
    // Add cache-busting query param
    const response = await fetch(`/api/token-data?_=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
      console.warn('API request failed, using fallback data');
      return [];
    }
    const raw = await response.json();
    // Support both { results: [...] }, { data: [...] } and { tokens: [...] } formats
    const tokens: any[] = Array.isArray(raw.results)
      ? raw.results
      : Array.isArray(raw.data)
        ? raw.data
        : Array.isArray(raw.tokens)
          ? raw.tokens
          : [];
    
    if (!tokens.length) {
      console.warn('No token data found in API response');
      return [];
    }
    
    let processedTokens = processTokenData(tokens);
    
    // Filter by chain if specified
    if (chain && chain !== 'all') {
      processedTokens = processedTokens.filter(token => 
        token.chain.toLowerCase() === chain.toLowerCase()
      );
    }
    
    // Sort by chain name, then by potential (descending)
    processedTokens.sort((a, b) => {
      const chainCompare = a.chain.localeCompare(b.chain);
      if (chainCompare !== 0) return chainCompare;
      return b.potential - a.potential;
    });
    
    return processedTokens;
  } catch (error) {
    console.error('Error fetching Token data:', error);
    return [];
  }
};

// AI analysis route: only risk and potential scores
export interface MemecoinAIAnalysis {
  symbol: string;
  risk: number;
  potential: number;
}

export const fetchTokenAIAnalysis = async (): Promise<MemecoinAIAnalysis[]> => {
  try {
    // Add cache-busting query param
    const response = await fetch(`/api/ai-analysis?_=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
      console.warn('API request failed, using fallback data');
      return [];
    }
    const raw = await response.json();
    // The AI analyzer file is an array of objects with symbol, risk, investmentPotential
    const aiData = Array.isArray(raw.data) ? raw.data : [];
    if (!aiData.length) {
      console.warn('No AI analysis data found in API response');
      return [];
    }
    return aiData.map((item: any) => ({
      symbol: item.symbol,
      risk: typeof item.risk === 'number' ? item.risk : 0,
      potential: typeof item.investmentPotential === 'number' ? item.investmentPotential : 0
    }));
  } catch (error) {
    console.error('Error fetching Token AI analysis:', error);
    return [];
  }
};