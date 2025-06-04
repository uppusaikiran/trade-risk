'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';

interface StockChartProps {
  symbol: string;
  entryPrice?: number;
  exitPrice?: number;
  stopLoss?: number;
}

interface ChartData {
  date: string;
  close: number;
  volume: number;
}

export default function StockChart({ symbol, entryPrice, exitPrice, stopLoss }: StockChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [period, setPeriod] = useState('3m');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!symbol) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/stock/historical?symbol=${symbol}&period=${period}`);
        const data = await response.json();
        
        const formattedData = data.data.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString(),
          close: item.close,
          volume: item.volume
        }));
        
        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [symbol, period]);

  const periodOptions = [
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' }
  ];

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-600">
            Price: <span className="font-semibold">{formatPrice(payload[0].value)}</span>
          </p>
          {payload[1] && (
            <p className="text-gray-600">
              Volume: <span className="font-semibold">{payload[1].value.toLocaleString()}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">
            {symbol} Price Chart
          </h3>
        </div>
        
        <div className="flex space-x-2">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-3 py-1 text-sm rounded ${
                period === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-gray-500">Loading chart data...</div>
        </div>
      ) : (
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                fontSize={12}
                tickFormatter={formatPrice}
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Line
                type="monotone"
                dataKey="close"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#2563eb', strokeWidth: 2 }}
              />
              
              {/* Reference lines for trading strategy */}
              {entryPrice && (
                <ReferenceLine
                  y={entryPrice}
                  stroke="#6b7280"
                  strokeDasharray="5 5"
                  label={{ value: `Entry: ${formatPrice(entryPrice)}`, position: "left" }}
                />
              )}
              
              {exitPrice && (
                <ReferenceLine
                  y={exitPrice}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  label={{ value: `Target: ${formatPrice(exitPrice)}`, position: "left" }}
                />
              )}
              
              {stopLoss && (
                <ReferenceLine
                  y={stopLoss}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label={{ value: `Stop: ${formatPrice(stopLoss)}`, position: "left" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Chart Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-blue-600 mr-2"></div>
          <span>Price</span>
        </div>
        {entryPrice && (
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-gray-500 mr-2" style={{ backgroundImage: 'repeating-linear-gradient(to right, #6b7280 0, #6b7280 3px, transparent 3px, transparent 8px)' }}></div>
            <span>Entry Price</span>
          </div>
        )}
        {exitPrice && (
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-green-500 mr-2" style={{ backgroundImage: 'repeating-linear-gradient(to right, #10b981 0, #10b981 3px, transparent 3px, transparent 8px)' }}></div>
            <span>Target Price</span>
          </div>
        )}
        {stopLoss && (
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-red-500 mr-2" style={{ backgroundImage: 'repeating-linear-gradient(to right, #ef4444 0, #ef4444 3px, transparent 3px, transparent 8px)' }}></div>
            <span>Stop Loss</span>
          </div>
        )}
      </div>
    </div>
  );
} 