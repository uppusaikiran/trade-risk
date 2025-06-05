'use client';

import { useState } from 'react';
import { Search, TrendingUp, Zap } from 'lucide-react';

interface StockSearchProps {
  onSelectStock: (symbol: string) => void;
}

export default function StockSearch({ onSelectStock }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{symbol: string, name: string, type?: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/stock?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSelectStock = (symbol: string) => {
    setQuery(symbol);
    setResults([]);
    setIsFocused(false);
    onSelectStock(symbol);
  };

  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
  ];

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className={`relative transition-all duration-300 ${
        isFocused ? 'scale-[1.02] shadow-glow' : 'shadow-card'
      }`}>
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <Search className={`w-5 h-5 transition-colors duration-200 ${
            isFocused ? 'text-blue-500' : 'text-gray-400'
          }`} />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search stocks (e.g., AAPL, Tesla, NVDA)"
          className="w-full pl-12 pr-6 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl 
                   text-lg font-medium text-gray-900 placeholder-gray-500
                   focus:border-blue-500 focus:ring-0 focus:outline-none
                   transition-all duration-200 hover:bg-white/90"
        />
        
        {/* Accent border */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 transition-opacity duration-200 pointer-events-none ${
          isFocused ? 'opacity-20' : ''
        }`}></div>
      </div>
      
      {/* Search Results */}
      {(results.length > 0 || isLoading) && (
        <div className="absolute z-20 w-full mt-3 bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-card-hover overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-gray-600 font-medium">Searching...</span>
              </div>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {results.map((stock, index) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelectStock(stock.symbol)}
                  className={`w-full px-6 py-4 text-left hover:bg-blue-50/80 focus:bg-blue-50/80 
                           focus:outline-none transition-colors duration-150 ${
                    index !== results.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{stock.symbol}</div>
                        <div className="text-sm text-gray-600 leading-tight">{stock.name}</div>
                      </div>
                    </div>
                    {stock.type && (
                      <span className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-3 py-1 rounded-full font-medium border border-blue-200">
                        {stock.type}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Popular Stocks - Show when empty and not focused */}
      {!query && !isFocused && (
        <div className="mt-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 mb-3">Popular stocks to get started:</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {popularStocks.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleSelectStock(stock.symbol)}
                className="p-4 bg-white/60 backdrop-blur-sm border border-gray-200 rounded-xl 
                         hover:bg-white/80 hover:border-blue-300 hover:shadow-card transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{stock.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">{stock.symbol}</div>
                    <div className="text-xs text-gray-600 truncate">{stock.name}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Search Tips */}
      {query && !results.length && !isLoading && (
        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl">
          <div className="flex items-start space-x-3">
            <Zap className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800 mb-1">Search Tips:</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Try ticker symbols like AAPL, TSLA, NVDA</li>
                <li>• Or company names like "Apple", "Tesla", "Microsoft"</li>
                <li>• Make sure spelling is correct</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 