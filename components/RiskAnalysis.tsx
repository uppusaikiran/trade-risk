'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle, Target } from 'lucide-react';

interface RiskAnalysisProps {
  stockPrice: number;
  entryPrice: number;
  shares: number;
  marginUsed: number;
  ownCash: number;
  tradeDuration: number;
  marginInterest: number;
}

export default function RiskAnalysis({
  stockPrice,
  entryPrice,
  shares,
  marginUsed,
  ownCash,
  tradeDuration,
  marginInterest
}: RiskAnalysisProps) {
  const [riskTolerance, setRiskTolerance] = useState({
    maxLossPercentage: 10,
    stopLossPercentage: 5,
    takeProfitPercentage: 15
  });

  // Generate profit/loss scenarios
  const generateScenarios = () => {
    const scenarios = [];
    const priceRange = {
      min: entryPrice * 0.7, // 30% down
      max: entryPrice * 1.4   // 40% up
    };

    for (let i = 0; i <= 20; i++) {
      const price = priceRange.min + (priceRange.max - priceRange.min) * (i / 20);
      const grossPnL = (price - entryPrice) * shares;
      const netPnL = grossPnL - marginInterest;
      const roi = (netPnL / ownCash) * 100;
      
      // Check for margin call (assuming 25% maintenance margin)
      const portfolioValue = price * shares;
      const equity = portfolioValue - marginUsed;
      const marginCall = equity < (portfolioValue * 0.25);

      scenarios.push({
        price: price,
        profit: netPnL,
        roi: roi,
        marginCall: marginCall
      });
    }

    return scenarios;
  };

  const scenarios = generateScenarios();
  
  // Calculate key metrics
  const currentPnL = (stockPrice - entryPrice) * shares - marginInterest;
  const currentROI = (currentPnL / ownCash) * 100;
  
  const stopLossPrice = entryPrice * (1 - riskTolerance.stopLossPercentage / 100);
  const takeProfitPrice = entryPrice * (1 + riskTolerance.takeProfitPercentage / 100);
  
  const maxLossDollar = (riskTolerance.maxLossPercentage / 100) * ownCash;
  const maxLossPrice = entryPrice - (maxLossDollar / shares);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold">Price: ${label.toFixed(2)}</p>
          <p className={`${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            P&L: <span className="font-semibold">{formatCurrency(data.profit)}</span>
          </p>
          <p className={`${data.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ROI: <span className="font-semibold">{data.roi.toFixed(1)}%</span>
          </p>
          {data.marginCall && (
            <p className="text-red-600 font-semibold">⚠️ Margin Call</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Shield className="w-6 h-6 mr-2 text-green-600" />
        <h3 className="text-xl font-bold text-gray-900">Risk Analysis</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Settings */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Risk Parameters</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Loss Tolerance ({riskTolerance.maxLossPercentage}%)
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={riskTolerance.maxLossPercentage}
              onChange={(e) => setRiskTolerance(prev => ({
                ...prev,
                maxLossPercentage: Number(e.target.value)
              }))}
              className="w-full"
            />
            <div className="text-sm text-gray-600">
              Max loss: {formatCurrency(maxLossDollar)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stop Loss ({riskTolerance.stopLossPercentage}%)
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={riskTolerance.stopLossPercentage}
              onChange={(e) => setRiskTolerance(prev => ({
                ...prev,
                stopLossPercentage: Number(e.target.value)
              }))}
              className="w-full"
            />
            <div className="text-sm text-gray-600">
              Stop at: ${stopLossPrice.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Take Profit ({riskTolerance.takeProfitPercentage}%)
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={riskTolerance.takeProfitPercentage}
              onChange={(e) => setRiskTolerance(prev => ({
                ...prev,
                takeProfitPercentage: Number(e.target.value)
              }))}
              className="w-full"
            />
            <div className="text-sm text-gray-600">
              Target: ${takeProfitPrice.toFixed(2)}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="space-y-3 mt-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current P&L:</span>
                <span className={`font-semibold ${currentPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(currentPnL)}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current ROI:</span>
                <span className={`font-semibold ${currentROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currentROI.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Risk/Reward Ratio:</span>
                <span className="font-semibold text-blue-800">
                  1:{(riskTolerance.takeProfitPercentage / riskTolerance.stopLossPercentage).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit/Loss Chart */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-4">Profit/Loss Scenarios</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={scenarios}
                margin={{
                  top: 10,
                  right: 30,
                  left: 20,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="price"
                  type="number"
                  scale="linear"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <YAxis
                  tickFormatter={(value) => `${value > 0 ? '+' : ''}${(value/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#8884d8"
                  fill="url(#colorPnL)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Risk Warnings */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="font-medium text-yellow-800">Margin Risk</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Using {((marginUsed / (shares * entryPrice)) * 100).toFixed(0)}% margin increases both potential gains and losses.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="font-medium text-red-800">Downside Risk</span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Maximum potential loss: {formatCurrency(Math.abs(scenarios[0].profit))}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center">
            <Target className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium text-green-800">Upside Potential</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Maximum potential gain: {formatCurrency(scenarios[scenarios.length - 1].profit)}
          </p>
        </div>
      </div>
    </div>
  );
} 