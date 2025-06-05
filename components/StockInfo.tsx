'use client';

import { StockQuote } from '@/types/stock';
import { TrendingUp, TrendingDown, Building2, BarChart3, DollarSign, Percent } from 'lucide-react';

interface StockInfoProps {
  stock: StockQuote;
}

export default function StockInfo({ stock }: StockInfoProps) {
  const isPositive = stock.regularMarketChange >= 0;
  
  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${formatNumber(num)}`;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-card border border-white/20 p-8 hover:shadow-card-hover transition-all duration-300">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h2 className="text-3xl font-bold text-gray-900 mr-3">{stock.symbol}</h2>
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 rounded-full border border-blue-200">
              <span className="text-sm font-medium text-blue-700">Live</span>
            </div>
          </div>
          <p className="text-lg text-gray-600 font-medium">{stock.shortName}</p>
          <div className="flex items-center mt-2 space-x-3">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Market Cap: {formatLargeNumber(stock.marketCap)}</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            ${formatNumber(stock.regularMarketPrice)}
          </div>
          <div className={`flex items-center justify-end ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`flex items-center px-3 py-1.5 rounded-full ${
              isPositive 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4 mr-2" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-2" />
              )}
              <span className="font-bold text-sm">
                {isPositive ? '+' : ''}${formatNumber(stock.regularMarketChange)} 
                ({isPositive ? '+' : ''}{formatNumber(stock.regularMarketChangePercent)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Market Cap</span>
          </div>
          <div className="font-bold text-gray-900">{formatLargeNumber(stock.marketCap)}</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Volume</span>
          </div>
          <div className="font-bold text-gray-900">{new Intl.NumberFormat().format(stock.regularMarketVolume)}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">52W Range</span>
          </div>
          <div className="font-bold text-gray-900 text-sm">
            ${formatNumber(stock.fiftyTwoWeekLow)} - ${formatNumber(stock.fiftyTwoWeekHigh)}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-2xl border border-green-200 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">Beta</span>
          </div>
          <div className="font-bold text-gray-900">{stock.beta ? formatNumber(stock.beta) : 'N/A'}</div>
        </div>
        
        {stock.trailingPE && (
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-2xl border border-yellow-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-medium text-yellow-600 uppercase tracking-wide">P/E Ratio</span>
            </div>
            <div className="font-bold text-gray-900">{formatNumber(stock.trailingPE)}</div>
          </div>
        )}
        
        {stock.dividendYield && (
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-2xl border border-indigo-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Dividend Yield</span>
            </div>
            <div className="font-bold text-gray-900">{formatNumber(stock.dividendYield * 100)}%</div>
          </div>
        )}
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">Avg Volume</span>
          </div>
          <div className="font-bold text-gray-900">{new Intl.NumberFormat().format(stock.averageVolume)}</div>
        </div>
        
        {stock.forwardPE && (
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-2xl border border-teal-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-4 h-4 text-teal-500" />
              <span className="text-xs font-medium text-teal-600 uppercase tracking-wide">Forward P/E</span>
            </div>
            <div className="font-bold text-gray-900">{formatNumber(stock.forwardPE)}</div>
          </div>
        )}
      </div>

      {/* Quick Analysis Bar */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Quick Analysis:</span>
            </div>
            <div className="flex items-center space-x-2">
              {stock.beta && stock.beta > 1.2 ? (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">High Volatility</span>
              ) : stock.beta && stock.beta < 0.8 ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Low Volatility</span>
              ) : stock.beta ? (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Moderate Volatility</span>
              ) : null}
              
              {stock.trailingPE && stock.trailingPE > 25 ? (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">High P/E</span>
              ) : stock.trailingPE && stock.trailingPE < 15 ? (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Low P/E</span>
              ) : null}
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
} 