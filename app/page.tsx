'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import StockSearch from '@/components/StockSearch';
import StockInfo from '@/components/StockInfo';
import MarginCalculator from '@/components/MarginCalculator';
import StockChart from '@/components/StockChart';
import RiskAnalysis from '@/components/RiskAnalysis';
import { StockAPI } from '@/lib/stockApi';
import { StockQuote } from '@/types/stock';

export default function Home() {
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [stockData, setStockData] = useState<StockQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">TradeRisk Pro</h1>
              <span className="ml-2 text-sm text-gray-500">Margin Trading Calculator</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">Powered by Robinhood Gold</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stock Search */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Calculate Your Margin Trading Risk
            </h2>
            <p className="text-lg text-gray-600">
              Analyze swing trades with comprehensive margin calculations and risk assessment
            </p>
          </div>
          
          <div className="flex justify-center">
            <StockSearch onSelectStock={handleStockSelect} />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading stock data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stock Data Display */}
        {stockData && !isLoading && (
          <div className="space-y-8">
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

            {/* Educational Content */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Understanding Margin Trading</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">What is Margin Trading?</h4>
                  <p className="text-gray-600 text-sm">
                    Margin trading allows you to borrow money from your broker to purchase stocks. 
                    With Robinhood Gold, you can access instant deposits and margin trading with competitive rates.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Key Risks</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• Amplified losses on declining positions</li>
                    <li>• Margin call requirements</li>
                    <li>• Interest charges on borrowed funds</li>
                    <li>• Forced liquidation in extreme cases</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Best Practices</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• Set clear stop-loss levels</li>
                    <li>• Monitor positions regularly</li>
                    <li>• Never risk more than you can afford</li>
                    <li>• Understand margin requirements</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Robinhood Gold Features</h4>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• 2.5% - 7.5% margin interest rates</li>
                    <li>• Instant deposits up to $50,000</li>
                    <li>• Professional research and data</li>
                    <li>• Level II market data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Getting Started */}
        {!stockData && !isLoading && !error && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start Your Analysis
              </h3>
              <p className="text-gray-600">
                Search for a stock symbol above to begin calculating your margin trading strategy 
                and risk assessment.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              ⚠️ <strong>Disclaimer:</strong> This tool is for educational purposes only. 
              Trading involves substantial risk and may not be suitable for all investors. 
              Past performance does not guarantee future results. Always consult with a financial advisor.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Not affiliated with Robinhood Financial LLC. Margin rates and requirements subject to change.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 