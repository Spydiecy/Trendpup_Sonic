'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaChartLine, FaRegStar, FaStar, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';

const CHAIN_OPTIONS = [
  { label: 'Solana', value: 'solana' },
  { label: 'Ethereum', value: 'ethereum' },
];

interface Memecoin {
  id: string;
  name: string;
  symbol: string;
  price: string;
  change24h: string;
  marketCap: string;
  volume24h: string;
  logo: string;
  description: string;
  contract: string;
  trending: boolean;
  riskScore: number;
  aiAnalysis: string;
  twitterMentions: number;
  sentiment: string;
  favorite?: boolean;
}

interface MemecoinsExplorerProps {
  selectedChain?: 'solana' | 'ethereum';
}

export default function MemecoinsExplorer({ selectedChain: propSelectedChain }: MemecoinsExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const [memecoins, setMemecoins] = useState<Memecoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState(propSelectedChain || 'solana');

  // Sync with prop changes
  useEffect(() => {
    if (propSelectedChain) {
      setSelectedChain(propSelectedChain);
    }
  }, [propSelectedChain]);

  useEffect(() => {
    async function loadMemecoinsData() {
      try {
        setIsLoading(true);
        
        // Load data based on selected chain
        let data: Memecoin[];
        if (selectedChain === 'ethereum') {
          const response = await fetch('/data/ethereum-memecoins.json');
          const jsonData = await response.json();
          data = jsonData.memecoins;
        } else {
          const response = await fetch('/data/solana-memecoins.json');
          const jsonData = await response.json();
          data = jsonData.memecoins;
        }
        
        // Add favorite property to each coin
        const dataWithFavorites = data.map((coin: any) => ({
          ...coin,
          favorite: false
        }));
        
        setMemecoins(dataWithFavorites);
        setError(null);
      } catch (err) {
        console.error('Failed to load memecoin data:', err);
        setError('Failed to load memecoin data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMemecoinsData();
  }, [selectedChain]);

  const toggleFavorite = (id: string) => {
    setMemecoins(prevCoins => 
      prevCoins.map(coin => 
        coin.id === id ? { ...coin, favorite: !coin.favorite } : coin
      )
    );
  };

  const filteredCoins = memecoins.filter(coin => 
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedCoins = activeTab === 'trending' 
    ? filteredCoins.filter(coin => coin.trending)
    : activeTab === 'favorites' 
    ? filteredCoins.filter(coin => coin.favorite)
    : activeTab === 'safe' 
    ? filteredCoins.sort((a, b) => b.riskScore - a.riskScore) // Higher risk score = safer
    : filteredCoins;

  // Sort based on different criteria
  let sortedCoins: Memecoin[];
  if (activeTab === 'safe') {
    // Sort by risk score DESC (safest first), then by twitter mentions
    sortedCoins = displayedCoins.slice().sort((a, b) => {
      if (a.riskScore !== b.riskScore) return b.riskScore - a.riskScore;
      return b.twitterMentions - a.twitterMentions;
    });
  } else if (activeTab === 'trending') {
    // Sort by twitter mentions DESC (most mentioned first)
    sortedCoins = displayedCoins.slice().sort((a, b) => b.twitterMentions - a.twitterMentions);
  } else {
    // Default: sort by twitter mentions
    sortedCoins = displayedCoins.slice().sort((a, b) => b.twitterMentions - a.twitterMentions);
  }

  // Create a helper function for opening links
  const openHelixLink = useCallback((url: string) => {
    if (!url) {
      console.error("Attempted to open empty URL");
      return;
    }
    
    console.log("Opening Helix link:", url);
    
    try {
      // Simple direct window open approach
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error("Error opening link:", error);
    }
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-trendpup-brown/20 overflow-hidden">
      <div className="p-4 bg-trendpup-dark text-white">
        <h2 className="text-xl font-bold">Memecoin Explorer</h2>
        <p className="text-sm opacity-75">Discover trending memecoins with TrendPup intelligence</p>
      </div>
      <div className="p-4">
        {/* Chain Toggle - Hidden when controlled by parent */}
        {!propSelectedChain && (
          <div className="flex gap-2 mb-4">
            {CHAIN_OPTIONS.map((chain) => (
              <button
                key={chain.value}
                onClick={() => setSelectedChain(chain.value as 'solana' | 'ethereum')}
                className={`px-3 py-1 rounded-lg font-medium border transition-colors duration-150 ${
                  selectedChain === chain.value
                    ? 'bg-trendpup-orange text-white border-trendpup-orange'
                    : 'bg-white text-trendpup-dark border-trendpup-brown/20 hover:bg-trendpup-beige'
                }`}
              >
                {chain.label}
              </button>
            ))}
          </div>
        )}
        
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search coins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-trendpup-brown/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-trendpup-orange"
          />
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        
        <div className="flex mb-4 border-b border-trendpup-brown/10">
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'trending' 
                ? 'text-trendpup-orange border-b-2 border-trendpup-orange' 
                : 'text-gray-500 hover:text-trendpup-orange'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'favorites' 
                ? 'text-trendpup-orange border-b-2 border-trendpup-orange' 
                : 'text-gray-500 hover:text-trendpup-orange'
            }`}
          >
            Favorites
          </button>
          <button
            onClick={() => setActiveTab('safe')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'safe' 
                ? 'text-trendpup-orange border-b-2 border-trendpup-orange' 
                : 'text-gray-500 hover:text-trendpup-orange'
            }`}
          >
            Safest
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <FaSpinner className="animate-spin text-trendpup-orange text-3xl" />
            <span className="ml-2 text-gray-600">Loading memecoin data...</span>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">
            <FaInfoCircle className="text-3xl mb-2 inline-block" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-trendpup-beige">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-trendpup-dark uppercase tracking-wider">Symbol</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-trendpup-dark uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-trendpup-dark uppercase tracking-wider">Market Cap</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-trendpup-dark uppercase tracking-wider">Volume</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-trendpup-dark uppercase tracking-wider">24h Change</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-trendpup-dark uppercase tracking-wider">Twitter</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-trendpup-dark uppercase tracking-wider">Sentiment</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-trendpup-dark uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-trendpup-dark uppercase tracking-wider">Favorite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trendpup-beige/50">
                {sortedCoins.length > 0 ? (
                  sortedCoins.map((coin) => (
                    <tr key={coin.id} className="hover:bg-trendpup-beige/20 cursor-pointer"
                      onClick={() => window.open(`https://www.dextools.io/app/${selectedChain}/pair-explorer/${coin.id}`, '_blank')}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{coin.symbol}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">${parseFloat(coin.price).toFixed(parseFloat(coin.price) < 0.001 ? 8 : 6)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">{coin.marketCap}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500">{coin.volume24h}</td>
                      <td className={`px-4 py-4 whitespace-nowrap text-right text-sm font-medium ${parseFloat(coin.change24h) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(coin.change24h) >= 0 ? '+' : ''}{coin.change24h}%
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500">{coin.twitterMentions}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">{coin.sentiment}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">{coin.riskScore}/10</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(coin.id);
                          }}
                          className="text-lg"
                        >
                          {coin.favorite ? 
                            <FaStar className="text-trendpup-orange" /> : 
                            <FaRegStar className="text-gray-400 hover:text-trendpup-orange" />
                          }
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                      No memecoins found matching your search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}