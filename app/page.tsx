'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Sparkles, Shield, Target, Calculator } from 'lucide-react';
import StockSearch from '@/components/StockSearch';
import StockInfo from '@/components/StockInfo';
import MarginCalculator from '@/components/MarginCalculator';
import StockChart from '@/components/StockChart';
import RiskAnalysis from '@/components/RiskAnalysis';
import TrackingDashboard from '@/components/TrackingDashboard';
import { StockAPI } from '@/lib/stockApi';
import { StockQuote } from '@/types/stock';

export default function Home() {
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [stockData, setStockData] = useState<StockQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'calculator' | 'tracking'>('calculator');
  
  // Calculator state for passing to other components
  const [calculatorData, setCalculatorData] = useState({
    entryPrice: 0,
    exitPrice: 0,
    stopLoss: 0,
    shares: 0,
    marginUsed: 0,
    ownCash: 0,
    tradeDuration: 30,
    marginInterest: 0
  });

  const handleStockSelect = async (symbol: string) => {
    setSelectedStock(symbol);
    setIsLoading(true);
    setError('');

    try {
      const data = await StockAPI.getQuote(symbol);
      setStockData(data);
    } catch (err) {
      setError('Failed to fetch stock data. Please try again.');
      console.error('Error fetching stock:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Enhanced Header with gradient background */}
      <header className="glass-effect shadow-lg border-b border-white/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="relative">
                <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 blur"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">TradeRisk Pro</h1>
                <span className="text-xs text-gray-500 font-medium tracking-wide">MARGIN TRADING CALCULATOR</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-700 font-medium">Powered by Robinhood Gold</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with enhanced design */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Professional Trading Tools</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Calculate Your 
              <span className="text-gradient"> Margin Trading Risk</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Analyze swing trades with comprehensive margin calculations, risk assessment, 
              and real-time market data integration
            </p>
          </div>
          
          {/* Enhanced Stock Search */}
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-md">
              <StockSearch onSelectStock={handleStockSelect} />
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Risk Analysis</h3>
              <p className="text-sm text-gray-600">Comprehensive risk metrics and scenario planning</p>
            </div>
            
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Precision Tools</h3>
              <p className="text-sm text-gray-600">Real-time calculations with Robinhood Gold rates</p>
            </div>
            
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 shadow-card hover:shadow-card-hover transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Market Data</h3>
              <p className="text-sm text-gray-600">Live stock prices and historical analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-2xl border border-white/20 shadow-card mb-8">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'calculator'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Calculator className="w-5 h-5" />
              <span>Risk Calculator</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'tracking'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Portfolio Tracking</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calculator Tab Content */}
        {activeTab === 'calculator' && (
          <>
            {/* Loading State with enhanced spinner */}
            {isLoading && (
              <div className="text-center py-16">
                <div className="relative">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
                  <div className="absolute inset-0 animate-pulse-glow rounded-full"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading stock data...</p>
                <p className="text-sm text-gray-500">Fetching real-time market information</p>
              </div>
            )}

            {/* Enhanced Error State */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 mb-8 shadow-card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-sm font-bold">!</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-800 font-medium">{error}</p>
                    <p className="text-red-600 text-sm mt-1">Please check the symbol and try again</p>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Stock Data Display */}
            {stockData && !isLoading && (
              <div className="space-y-8 animate-slide-up">
                {/* Stock Information */}
                <StockInfo stock={stockData} />

                {/* Stock Chart */}
                <StockChart 
                  symbol={stockData.symbol}
                  entryPrice={calculatorData.entryPrice || stockData.regularMarketPrice}
                  exitPrice={calculatorData.exitPrice}
                  stopLoss={calculatorData.stopLoss}
                />

                {/* Margin Calculator */}
                <MarginCalculator 
                  stockPrice={stockData.regularMarketPrice}
                  symbol={stockData.symbol}
                  stockName={stockData.shortName}
                />

                {/* Risk Analysis */}
                {calculatorData.shares > 0 && (
                  <RiskAnalysis
                    stockPrice={stockData.regularMarketPrice}
                    entryPrice={calculatorData.entryPrice || stockData.regularMarketPrice}
                    shares={calculatorData.shares}
                    marginUsed={calculatorData.marginUsed}
                    ownCash={calculatorData.ownCash}
                    tradeDuration={calculatorData.tradeDuration}
                    marginInterest={calculatorData.marginInterest}
                  />
                )}

                {/* Enhanced Educational Content */}
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-8 border border-blue-100 shadow-card">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Understanding Margin Trading</h3>
                    <p className="text-gray-600">Essential knowledge for successful margin trading</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        What is Margin Trading?
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Margin trading allows you to borrow money from your broker to purchase stocks. 
                        With Robinhood Gold, you can access instant deposits and margin trading with competitive rates.
                      </p>
                    </div>
                    
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                        Key Risks
                      </h4>
                      <ul className="text-gray-600 text-sm space-y-2">
                        <li className="flex items-start">
                          <span className="text-red-400 mr-2">•</span>
                          Amplified losses on declining positions
                        </li>
                        <li className="flex items-start">
                          <span className="text-red-400 mr-2">•</span>
                          Margin call requirements
                        </li>
                        <li className="flex items-start">
                          <span className="text-red-400 mr-2">•</span>
                          Interest charges on borrowed funds
                        </li>
                        <li className="flex items-start">
                          <span className="text-red-400 mr-2">•</span>
                          Forced liquidation in extreme cases
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Best Practices
                      </h4>
                      <ul className="text-gray-600 text-sm space-y-2">
                        <li className="flex items-start">
                          <span className="text-green-400 mr-2">•</span>
                          Set clear stop-loss levels
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-400 mr-2">•</span>
                          Monitor positions regularly
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-400 mr-2">•</span>
                          Never risk more than you can afford
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-400 mr-2">•</span>
                          Understand margin requirements
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                        Robinhood Gold Features
                      </h4>
                      <ul className="text-gray-600 text-sm space-y-2">
                        <li className="flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          2.5% - 7.5% margin interest rates
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          Instant deposits up to $50,000
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          Professional research and data
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          Level II market data
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Getting Started */}
            {!stockData && !isLoading && !error && (
              <div className="text-center py-16">
                <div className="max-w-lg mx-auto">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-glow">
                      <TrendingUp className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-20 blur-xl"></div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Start Your Analysis
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Search for a stock symbol above to begin calculating your margin trading strategy 
                    and comprehensive risk assessment with real-time market data.
                  </p>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">Pro tip:</span> Try popular symbols like AAPL, TSLA, NVDA, or MSFT
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tracking Tab Content */}
        {activeTab === 'tracking' && (
          <TrackingDashboard />
        )}
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
              <p className="text-gray-700 text-sm leading-relaxed">
                <span className="inline-flex items-center text-yellow-600 font-bold mr-2">
                  ⚠️ Disclaimer:
                </span>
                This tool is for educational purposes only. 
                Trading involves substantial risk and may not be suitable for all investors. 
                Past performance does not guarantee future results. Always consult with a financial advisor.
              </p>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-xs">
                © 2024 TradeRisk Pro. Built with modern web technologies for optimal performance.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 