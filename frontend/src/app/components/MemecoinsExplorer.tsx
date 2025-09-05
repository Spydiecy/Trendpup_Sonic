'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaRegStar, FaStar, FaInfoCircle, FaSpinner, FaTimes, FaExternalLinkAlt, FaChartLine, FaUsers, FaClock, FaCoins } from 'react-icons/fa';
import { fetchTokenData, FormattedMemecoin, formatSmallNumber } from '../services/TokenData';

interface MemecoinsExplorerProps {
  selectedChain?: string;
}

interface TokenDetailModalProps {
  token: FormattedMemecoin;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (id: number) => void;
}

function TokenDetailModal({ token, isOpen, onClose, onToggleFavorite }: TokenDetailModalProps) {
  if (!isOpen) return null;

  const openDexLink = () => {
    if (token.href) {
      window.open(token.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {token.imageUrl && (
              <img
                src={token.imageUrl}
                alt={token.symbol}
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{token.symbol}</h2>
              <p className="text-gray-600">{token.name}</p>
              {token.symbol1 && (
                <p className="text-sm text-gray-500">vs {token.symbol1}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onToggleFavorite(token.id)}
              className="text-2xl"
            >
              {token.favorite ?
                <FaStar className="text-trendpup-orange" /> :
                <FaRegStar className="text-gray-400 hover:text-trendpup-orange" />
              }
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price and Market Data */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-gray-600 text-sm mb-1">
                <FaCoins className="mr-1" />
                Price
              </div>
              <div className="text-xl font-bold whitespace-pre-line">
                {formatSmallNumber(token.price, 'price')}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-gray-600 text-sm mb-1">Market Cap</div>
              <div className="text-xl font-bold whitespace-pre-line">{formatSmallNumber(token.marketCap, 'marketCap')}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-gray-600 text-sm mb-1">Volume 24h</div>
              <div className="text-xl font-bold whitespace-pre-line">{formatSmallNumber(token.volume, 'volume')}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-gray-600 text-sm mb-1">24h Change</div>
              <div className={`text-xl font-bold ${token.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Risk and Potential Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-gray-600 text-sm mb-2">
                <FaChartLine className="mr-1" />
                Investment Potential
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  token.potential >= 8 ? 'bg-green-100 text-green-800' :
                  token.potential >= 6 ? 'bg-yellow-100 text-yellow-800' :
                  token.potential >= 4 ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {token.potential}/10
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-trendpup-orange h-2 rounded-full" 
                    style={{ width: `${token.potential * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center text-gray-600 text-sm mb-2">
                <FaInfoCircle className="mr-1" />
                Risk Level
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  token.risk <= 2 ? 'bg-green-100 text-green-800' :
                  token.risk <= 4 ? 'bg-yellow-100 text-yellow-800' :
                  token.risk <= 6 ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {token.risk.toFixed(1)}/10
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${token.risk * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Rationale */}
          {token.rationale && token.rationale !== 'No analysis available' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center text-blue-900">
                  <FaInfoCircle className="mr-2" />
                  AI Analysis
                </h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  TrendPup AI
                </span>
              </div>
              <p className="text-blue-900 text-sm leading-relaxed">
                {token.rationale}
              </p>
            </div>
          )}

          {/* Community Sentiment - removed since not in current data structure */}

          {/* Trading Activity - removed since not in current data structure */}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center text-gray-600">
                <FaClock className="mr-2" />
                Age
              </span>
              <span className="font-medium">{token.age}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Chain</span>
              <span className="font-medium capitalize">{token.chain}</span>
            </div>
          </div>

          {/* Contract Address - removed since not in current data structure */}
        </div>

        {/* Footer with Action Buttons */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex space-x-3">
            <button
              onClick={openDexLink}
              disabled={!token.href}
              className="flex-1 bg-trendpup-orange text-white px-6 py-3 rounded-lg font-medium hover:bg-trendpup-orange/90 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <FaExternalLinkAlt className="mr-2" />
              Trade on DEX
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MemecoinsExplorer({ selectedChain: propSelectedChain }: MemecoinsExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const [memecoins, setMemecoins] = useState<FormattedMemecoin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState(propSelectedChain || 'all');
  const [selectedToken, setSelectedToken] = useState<FormattedMemecoin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

        // Use the token data service instead of JSON files
        const data = await fetchTokenData(selectedChain === 'all' ? undefined : selectedChain);

        setMemecoins(data);
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

  const toggleFavorite = (id: number) => {
    setMemecoins(prevCoins =>
      prevCoins.map(coin =>
        coin.id === id ? { ...coin, favorite: !coin.favorite } : coin
      )
    );
  };

  const openTokenDetail = (token: FormattedMemecoin) => {
    setSelectedToken(token);
    setIsModalOpen(true);
  };

  const closeTokenDetail = () => {
    setIsModalOpen(false);
    setSelectedToken(null);
  };

  const filteredCoins = memecoins.filter(coin =>
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol1.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedCoins = activeTab === 'favorites'
    ? filteredCoins.filter(coin => coin.favorite)
    : filteredCoins; // Show all coins for trending, safe, and default tabs

  // Sort based on different criteria, with chain-based sorting
  let sortedCoins: FormattedMemecoin[];
  if (activeTab === 'safe') {
    // Sort by chain, then by risk (ascending - lower risk score = safer), then by potential (descending)
    sortedCoins = displayedCoins.slice().sort((a, b) => {
      const chainCompare = a.chain.localeCompare(b.chain);
      if (chainCompare !== 0) return chainCompare;
      if (a.risk !== b.risk) return a.risk - b.risk; // Ascending order for safety (lowest risk first)
      return b.potential - a.potential;
    });
  } else if (activeTab === 'trending') {
    // Sort by chain, then by potential (descending), then by change24h (descending)
    sortedCoins = displayedCoins.slice().sort((a, b) => {
      const chainCompare = a.chain.localeCompare(b.chain);
      if (chainCompare !== 0) return chainCompare;
      if (a.potential !== b.potential) return b.potential - a.potential; // Descending order
      return b.change24h - a.change24h;
    });
  } else {
    // Default: sort by chain, then by potential (descending)
    sortedCoins = displayedCoins.slice().sort((a, b) => {
      const chainCompare = a.chain.localeCompare(b.chain);
      if (chainCompare !== 0) return chainCompare;
      return b.potential - a.potential;
    });
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-trendpup-brown/20 overflow-hidden">
        <div className="p-4 bg-trendpup-dark text-white">
          <h2 className="text-xl font-bold">Memecoin Explorer</h2>
          <p className="text-sm opacity-75">Discover trending memecoins with TrendPup intelligence (data may be inaccurate)</p>
          <p className="text-sm opacity-75">Ask our analyzer agent for detailed and accurate information</p>
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
                    <th className="px-4 py-3 text-center text-xs font-medium text-trendpup-dark uppercase tracking-wider">Favorite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-trendpup-beige/50">
                  {sortedCoins.length > 0 ? (
                    sortedCoins.map((coin) => (
                      <tr 
                        key={coin.id} 
                        className="hover:bg-trendpup-beige/20 cursor-pointer"
                        onClick={() => openTokenDetail(coin)}
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
                        <td className="px-4 py-4 text-right text-sm font-medium whitespace-pre-line">
                          {formatSmallNumber(coin.price, 'price')}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-medium whitespace-pre-line">{formatSmallNumber(coin.marketCap, 'marketCap')}</td>
                        <td className="px-4 py-4 text-right text-sm text-gray-500 whitespace-pre-line">{formatSmallNumber(coin.volume, 'volume')}</td>
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
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
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

      {/* Token Detail Modal */}
      {selectedToken && (
        <TokenDetailModal
          token={selectedToken}
          isOpen={isModalOpen}
          onClose={closeTokenDetail}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </>
  );
}
