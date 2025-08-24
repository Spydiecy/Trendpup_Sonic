'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaRegStar, FaStar, FaInfoCircle, FaSpinner } from 'react-icons/fa';

interface MemecoinData {
  id: number;
  symbol: string;
  symbol1: string;
  price: number;
  marketCap: string;
  volume: string;
  change24h: number;
  potential: number;
  risk: number;
  age: string;
  favorite: boolean;
  imageUrl?: string;
  href?: string;
  chain: string;
}

// Sei Network memecoins data
const seiMemecoins: MemecoinData[] = [
  {
    id: 1,
    symbol: "SEIDOGE",
    symbol1: "SEI",
    price: 0.000045,
    marketCap: "$2.1M",
    volume: "$453K",
    change24h: 15.67,
    potential: 9,
    risk: 3.5,
    age: "2 days",
    favorite: false,
    chain: "sei",
    href: "https://seistream.app/token/sei1abc123"
  },
  {
    id: 2,
    symbol: "SEICAT",
    symbol1: "SEI",
    price: 0.000023,
    marketCap: "$890K",
    volume: "$234K",
    change24h: -5.32,
    potential: 7,
    risk: 4.2,
    age: "1 week",
    favorite: false,
    chain: "sei",
    href: "https://seistream.app/token/sei1def456"
  },
  {
    id: 3,
    symbol: "SEIPEPE",
    symbol1: "SEI",
    price: 0.000134,
    marketCap: "$5.4M",
    volume: "$987K",
    change24h: 34.21,
    potential: 8,
    risk: 2.8,
    age: "3 days",
    favorite: false,
    chain: "sei",
    href: "https://seistream.app/token/sei1ghi789"
  },
  {
    id: 4,
    symbol: "MOONSEI",
    symbol1: "SEI",
    price: 0.000067,
    marketCap: "$3.2M",
    volume: "$567K",
    change24h: 22.45,
    potential: 6,
    risk: 5.1,
    age: "5 days",
    favorite: false,
    chain: "sei",
    href: "https://seistream.app/token/sei1jkl012"
  },
  {
    id: 5,
    symbol: "SEIINU",
    symbol1: "SEI",
    price: 0.000089,
    marketCap: "$4.7M",
    volume: "$723K",
    change24h: -12.34,
    potential: 5,
    risk: 6.3,
    age: "1 week",
    favorite: false,
    chain: "sei",
    href: "https://seistream.app/token/sei1mno345"
  }
];

export default function MemecoinsExplorer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const [memecoins, setMemecoins] = useState<MemecoinData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMemecoinsData() {
      try {
        setIsLoading(true);
        setMemecoins(seiMemecoins);
        setError(null);
      } catch (err) {
        console.error('Failed to load memecoin data:', err);
        setError('Failed to load memecoin data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMemecoinsData();
  }, []);

  const toggleFavorite = (id: number) => {
    setMemecoins(prevCoins =>
      prevCoins.map(coin =>
        coin.id === id ? { ...coin, favorite: !coin.favorite } : coin
      )
    );
  };

  const filteredCoins = memecoins.filter(coin =>
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol1.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedCoins = activeTab === 'favorites'
    ? filteredCoins.filter(coin => coin.favorite)
    : filteredCoins;

  // Sort based on different criteria
  let sortedCoins: MemecoinData[];
  if (activeTab === 'safe') {
    sortedCoins = displayedCoins.slice().sort((a, b) => {
      if (a.risk !== b.risk) return a.risk - b.risk; // Ascending order for safety (lower risk = safer)
      return b.potential - a.potential;
    });
  } else if (activeTab === 'trending') {
    sortedCoins = displayedCoins.slice().sort((a, b) => {
      if (a.potential !== b.potential) return b.potential - a.potential; // Descending order
      return b.change24h - a.change24h;
    });
  } else {
    sortedCoins = displayedCoins.slice().sort((a, b) => {
      return b.potential - a.potential;
    });
  }

  const openTokenLink = useCallback((url: string) => {
    if (!url) {
      console.error("Attempted to open empty URL");
      return;
    }

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error("Error opening link:", error);
    }
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-trendpup-brown/20 overflow-hidden">
      <div className="p-4 bg-trendpup-dark text-white">
        <h2 className="text-xl font-bold">Sei Memecoin Explorer</h2>
        <p className="text-sm opacity-75">Discover trending memecoins on Sei Network with TrendPup intelligence</p>
      </div>
      <div className="p-4">
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
            className={`px-4 py-2 font-medium ${activeTab === 'trending'
              ? 'text-trendpup-orange border-b-2 border-trendpup-orange'
              : 'text-gray-500 hover:text-trendpup-orange'
              }`}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 font-medium ${activeTab === 'favorites'
              ? 'text-trendpup-orange border-b-2 border-trendpup-orange'
              : 'text-gray-500 hover:text-trendpup-orange'
              }`}
          >
            Favorites
          </button>
          <button
            onClick={() => setActiveTab('safe')}
            className={`px-4 py-2 font-medium ${activeTab === 'safe'
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
                  <th className="px-4 py-3 text-center text-xs font-medium text-trendpup-dark uppercase tracking-wider">Potential</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-trendpup-dark uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-trendpup-dark uppercase tracking-wider">Age</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-trendpup-dark uppercase tracking-wider">Favorite</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trendpup-beige/50">
                {sortedCoins.length > 0 ? (
                  sortedCoins.map((coin) => (
                    <tr key={coin.id} className="hover:bg-trendpup-beige/20 cursor-pointer"
                      onClick={() => coin.href && openTokenLink(coin.href)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center">
                          {coin.imageUrl && (
                            <img
                              src={coin.imageUrl}
                              alt={coin.symbol}
                              className="w-6 h-6 rounded-full mr-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{coin.symbol}</span>
                            </div>
                            {coin.symbol1 && (
                              <div className="text-xs text-gray-500">vs {coin.symbol1}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        ${coin.price < 0.001 ? coin.price.toFixed(8) : coin.price.toFixed(6)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">{coin.marketCap}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-500">{coin.volume}</td>
                      <td className={`px-4 py-4 whitespace-nowrap text-right text-sm font-medium ${coin.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${coin.potential >= 8 ? 'bg-green-100 text-green-800' :
                          coin.potential >= 6 ? 'bg-yellow-100 text-yellow-800' :
                            coin.potential >= 4 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {coin.potential}/10
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${coin.risk <= 2 ? 'bg-green-100 text-green-800' :
                          coin.risk <= 4 ? 'bg-yellow-100 text-yellow-800' :
                            coin.risk <= 6 ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {coin.risk.toFixed(1)}/10
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">{coin.age}</td>
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
