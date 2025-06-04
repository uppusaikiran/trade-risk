'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface StockSearchProps {
  onSelectStock: (symbol: string) => void;
}

export default function StockSearch({ onSelectStock }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{symbol: string, name: string, type?: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    onSelectStock(symbol);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search stocks (e.g., AAPL, Tesla)"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleSelectStock(stock.symbol)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900">{stock.symbol}</div>
                {stock.type && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {stock.type}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">{stock.name}</div>
            </button>
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <div className="text-center text-gray-500">Searching...</div>
        </div>
      )}
    </div>
  );
} 