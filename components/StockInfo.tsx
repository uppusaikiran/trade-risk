'use client';

import { StockQuote } from '@/types/stock';
import { TrendingUp, TrendingDown } from 'lucide-react';

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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{stock.symbol}</h2>
          <p className="text-gray-600">{stock.shortName}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            ${formatNumber(stock.regularMarketPrice)}
          </div>
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            <span className="font-semibold">
              {isPositive ? '+' : ''}${formatNumber(stock.regularMarketChange)} 
              ({isPositive ? '+' : ''}{formatNumber(stock.regularMarketChangePercent)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Market Cap</div>
          <div className="font-semibold">{formatLargeNumber(stock.marketCap)}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Volume</div>
          <div className="font-semibold">{new Intl.NumberFormat().format(stock.regularMarketVolume)}</div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">52W Range</div>
          <div className="font-semibold text-xs">
            ${formatNumber(stock.fiftyTwoWeekLow)} - ${formatNumber(stock.fiftyTwoWeekHigh)}
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Beta</div>
          <div className="font-semibold">{stock.beta ? formatNumber(stock.beta) : 'N/A'}</div>
        </div>
        
        {stock.trailingPE && (
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">P/E Ratio</div>
            <div className="font-semibold">{formatNumber(stock.trailingPE)}</div>
          </div>
        )}
        
        {stock.dividendYield && (
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Dividend Yield</div>
            <div className="font-semibold">{formatNumber(stock.dividendYield * 100)}%</div>
          </div>
        )}
        
        <div className="bg-gray-50 p-3 rounded">
          <div className="text-sm text-gray-600">Avg Volume</div>
          <div className="font-semibold">{new Intl.NumberFormat().format(stock.averageVolume)}</div>
        </div>
        
        {stock.forwardPE && (
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Forward P/E</div>
            <div className="font-semibold">{formatNumber(stock.forwardPE)}</div>
          </div>
        )}
      </div>
    </div>
  );
} 