"use client"; // Needed for client-side hooks

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes, FaDog, FaChartLine, FaWallet, FaFileAlt, FaComments, FaChartBar, FaExpand } from 'react-icons/fa';
import ChatInterface from './components/ChatInterface';
import MemecoinsExplorer from './components/MemecoinsExplorer';
import DualWalletButton from './components/DualWalletButton';
import AccessControl from './components/AccessControl';

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
  const [appStarted, setAppStarted] = useState(false);
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<WindowPosition>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<{start: WindowPosition, size: WindowSize} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <MemecoinsExplorer />
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
              <h1 className="text-2xl font-bold text-trendpup-dark mb-3">TrendPup: Advanced Memecoin Intelligence System for Sei</h1>
              
              <h2 className="text-xl font-bold text-trendpup-dark mt-6 mb-3">Executive Summary</h2>
              <div className="prose prose-sm">
                <p className="mb-3">TrendPup is a revolutionary AI-powered platform engineered specifically for the Sei ecosystem, providing traders with unprecedented early access to emerging meme tokens before significant price movements occur. By leveraging Vertex AI for advanced AI analysis and our Custom Agent for conversational intelligence, TrendPup synthesizes sophisticated social media analytics with on-chain Sei data to identify high-potential opportunities during their inception phase, allowing users to position themselves advantageously in the market.</p>
                <p className="mb-3">Our platform democratizes access to valuable pre-pump intelligence previously available only to well-connected insiders and sophisticated traders within the Sei ecosystem. Powered by Vertex AI and our Custom agent, TrendPup's unique profit-sharing business model aligns our incentives directly with user success, creating a symbiotic relationship where we only succeed when our users profit.</p>
              </div>

              <h2 className="text-xl font-bold text-trendpup-dark mt-6 mb-3">Technology Infrastructure</h2>
              
              <h3 className="text-lg font-semibold text-trendpup-dark mt-4 mb-2">Real-Time Data Acquisition Network</h3>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Sei-Focused Social Listening:</strong> Proprietary system continuously monitors Twitter/X for early mentions of emerging Sei meme tokens</li>
                  <li><strong>Advanced Filtering Matrix:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Engagement threshold verification (filtering for authentic interaction patterns)</li>
                      <li>Account credibility scoring (bot detection and influence assessment)</li>
                      <li>Sei-specific semantic analysis (context-aware keyword processing)</li>
                      <li>Temporal signal amplification detection (identifying organic growth patterns)</li>
                    </ul>
                  </li>
                  <li><strong>Operational Parameters:</strong> High-frequency scanning at 3-5 minute intervals with intelligent rate limiting to ensure comprehensive coverage</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold text-trendpup-dark mt-4 mb-2">Cognitive Analysis Engine</h3>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Data Aggregation:</strong> Scraper collects Sei token data from Dex Screener and scrapes Twitter for token-related tweets and sentiment.</li>
                  <li><strong>AI Analysis (Vertex AI):</strong> Reads tweets and token data, determines risk score, investment potential, and provides rationale for each token.</li>
                  <li><strong>Custom Agent (Vertex AI + RAG):</strong> Answers user queries with the latest token data and in-depth analysis using Retrieval-Augmented Generation.</li>
                </ul>
              </div>

              <h2 className="text-xl font-bold text-trendpup-dark mt-6 mb-3">Sei Integration</h2>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Network Details:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>Network: Sei Testnet</li>
                      <li>Native Currency: SEI</li>
                      <li>Chain ID: 1328</li>
                      <li>Access Fee: 0.1 SEI</li>
                    </ul>
                  </li>
                  <li><strong>Sei Wallet Integration:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>MetaMask, Rainbow, and other EVM wallets support</li>
                      <li>Seamless connection to Sei testnet</li>
                      <li>Real-time balance and transaction monitoring</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <h2 className="text-xl font-bold text-trendpup-dark mt-6 mb-3">Strategic Advantages</h2>
              <div className="prose prose-sm">
                <ul className="list-disc pl-5 mb-4">
                  <li><strong>Sei Exclusivity:</strong> Dedicated focus on the unique dynamics and opportunities within the SEI ecosystem</li>
                  <li><strong>Early Signal Detection:</strong> Proprietary algorithms capable of identifying promising tokens hours or days before mainstream awareness</li>
                  <li><strong>Integrated Data Intelligence:</strong> Unified analysis combining social indicators with on-chain Sei metrics</li>
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
              <h2 className="text-xl font-bold text-trendpup-dark mb-2">Connect Your Wallet</h2>
              <div className="space-y-4">
                <p className="text-gray-600 mb-6">Connect your wallet to the Sei network to track your memecoin investments</p>
                <div className="flex justify-center">
                  <DualWalletButton />
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
              An autonomous AI agent that finds trending memecoins on Sei.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
              onClick={(e) => {
                e.stopPropagation();
                  setAppStarted(true);
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

              {/* Connect Button */}
              <div className="p-2 rounded-lg shadow-lg bg-white">
                <DualWalletButton />
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
                <div key={window.id}>
                  {renderWindow(window.id)}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </AccessControl>
  );
}
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