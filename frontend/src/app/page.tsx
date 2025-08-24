"use client";

import AccessControl from './components/AccessControl';

export default function Home() {
  return (
    <AccessControl>
      <div className="min-h-screen bg-gradient-to-br from-trendpup-beige via-white to-trendpup-beige">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-trendpup-dark mb-4">
                TrendPup: Advanced Memecoin Intelligence for Sei Network
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Premium AI-powered memecoin analytics on Sei Network with voice-enabled chat
              </p>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Platform Overview */}
                <div>
                  <h2 className="text-2xl font-bold text-trendpup-dark mb-4">Platform Overview</h2>
                  <p className="text-gray-600 mb-4">
                    TrendPup is a revolutionary AI-powered platform engineered specifically for the Sei ecosystem, providing traders with unprecedented early access to emerging meme tokens before significant price movements occur.
                  </p>
                  <p className="text-gray-600 mb-6">
                    By leveraging advanced AI analysis and conversational intelligence, TrendPup synthesizes sophisticated social media analytics with on-chain Sei data to identify high-potential opportunities during their inception phase.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-trendpup-dark">
                      <div className="w-2 h-2 bg-trendpup-orange rounded-full mr-3"></div>
                      <span>Real-time Sei memecoin tracking</span>
                    </div>
                    <div className="flex items-center text-trendpup-dark">
                      <div className="w-2 h-2 bg-trendpup-orange rounded-full mr-3"></div>
                      <span>AI-powered sentiment analysis</span>
                    </div>
                    <div className="flex items-center text-trendpup-dark">
                      <div className="w-2 h-2 bg-trendpup-orange rounded-full mr-3"></div>
                      <span>Voice-enabled chat interface</span>
                    </div>
                    <div className="flex items-center text-trendpup-dark">
                      <div className="w-2 h-2 bg-trendpup-orange rounded-full mr-3"></div>
                      <span>Premium analytics dashboard</span>
                    </div>
                  </div>
                </div>

                {/* Network Info */}
                <div>
                  <h2 className="text-2xl font-bold text-trendpup-dark mb-4">Sei Network</h2>
                  <div className="bg-trendpup-beige rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <img src="/sei.svg" alt="Sei" width={24} height={24} className="mr-2" />
                      <span className="text-lg font-semibold text-red-600">Sei Testnet</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Access Fee:</span>
                        <span className="font-semibold text-trendpup-orange">0.1 SEI</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chain ID:</span>
                        <span>1328</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment:</span>
                        <span>One-time lifetime access</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-trendpup-dark mb-3">Key Features</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li>• Lightning-fast EVM compatibility</li>
                      <li>• Low transaction costs</li>
                      <li>• High-performance blockchain</li>
                      <li>• Growing DeFi ecosystem</li>
                      <li>• Native MEV protection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="w-12 h-12 bg-trendpup-orange rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-trendpup-dark mb-2">AI Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Advanced machine learning algorithms analyze social sentiment and on-chain data for Sei memecoins.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="w-12 h-12 bg-trendpup-orange rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <h3 className="text-lg font-semibold text-trendpup-dark mb-2">Real-time Data</h3>
                <p className="text-gray-600 text-sm">
                  Get instant updates on Sei network token movements and market trends.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="w-12 h-12 bg-trendpup-orange rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-trendpup-dark mb-2">Early Detection</h3>
                <p className="text-gray-600 text-sm">
                  Identify promising memecoins before they gain mainstream attention on Sei.
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-trendpup-orange to-trendpup-dark rounded-xl text-white p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
              <p className="text-lg mb-6">
                Connect your wallet and pay 0.1 SEI for lifetime access to premium Sei memecoin intelligence.
              </p>
              <div className="flex justify-center">
                <div className="bg-white text-trendpup-dark px-6 py-3 rounded-lg font-semibold">
                  Connect Wallet Above to Begin
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccessControl>
  );
}
