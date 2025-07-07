"use client"; // Needed for client-side hooks

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes, FaDog, FaChartLine, FaWallet, FaFileAlt, FaComments, FaChartBar, FaPlug, FaExpand, FaExchangeAlt } from 'react-icons/fa';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { flowTestnet, nearTestnet } from '../wagmi';
import ChatInterface from './components/ChatInterface';
import MemecoinsExplorer from './components/MemecoinsExplorer';
import AccessControl from './components/AccessControl';
import AccessStatus from './components/AccessStatus';
import { SUPPORTED_CHAINS } from './config/contract';

// Window position interface
interface WindowPosition {
  x: number;
  y: number;
}

// Window size interface
interface WindowSize {
  width: number;
  height: number;
}

// Open window state interface
interface OpenWindow {
  id: string;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [connected, setConnected] = useState(false);
  const [appStarted, setAppStarted] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [selectedChain, setSelectedChain] = useState<'flow' | 'near'>('flow');
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<WindowPosition>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<{start: WindowPosition, size: WindowSize} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update connected state when account changes
  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected]);

  // Update selected chain based on wallet's current chain
  useEffect(() => {
    if (chainId === 545) { // Flow Testnet
      setSelectedChain('flow');
    } else if (chainId === 1313161555) { // Near Aurora Testnet
      setSelectedChain('near');
    }
  }, [chainId]);

  // Handle chain switching
  const handleChainSwitch = (chain: 'flow' | 'near') => {
    const targetChainId = chain === 'flow' ? 545 : 1313161555;
    if (chainId !== targetChainId && switchChain) {
      switchChain({ chainId: targetChainId });
    }
    setSelectedChain(chain);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaDog /> },
    { id: 'memecoins', label: 'Memecoins', icon: <FaChartLine /> },
    { id: 'stats', label: 'Stats', icon: <FaChartBar /> },
    { id: 'chat', label: 'Chat', icon: <FaComments /> },
    { id: 'whitepaper', label: 'Whitepaper', icon: <FaFileAlt /> },
    { id: 'wallet', label: 'Wallet', icon: <FaWallet /> },
  ];

  // Get default window size for a given type
  const getDefaultWindowSize = (id: string): WindowSize => {
    switch(id) {
      case 'chat':
        return { width: 600, height: 600 };
      default:
        return { width: 500, height: 400 };
    }
  };

  const toggleWindow = (id: string) => {
    console.log("Toggle window:", id);
    // Check if window is already open
    const existingWindowIndex = openWindows.findIndex(w => w.id === id);
    
    if (existingWindowIndex !== -1) {
      // Close window - use functional update form to ensure latest state
      console.log("Closing window:", id);
      setOpenWindows((prevWindows) => {
        return prevWindows.filter(w => w.id !== id);
      });
      
      if (activeWindowId === id) {
        setActiveWindowId(null);
      }
    } else {
      // Open new window
      const windowSize = getDefaultWindowSize(id);
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
      
      const newWindow: OpenWindow = {
        id,
        position: {
          x: (containerWidth / 2) - (windowSize.width / 2),
          y: (containerHeight / 2) - (windowSize.height / 2)
        },
        size: windowSize,
        zIndex: nextZIndex
      };
      
      // Use functional update form to ensure latest state
      setOpenWindows((prevWindows) => [...prevWindows, newWindow]);
      setActiveWindowId(id);
      setNextZIndex(prev => prev + 1);
    }
  };

  const bringToFront = (id: string) => {
    setActiveWindowId(id);
    setOpenWindows(openWindows.map(window => {
      if (window.id === id) {
        return { ...window, zIndex: nextZIndex };
      }
      return window;
    }));
    setNextZIndex(nextZIndex + 1);
  };

  const startDrag = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the window
    const window = openWindows.find(w => w.id === id);
    if (!window) return;
    
    // Calculate the offset between mouse position and window position
    const offsetX = e.clientX - window.position.x;
    const offsetY = e.clientY - window.position.y;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setDragging(id);
    bringToFront(id);
  };

  const startResize = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find the window
    const window = openWindows.find(w => w.id === id);
    if (!window) return;
    
    setResizeStart({
      start: { x: e.clientX, y: e.clientY },
      size: window.size
    });
    setResizing(id);
    bringToFront(id);
  };

  const onDrag = (e: MouseEvent) => {
    if (!dragging) return;
    
    setOpenWindows(prevWindows => prevWindows.map(window => {
      if (window.id === dragging) {
        return {
          ...window,
          position: {
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          }
        };
      }
      return window;
    }));
  };

  const onResize = (e: MouseEvent) => {
    if (!resizing || !resizeStart) return;
    
    const deltaX = e.clientX - resizeStart.start.x;
    const deltaY = e.clientY - resizeStart.start.y;
    
    setOpenWindows(prevWindows => prevWindows.map(window => {
      if (window.id === resizing) {
        return {
          ...window,
          size: {
            width: Math.max(300, resizeStart.size.width + deltaX),
            height: Math.max(200, resizeStart.size.height + deltaY)
          }
        };
      }
      return window;
    }));
  };

  const stopDrag = () => {
    setDragging(null);
  };

  const stopResize = () => {
    setResizing(null);
    setResizeStart(null);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDrag);
    }
    
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDrag);
    };
  }, [dragging, openWindows, dragOffset]);

  useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', onResize);
      window.addEventListener('mouseup', stopResize);
    }
    
    return () => {
      window.removeEventListener('mousemove', onResize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [resizing, openWindows, resizeStart]);

  const getWindowByID = (id: string) => {
    return openWindows.find(w => w.id === id);
  };

  const renderWindow = (id: string) => {
    const windowData = getWindowByID(id);
    if (!windowData) return null;

    const windowStyle = {
      position: 'absolute' as const,
      left: `${windowData.position.x}px`,
      top: `${windowData.position.y}px`,
      width: `${windowData.size.width}px`,
      height: id === 'chat' ? `${windowData.size.height}px` : 'auto',
      zIndex: windowData.zIndex
    };

    const isActive = activeWindowId === id;
    const activeClass = isActive ? 'ring-2 ring-trendpup-orange' : '';

    switch(id) {
      case 'dashboard':
        return (
          <div 
            className={`bg-white rounded-xl shadow-2xl border-2 border-black overflow-hidden ${activeClass}`}
            style={windowStyle}
          >
            <div 
              className="bg-gradient-to-r from-trendpup-dark to-gray-800 text-white p-3 flex justify-between items-center cursor-move"
              onMouseDown={(e) => startDrag(e, id)}
            >
              <div className="flex items-center">
                <FaDog className="mr-2" />
                <h2 className="text-xl font-bold">Dashboard</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-6">
              <AccessStatus />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Dashboard widgets */}
                <div className="bg-gradient-to-br from-trendpup-beige/50 to-trendpup-beige p-4 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-trendpup-dark mb-1">Total Value</h3>
                  <p className="text-2xl font-bold text-trendpup-orange">$0.00</p>
                </div>
                <div className="bg-gradient-to-br from-trendpup-beige/50 to-trendpup-beige p-4 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-trendpup-dark mb-1">24h Change</h3>
                  <p className="text-2xl font-bold text-green-600">+0.00%</p>
                </div>
                <div className="md:col-span-2 bg-gradient-to-br from-trendpup-beige/50 to-trendpup-beige p-4 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-trendpup-dark mb-1">Active Positions</h3>
                  <p className="text-2xl font-bold text-trendpup-orange">0</p>
                </div>
              </div>
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      case 'chat':
        return (
          <div 
            className={`bg-white rounded-xl shadow-2xl border-2 border-black overflow-hidden ${activeClass}`}
            style={{
              ...windowStyle,
              width: `${Math.max(windowData.size.width, 500)}px`,
              height: `${Math.max(windowData.size.height, 450)}px`,
            }}
          >
            <div 
              className="bg-gradient-to-r from-trendpup-dark to-gray-800 text-white p-3 flex justify-between items-center cursor-move"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startDrag(e, id);
              }}
            >
              <div className="flex items-center">
                <FaComments className="mr-2" />
                <h2 className="text-xl font-bold">Chat</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div 
              className="h-[calc(100%-48px)] overflow-hidden"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            >
              <ChatInterface />
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      case 'memecoins':
        return (
          <div 
            className={`bg-white rounded-xl shadow-2xl border-2 border-black overflow-hidden ${activeClass}`}
            style={windowStyle}
          >
            <div 
              className="bg-gradient-to-r from-trendpup-dark to-gray-800 text-white p-3 flex justify-between items-center cursor-move"
              onMouseDown={(e) => startDrag(e, id)}
            >
              <div className="flex items-center">
                <FaChartLine className="mr-2" />
                <h2 className="text-xl font-bold">Memecoins</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-4 max-h-[500px] overflow-auto">
              <MemecoinsExplorer selectedChain={selectedChain} />
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      case 'stats':
        return (
          <div 
            className={`bg-white rounded-xl shadow-2xl border-2 border-black overflow-hidden ${activeClass}`}
            style={windowStyle}
          >
            <div 
              className="bg-gradient-to-r from-trendpup-dark to-gray-800 text-white p-3 flex justify-between items-center cursor-move"
              onMouseDown={(e) => startDrag(e, id)}
            >
              <div className="flex items-center">
                <FaChartBar className="mr-2" />
                <h2 className="text-xl font-bold">Statistics</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-trendpup-beige/50 to-trendpup-beige p-4 rounded-xl shadow-sm mb-4">
                <h3 className="text-lg font-semibold text-trendpup-dark mb-2">Top Gainers</h3>
                <p className="text-gray-600">No data available</p>
              </div>
              <div className="bg-gradient-to-br from-trendpup-beige/50 to-trendpup-beige p-4 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-trendpup-dark mb-2">Market Overview</h3>
                <p className="text-gray-600">No data available</p>
              </div>
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      case 'whitepaper':
        return (
          <div 
            className={`bg-white rounded-xl shadow-2xl border-2 border-black overflow-hidden ${activeClass}`}
            style={windowStyle}
          >
            <div 
              className="bg-gradient-to-r from-trendpup-dark to-gray-800 text-white p-3 flex justify-between items-center cursor-move"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startDrag(e, id);
              }}
            >
              <div className="flex items-center">
                <FaFileAlt className="mr-2" />
                <h2 className="text-xl font-bold">Whitepaper</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[500px]">
              <h1 className="text-2xl font-bold text-trendpup-dark mb-3">TrendPup: Advanced Memecoin Intelligence System for Flow & Near Protocols</h1>
              
              <h2 className="text-xl font-bold text-trendpup-dark mt-6 mb-3">Executive Summary</h2>
              <div className="prose prose-sm">
                <p className="mb-3">TrendPup is a revolutionary AI-powered platform engineered specifically for the Flow and Near ecosystems, providing traders with unprecedented early access to emerging meme tokens before significant price movements occur. By leveraging AWS Bedrock for advanced AI analysis and the Eliza Agent for conversational intelligence, TrendPup synthesizes sophisticated social media analytics with on-chain Flow and Near data to identify high-potential opportunities during their inception phase, allowing users to position themselves advantageously in the market.</p>
                <p className="mb-3">Our platform democratizes access to valuable pre-pump intelligence previously available only to well-connected insiders and sophisticated traders within the Flow and Near ecosystems. Powered by AWS Bedrock and Eliza, TrendPup's unique profit-sharing business model aligns our incentives directly with user success, creating a symbiotic relationship where we only succeed when our users profit.</p>
              </div>

              <h2 className="text-xl font-bold text-trendpup-dark mt-6 mb-3">Technology Infrastructure</h2>
              
              <h3 className="text-lg font-semibold text-trendpup-dark mt-4 mb-2">Real-Time Data Acquisition Network</h3>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Multi-Chain Social Listening:</strong> Proprietary system continuously monitors Twitter/X for early mentions of emerging Flow and Near meme tokens</li>
                  <li><strong>Advanced Filtering Matrix:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Engagement threshold verification (filtering for authentic interaction patterns)</li>
                      <li>Account credibility scoring (bot detection and influence assessment)</li>
                      <li>Flow and Near-specific semantic analysis (context-aware keyword processing)</li>
                      <li>Temporal signal amplification detection (identifying organic growth patterns)</li>
                    </ul>
                  </li>
                  <li><strong>Operational Parameters:</strong> High-frequency scanning at 3-5 minute intervals with intelligent rate limiting to ensure comprehensive coverage</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-trendpup-dark mt-4 mb-2">Cognitive Analysis Engine</h3>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Data Aggregation:</strong> Scraper collects Flow and Near token data from various DEXs and scrapes Twitter for token-related tweets and sentiment.</li>
                  <li><strong>AI Analysis (AWS Bedrock):</strong> Reads tweets and token data, determines risk score, investment potential, and provides rationale for each token.</li>
                  <li><strong>Eliza Agent (AWS Bedrock + RAG):</strong> Answers user queries with the latest token data and in-depth analysis using Retrieval-Augmented Generation.</li>
                  <li><strong>Voice Interface:</strong> Natural speech input and output capabilities enabling hands-free interaction with AI analysis and trading insights.</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-trendpup-dark mt-4 mb-2">Voice-Enabled AI Experience</h3>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Speech Recognition:</strong> Advanced voice input processing for natural conversations with the AI agent</li>
                  <li><strong>Text-to-Speech:</strong> High-quality voice synthesis with customizable voice selection for natural-sounding responses</li>
                  <li><strong>Hands-Free Trading:</strong> Query market data, get token analysis, and receive trading insights through voice commands</li>
                  <li><strong>Multi-Modal Interaction:</strong> Seamless switching between text and voice interactions based on user preference</li>
                </ul>
              </div>

              <h2 className="text-xl font-bold text-trendpup-dark mt-6 mb-3">Multi-Chain Integration</h2>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Flow EVM Testnet:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Chain ID: 545</li>
                      <li>Native Currency: FLOW</li>
                      <li>RPC URL: testnet.evm.nodes.onflow.org</li>
                      <li>Block Explorer: evm-testnet.flowscan.io</li>
                      <li>Subscription Fee: 2 FLOW</li>
                    </ul>
                  </li>
                  <li><strong>Near Aurora Testnet:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Chain ID: 1313161555</li>
                      <li>Native Currency: ETH</li>
                      <li>RPC URL: testnet.aurora.dev</li>
                      <li>Block Explorer: explorer.testnet.aurora.dev</li>
                      <li>Subscription Fee: 0.0001 ETH</li>
                    </ul>
                  </li>
                  <li><strong>Wagmi Wallet Integration:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>MetaMask, WalletConnect, and other popular wallet support</li>
                      <li>Seamless connection to Flow EVM and Near Aurora testnets</li>
                      <li>Real-time balance and transaction monitoring</li>
                      <li>Dynamic chain switching between supported networks</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <h2 className="text-xl font-bold text-trendpup-dark mt-6 mb-3">Strategic Advantages</h2>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Multi-Chain Focus:</strong> Dedicated coverage of both Flow and Near ecosystems, capturing opportunities across these innovative blockchain networks</li>
                  <li><strong>Early Signal Detection:</strong> Proprietary algorithms capable of identifying promising tokens hours or days before mainstream awareness</li>
                  <li><strong>Integrated Data Intelligence:</strong> Unified analysis combining social indicators with on-chain Flow and Near metrics</li>
                  <li><strong>Voice-Enabled AI Chat:</strong> Natural voice interaction with Eliza AI agent for hands-free trading insights and analysis</li>
                  <li><strong>Scientific Methodology:</strong> Data-driven approach eliminating emotional decision-making</li>
                  <li><strong>Aligned Success Incentives:</strong> Business model that ensures we win only when our users win</li>
                </ul>
              </div>

              <h2 className="text-xl font-bold text-trendpup-dark mt-6 mb-3">Contact Information</h2>
              <div className="prose prose-sm">
                <p className="italic mt-4">Email: tanishqgupta322@gmail.com | Twitter: @Trend_Pup | Discord: tbd</p>
              </div>
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      case 'wallet':
        return (
          <div 
            className={`bg-white rounded-xl shadow-2xl border-2 border-black overflow-hidden ${activeClass}`}
            style={windowStyle}
          >
            <div 
              className="bg-gradient-to-r from-trendpup-dark to-gray-800 text-white p-3 flex justify-between items-center cursor-move"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                startDrag(e, id);
              }}
            >
              <div className="flex items-center">
                <FaWallet className="mr-2" />
                <h2 className="text-xl font-bold">Wallet</h2>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow(id);
                }}
                className="bg-red-600 hover:bg-red-700 p-1.5 rounded-full text-white transition-colors z-50"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-6 text-center">
              <Image 
                src="/trendpup-logo.png" 
                alt="Wallet" 
                width={80} 
                height={80}
                className="mx-auto mb-4" 
              />
              <h2 className="text-xl font-bold text-trendpup-dark mb-2">Wallet & Portfolio</h2>
              
              {/* Chain Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Image 
                    src={selectedChain === 'flow' ? "/flow.svg" : "/near.svg"} 
                    alt={selectedChain} 
                    width={20} 
                    height={20} 
                  />
                  <span className="font-medium">
                    {selectedChain === 'flow' ? 'Flow Testnet' : 'Near Aurora Testnet'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Chain ID: {selectedChain === 'flow' ? '545' : '1313161555'}
                </p>
              </div>

              {isConnected && address ? (
                <div className="space-y-4">
                  <div className="text-left">
                    <p className="text-sm text-gray-600 mb-1">Connected Wallet:</p>
                    <p className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                      {address}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Network:</span>
                    <span className={`font-medium ${
                      chainId !== 545 && chainId !== 1313161555 ? 'text-red-600' : ''
                    }`}>
                      {chainId === 545 ? 'Flow Testnet' : 
                       chainId === 1313161555 ? 'Near Aurora Testnet' : 
                       'Unsupported Network'}
                    </span>
                  </div>

                  {/* Warning for unsupported networks */}
                  {chainId !== 545 && chainId !== 1313161555 && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      ⚠️ Please switch to Flow Testnet or Near Aurora Testnet
                    </div>
                  )}

                  {/* Chain Switch Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleChainSwitch('flow')}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                        chainId === 545
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Flow Testnet
                    </button>
                    <button
                      onClick={() => handleChainSwitch('near')}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                        chainId === 1313161555
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Near Aurora
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-6">Connect your wallet to interact with Flow and Near protocols</p>
                  <ConnectButton chainStatus="none" />
                </div>
              )}
            </div>
            {/* Resize handle */}
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-30 flex items-center justify-center"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e, id);
              }}
            >
              <FaExpand className="text-black/50 rotate-45" size={14} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Function to open multiple windows at once
  const openMultipleWindows = (ids: string[]) => {
    console.log("Opening multiple windows:", ids);
    const newWindows = ids
      .filter(id => !openWindows.some(w => w.id === id))
      .map((id, index) => {
        // Center windows based on container size
        const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
        const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
        const windowSize = getDefaultWindowSize(id);
        
        return {
          id,
          position: {
            x: (containerWidth / 2) - (windowSize.width / 2) + (index * 40),
            y: (containerHeight / 2) - (windowSize.height / 2) + (index * 40)
          },
          size: windowSize,
          zIndex: nextZIndex + index
        };
      });
    
    if (newWindows.length > 0) {
      console.log("Adding new windows:", newWindows);
      setOpenWindows(prevWindows => [...prevWindows, ...newWindows]);
      setActiveWindowId(newWindows[newWindows.length - 1].id);
      setNextZIndex(prevZIndex => prevZIndex + newWindows.length);
    }
  };

  const renderLandingPage = () => {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white/95 rounded-3xl shadow-2xl border border-trendpup-brown/10 p-8 md:p-12 max-w-md w-full text-center">
            <div className="flex justify-center mb-6">
              <Image 
                src="/trendpup-logo.png" 
                alt="TrendPup Logo" 
                width={200} 
                height={200}
                priority
                className="rounded-full"
              />
            </div>
            
            <h1 className="text-3xl font-bold text-trendpup-dark mb-2">TrendPup AI</h1>
            <p className="text-gray-600 mb-8 md:mb-10 text-sm">
              An autonomous AI agent that finds trending memecoins on Flow and Near protocols.
            </p>
            
            {/* Chain Selector */}
            <div className="flex justify-center mb-6">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => handleChainSwitch('flow')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                    selectedChain === 'flow'
                      ? 'bg-white text-trendpup-dark shadow-sm'
                      : 'text-gray-600 hover:text-trendpup-dark'
                  }`}
                >
                  <Image src="/flow.svg" alt="Flow" width={20} height={20} />
                  Flow
                </button>
                <button
                  onClick={() => handleChainSwitch('near')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                    selectedChain === 'near'
                      ? 'bg-white text-trendpup-dark shadow-sm'
                      : 'text-gray-600 hover:text-trendpup-dark'
                  }`}
                >
                  <Image src="/near.svg" alt="Near" width={20} height={20} />
                  Near
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
              onClick={(e) => {
                e.stopPropagation();
                  setAppStarted(true);
                  setChatMode(false);
                // Open dashboard and chat windows automatically
                setTimeout(() => {
                  openMultipleWindows([]);
                }, 100);
                }}
                className="px-6 md:px-8 py-3 bg-trendpup-beige text-trendpup-dark rounded-lg font-medium hover:bg-trendpup-beige/80 transition-colors shadow-sm"
              >
                Get Started
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setAppStarted(true);
                  setChatMode(true);
                  setTimeout(() => {
                    toggleWindow('chat');
                  }, 100);
                }}
                className="px-6 md:px-8 py-3 bg-trendpup-beige text-trendpup-dark rounded-lg font-medium hover:bg-trendpup-beige/80 transition-colors shadow-sm"
              >
                Chat Mode
              </button>
            </div>
          </div>
        </div>
      );
  };

      return (
    <AccessControl>
      <main 
        ref={containerRef}
        className="min-h-screen dashboard-bg relative overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          activeWindowId && bringToFront(activeWindowId);
        }}
      >
        {/* Landing page */}
        {!appStarted && renderLandingPage()}

        {/* Dashboard */}
        {appStarted && (
          <>
            {/* Top right buttons */}
            <div className="absolute top-4 right-4 flex items-center space-x-3 z-50">
              {/* Chain Toggle Button */}
              <div className="bg-white rounded-lg shadow-lg p-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => handleChainSwitch('flow')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                      selectedChain === 'flow'
                        ? 'bg-trendpup-orange text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Switch to Flow Testnet"
                  >
                    <Image src="/flow.svg" alt="Flow" width={16} height={16} />
                    <span className="hidden sm:inline">Flow</span>
                  </button>
                  <button
                    onClick={() => handleChainSwitch('near')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                      selectedChain === 'near'
                        ? 'bg-trendpup-orange text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Switch to Near Aurora Testnet"
                  >
                    <Image src="/near.svg" alt="Near" width={16} height={16} />
                    <span className="hidden sm:inline">Near</span>
                  </button>
                </div>
              </div>

              {/* Whitepaper Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWindow('whitepaper');
                }}
                className={`p-2 rounded-lg transition-colors shadow-lg flex items-center ${
                  openWindows.some(w => w.id === 'whitepaper')
                    ? 'bg-trendpup-orange text-white'
                    : 'bg-white text-trendpup-dark hover:bg-white/90'
                }`}
                title="Whitepaper"
              >
                <FaFileAlt size={18} className="mr-2" />
                <span className="hidden md:inline">Whitepaper</span>
              </button>

              {/* Wallet Connect Button */}
              <div className="bg-white rounded-lg shadow-lg">
                <ConnectButton chainStatus="none" />
              </div>
            </div>

            {/* Side Menu Squares - now with better styling */}
            <div className="fixed left-6 top-1/2 transform -translate-y-1/2 space-y-5 z-40">
              {menuItems.filter(item => item.id !== 'whitepaper').map((item) => (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWindow(item.id);
                  }}
                  className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all duration-200 shadow-lg ${
                    openWindows.some(w => w.id === item.id)
                      ? 'bg-trendpup-orange text-white scale-110'
                      : 'bg-white text-trendpup-dark hover:bg-trendpup-beige hover:scale-105'
                  }`}
                  title={item.label}
                >
                  <span className="text-2xl">{item.icon}</span>
                </button>
              ))}
            </div>

            {/* Windows Area */}
            <div className="h-screen">
              {/* Debug info - remove in production */}
              <div className="fixed bottom-2 left-2 text-xs text-black/50 z-10">
                Open windows: {openWindows.map(w => w.id).join(', ')}
              </div>
              
              {openWindows.map((window) => (
                <div 
                  key={window.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    bringToFront(window.id);
                  }}
                >
                  {renderWindow(window.id)}
                </div>
              ))}
            </div>

            {/* Welcome message if no windows are open */}
            {openWindows.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-12 bg-white/90 rounded-2xl shadow-lg max-w-md border-2 border-black">
                  <Image 
                    src="/trendpup-logo.png" 
                    alt="TrendPup Logo" 
                    width={100} 
                    height={100}
                    className="mx-auto mb-4" 
                  />
                  <h2 className="text-2xl font-bold text-trendpup-dark mb-4">Welcome to TrendPup</h2>
                  <p className="text-gray-600 mb-6">Click on the menu items on the left to get started</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Debug info - remove in production */}
      </main>
    </AccessControl>
  );
}