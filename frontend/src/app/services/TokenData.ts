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
  results: any[]; // Updated to match ai_analyzer.json structure
}

export interface FormattedMemecoin {
  id: number;
  symbol: string;
  name: string; // Added name field from AI analyzer
  symbol1: string;
  chain: string;
  price: number;
  volume: string;
  marketCap: string; // Now populated with FDV data
  fdv: string; // Added FDV field from AI analyzer
  change24h: number;
  age: string;
  poolAge: string; // Added poolAge field from AI analyzer
  favorite: boolean;
  potential: number;
  risk: number;
  href: string;
  dexUrl: string; // Added dexUrl field from AI analyzer
  poolAddress: string; // Added poolAddress field from AI analyzer
  imageUrl?: string;
  buys24h: number; // Added trading activity fields from AI analyzer
  sells24h: number;
  buyers24h: number;
  sellers24h: number;
  communitySentiment: string; // Added community sentiment from AI analyzer
  sentimentScore: number; // Added sentiment score from AI analyzer
  searchSources: string[]; // Added search sources from AI analyzer
}

// Function to parse price strings, handling various formats
const parsePrice = (priceStr: string | number): number => {
  if (typeof priceStr === 'number') return priceStr;
  
  // Remove commas and any non-numeric characters except dots
  const cleaned = priceStr.replace(/,/g, '').replace(/[^\d.-]/g, '');
  
  // Parse the cleaned string
  const price = parseFloat(cleaned);
  
  // If parsing fails or results in NaN, return 0
  return isNaN(price) ? 0 : price;
};

// Function to parse percentage change
const parseChange = (changeStr: string | number): number => {
  if (typeof changeStr === 'number') return changeStr;
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
const parseNumericValue = (valueStr: string | number | undefined): number => {
  if (typeof valueStr === 'number') return valueStr;
  if (!valueStr || valueStr === 'N/A') return 0;
  
  // Remove commas, currency symbols, and any non-numeric characters except dots
  const cleaned = valueStr.replace(/,/g, '').replace(/[^\d.-]/g, '');
  
  // Parse the cleaned string
  const value = parseFloat(cleaned);
  
  // If parsing fails or results in NaN, return 0
  return isNaN(value) ? 0 : value;
};

const processTokenData = (data: any[]): FormattedMemecoin[] => {
  return data.map((coin, index) => {
    const price = typeof coin.price === 'number' ? coin.price : parsePrice(coin.price || '0');
    return {
      id: coin.id || index + 1,
      symbol: coin.symbol,
      name: coin.name || coin.symbol, // Use name from AI analyzer
      symbol1: coin.symbol1 || coin.symbol,
      chain: coin.chain || 'ethereum',
      price,
      volume: coin.volume || 'N/A',
      marketCap: coin.fdv || coin.marketCap || 'N/A', // Prioritize FDV over marketCap
      fdv: coin.fdv || 'N/A', // FDV from AI analyzer
      change24h: typeof coin.change24h === 'number' ? coin.change24h : parseChange(coin.change24h || coin['change-24h'] || '0'),
      age: coin.age || coin.poolAge || 'N/A', // Use poolAge if available
      poolAge: coin.poolAge || 'N/A', // Pool age from AI analyzer
      favorite: coin.favorite || false,
      potential: coin.potential || 0, // From AI analysis
      risk: coin.risk || 0, // From AI analysis
      href: coin.href || coin.dexUrl || '', // Use dexUrl if href not available
      dexUrl: coin.dexUrl || '', // DEX URL from AI analyzer
      poolAddress: coin.poolAddress || '', // Pool address from AI analyzer
      imageUrl: coin.imageUrl,
      buys24h: coin.buys24h || 0, // Trading activity from AI analyzer
      sells24h: coin.sells24h || 0,
      buyers24h: coin.buyers24h || 0,
      sellers24h: coin.sellers24h || 0,
      communitySentiment: coin.communitySentiment || 'N/A', // Community sentiment from AI analyzer
      sentimentScore: typeof coin.sentimentScore === 'number' ? coin.sentimentScore : 0, // Sentiment score from AI analyzer
      searchSources: Array.isArray(coin.searchSources) ? coin.searchSources : [] // Search sources from AI analyzer
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
    // Support the AI analyzer format with 'results' array
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
    
    // Sort by risk (ascending), then by potential (descending) - matches AI analyzer sorting
    processedTokens.sort((a, b) => {
      const riskCompare = a.risk - b.risk;
      if (riskCompare !== 0) return riskCompare;
      return b.potential - a.potential;
    });
    
    return processedTokens;
  } catch (error) {
    console.error('Error fetching Token data:', error);
    return [];
  }
};

// AI analysis route: risk, potential, and sentiment scores
export interface MemecoinAIAnalysis {
  symbol: string;
  risk: number;
  potential: number;
  sentiment: number; // Added sentiment score
  communitySentiment: string; // Added community sentiment text
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
    // The AI analyzer file has 'results' array
    const aiData = Array.isArray(raw.results) ? raw.results : Array.isArray(raw.data) ? raw.data : [];
    if (!aiData.length) {
      console.warn('No AI analysis data found in API response');
      return [];
    }
    return aiData.map((item: any) => ({
      symbol: item.symbol,
      risk: typeof item.risk === 'number' ? item.risk : 0,
      potential: typeof item.potential === 'number' ? item.potential : 0,
      sentiment: typeof item.sentimentScore === 'number' ? item.sentimentScore : 0, // Sentiment score from AI analyzer
      communitySentiment: item.communitySentiment || 'N/A' // Community sentiment text from AI analyzer
    }));
  } catch (error) {
    console.error('Error fetching Token AI analysis:', error);
    return [];
  }
};
