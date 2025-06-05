'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calculator, AlertTriangle, Info, TrendingUp, TrendingDown, DollarSign, Percent, Calendar, Target, Shield, Star } from 'lucide-react';
import styles from './MarginCalculator.module.css';

interface MarginCalculatorProps {
  stockPrice: number;
  symbol: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatROI = (roi: number) => {
  if (!isFinite(roi) || isNaN(roi)) {
    return '∞'; // Use infinity symbol instead of "Infinity%"
  }
  if (Math.abs(roi) > 9999) {
    return roi > 0 ? '∞' : '-∞';
  }
  return roi.toFixed(2);
};

interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

const Tooltip = ({ children, content }: TooltipProps) => (
  <div className="group relative inline-block">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
      {content}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const StatCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color = 'blue',
  tooltip 
}: {
  icon: any;
  title: string;
  value: string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  tooltip?: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
  };

  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500'
  };

  const content = (
    <div className={`${styles.statCard} p-4 rounded-xl border-2 ${colorClasses[color]} transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${iconColorClasses[color]}`} />
        {tooltip && <Info className="w-4 h-4 text-gray-400" />}
      </div>
      <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );

  return tooltip ? (
    <Tooltip content={tooltip}>
      {content}
    </Tooltip>
  ) : content;
};

// Robinhood margin rate tiers (as of December 2024)
const getRobinhoodMarginRate = (marginAmount: number): number => {
  if (marginAmount <= 50000) return 5.75;
  if (marginAmount <= 100000) return 5.55;
  if (marginAmount <= 1000000) return 5.25;
  if (marginAmount <= 10000000) return 5.0;
  if (marginAmount <= 50000000) return 4.95;
  return 4.7;
};

export default function MarginCalculator({ stockPrice, symbol }: MarginCalculatorProps) {
  const [investmentAmount, setInvestmentAmount] = useState<number>(10000);
  const [marginRatio, setMarginRatio] = useState<number>(100); // Default to 100% margin
  const [tradeDuration, setTradeDuration] = useState<number>(30);
  const [entryPrice, setEntryPrice] = useState<number>(stockPrice);
  const [exitPrice, setExitPrice] = useState<number>(stockPrice * 1.1);
  const [stopLoss, setStopLoss] = useState<number>(stockPrice * 0.95);
  const [isGoldSubscriber, setIsGoldSubscriber] = useState<boolean>(false);

  // Update entry price when stock price changes
  useEffect(() => {
    setEntryPrice(stockPrice);
    setExitPrice(stockPrice * 1.1);
    setStopLoss(stockPrice * 0.95);
  }, [stockPrice]);

  // Calculations with real Robinhood rates
  const calculations = useCallback(() => {
    const marginUsed = (investmentAmount * marginRatio) / 100;
    const ownCash = investmentAmount - marginUsed;
    const shares = Math.floor(investmentAmount / entryPrice);
    const actualInvestment = shares * entryPrice;
    const actualMarginUsed = Math.min(marginUsed, actualInvestment - ownCash);
    const actualOwnCash = actualInvestment - actualMarginUsed;

    // Calculate margin rate based on Robinhood tiers
    const marginRate = getRobinhoodMarginRate(actualMarginUsed);
    
    // For Gold subscribers, first $1,000 is free
    const chargeableMargin = isGoldSubscriber 
      ? Math.max(0, actualMarginUsed - 1000)
      : actualMarginUsed;
    
    const dailyInterestRate = marginRate / 365 / 100;
    const totalInterest = chargeableMargin * dailyInterestRate * tradeDuration;

    const exitScenario = {
      grossProfit: (exitPrice - entryPrice) * shares,
      netProfit: (exitPrice - entryPrice) * shares - totalInterest,
      roi: actualOwnCash > 0 ? ((exitPrice - entryPrice) * shares - totalInterest) / actualOwnCash * 100 : 0
    };

    const stopLossScenario = {
      grossLoss: (stopLoss - entryPrice) * shares,
      netLoss: (stopLoss - entryPrice) * shares - totalInterest,
      roi: actualOwnCash > 0 ? ((stopLoss - entryPrice) * shares - totalInterest) / actualOwnCash * 100 : 0
    };

    const marginCallPrice = (actualMarginUsed * 1.25) / shares;
    const isMarginCallRisk = marginCallPrice > stopLoss;

    return {
      shares,
      actualOwnCash,
      actualMarginUsed,
      actualInvestment,
      totalInterest,
      exitScenario,
      stopLossScenario,
      marginCallPrice,
      isMarginCallRisk,
      marginRate,
      chargeableMargin,
      goldSavings: isGoldSubscriber ? Math.min(1000, actualMarginUsed) * dailyInterestRate * tradeDuration : 0
    };
  }, [investmentAmount, marginRatio, entryPrice, exitPrice, stopLoss, tradeDuration, isGoldSubscriber]);

  const calc = calculations();

  // Preset scenarios
  const applyPreset = (preset: 'conservative' | 'moderate' | 'aggressive') => {
    switch (preset) {
      case 'conservative':
        setMarginRatio(25);
        setExitPrice(entryPrice * 1.05);
        setStopLoss(entryPrice * 0.98);
        setTradeDuration(14);
        break;
      case 'moderate':
        setMarginRatio(50);
        setExitPrice(entryPrice * 1.1);
        setStopLoss(entryPrice * 0.95);
        setTradeDuration(30);
        break;
      case 'aggressive':
        setMarginRatio(100);
        setExitPrice(entryPrice * 1.2);
        setStopLoss(entryPrice * 0.9);
        setTradeDuration(60);
        break;
    }
  };

  const InputField = ({ 
    label, 
    value, 
    onChange, 
    type = 'number', 
    step = '1', 
    prefix = '', 
    suffix = '',
    tooltip,
    min = 0,
    max,
    showSlider = false,
    sliderStep = 1
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    type?: string;
    step?: string;
    prefix?: string;
    suffix?: string;
    tooltip?: string;
    min?: number;
    max?: number;
    showSlider?: boolean;
    sliderStep?: number;
  }) => {
    const [inputValue, setInputValue] = useState<string>(value.toString());
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Only update local state when not focused (from presets or external changes)
    useEffect(() => {
      if (!isFocused) {
        setInputValue(value.toString());
      }
    }, [value, isFocused]);

    const debouncedOnChange = useCallback((newValue: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (newValue === '') {
          onChange(0);
        } else {
          const numValue = parseFloat(newValue);
          if (!isNaN(numValue)) {
            onChange(numValue);
          }
        }
      }, 300); // 300ms debounce
    }, [onChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      debouncedOnChange(newValue);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseFloat(e.target.value);
      onChange(numValue);
      setInputValue(numValue.toString());
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Immediate update on blur
      if (inputValue === '') {
        onChange(min || 0);
        setInputValue((min || 0).toString());
      } else {
        const numValue = parseFloat(inputValue);
        if (!isNaN(numValue)) {
          const clampedValue = Math.max(min || 0, max ? Math.min(max, numValue) : numValue);
          onChange(clampedValue);
          setInputValue(clampedValue.toString());
        } else {
          setInputValue(value.toString());
        }
      }
    };

    const getSliderMax = () => {
      if (max) return max;
      
      // More realistic price ranges based on typical trading scenarios
      if (label.includes('Entry Price')) {
        return stockPrice * 1.3; // Entry within 30% above current price
      }
      if (label.includes('Target Price')) {
        return Math.max(stockPrice * 1.5, entryPrice * 1.5); // Target up to 50% gain
      }
      if (label.includes('Stop Loss')) {
        return Math.max(stockPrice * 1.1, entryPrice * 1.05); // Stop loss slightly above entry
      }
      if (label.includes('Investment')) return 100000; // For investment, max at $100k
      if (label.includes('Duration')) return 365; // For duration, max at 365 days
      return value * 2 || 1000; // Default fallback
    };

    const getSliderMin = () => {
      if (min !== undefined) return min;
      
      // More realistic minimum ranges for trading
      if (label.includes('Entry Price')) {
        return stockPrice * 0.7; // Entry within 30% below current price
      }
      if (label.includes('Target Price')) {
        return Math.max(stockPrice * 1.02, entryPrice * 1.02); // Target at least 2% gain
      }
      if (label.includes('Stop Loss')) {
        return Math.max(stockPrice * 0.7, entryPrice * 0.8); // Stop loss 20-30% below
      }
      return 0;
    };

    const getSliderStep = () => {
      // Much smaller steps for smooth slider movement
      if (label.includes('Price')) {
        const range = getSliderMax() - getSliderMin();
        return Math.max(0.01, range / 1000); // 1000 steps across the range
      }
      if (label.includes('Investment')) {
        const range = getSliderMax() - getSliderMin();
        return Math.max(10, range / 500); // 500 steps for investment
      }
      if (label.includes('Duration')) return 1; // Duration in day increments
      return sliderStep;
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-semibold text-gray-700">{label}</label>
            {tooltip && (
              <Tooltip content={tooltip}>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </Tooltip>
            )}
          </div>
          {showSlider && (
            <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
              {prefix}{formatNumber(value)}{suffix}
            </div>
          )}
        </div>
        
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium z-10">
              {prefix}
            </span>
          )}
          <input
            type="text"
            inputMode="decimal"
            step={step}
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`${styles.inputField} w-full py-3 px-4 ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm font-medium`}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium z-10">
              {suffix}
            </span>
          )}
        </div>

        {showSlider && (
          <div className="space-y-2">
            <input
              type="range"
              min={getSliderMin()}
              max={getSliderMax()}
              step={getSliderStep()}
              value={Math.max(getSliderMin(), Math.min(getSliderMax(), value))}
              onChange={handleSliderChange}
              className={`${styles.slider} w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer`}
              style={{
                background: `linear-gradient(to right, 
                  rgb(59 130 246) 0%, 
                  rgb(59 130 246) ${((Math.max(getSliderMin(), Math.min(getSliderMax(), value)) - getSliderMin()) / (getSliderMax() - getSliderMin())) * 100}%, 
                  #E5E7EB ${((Math.max(getSliderMin(), Math.min(getSliderMax(), value)) - getSliderMin()) / (getSliderMax() - getSliderMin())) * 100}%, 
                  #E5E7EB 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">{prefix}{formatNumber(getSliderMin())}{suffix}</span>
              <span className="bg-gray-100 px-2 py-1 rounded">{prefix}{formatNumber(getSliderMax())}{suffix}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-card border border-white/20 overflow-hidden hover:shadow-card-hover transition-all duration-300">
      {/* Enhanced Header with modern gradient */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
              <Calculator className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-1">Margin Calculator</h3>
              <p className="text-blue-100 text-sm font-medium">
                Real-time rates for <span className="font-bold text-white">{symbol}</span> • Updated Dec 2024
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-100">Live market data</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100 mb-1">Current Stock Price</div>
            <div className="text-3xl font-bold mb-1">{formatCurrency(stockPrice)}</div>
            <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <span className="text-xs font-medium">Live Quote</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Presets */}
      <div className="p-8 bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-xl font-bold text-gray-800 mb-1">Quick Scenarios</h4>
            <p className="text-sm text-gray-600">Choose a preset trading strategy to get started</p>
          </div>
          <div className="text-xs text-gray-500 bg-white/60 px-3 py-1 rounded-full">
            Click to apply preset
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => applyPreset('conservative')}
            className={`${styles.presetButton} p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl hover:border-green-300 transition-all duration-300 group hover:scale-105`}
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-800 mb-1">Conservative</div>
            <div className="text-sm text-green-600 mb-2">Low risk, steady returns</div>
            <div className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded-full">
              25% margin • 5% target
            </div>
          </button>
          <button
            onClick={() => applyPreset('moderate')}
            className={`${styles.presetButton} p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl hover:border-blue-300 transition-all duration-300 group hover:scale-105`}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-800 mb-1">Moderate</div>
            <div className="text-sm text-blue-600 mb-2">Balanced risk & reward</div>
            <div className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded-full">
              50% margin • 10% target
            </div>
          </button>
          <button
            onClick={() => applyPreset('aggressive')}
            className={`${styles.presetButton} p-6 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl hover:border-red-300 transition-all duration-300 group hover:scale-105`}
          >
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-red-200 transition-colors">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-lg font-bold text-red-800 mb-1">Aggressive</div>
            <div className="text-sm text-red-600 mb-2">High risk, high reward</div>
            <div className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded-full">
              100% margin • 20% target
            </div>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="xl:col-span-1 space-y-6">
            <h4 className="text-lg font-bold text-gray-800">Trade Parameters</h4>
            
            <InputField
              label="Total Investment"
              value={investmentAmount}
              onChange={setInvestmentAmount}
              prefix="$"
              tooltip="Total amount you want to invest including margin"
              min={1000}
              max={100000}
              showSlider={true}
              sliderStep={500}
            />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Margin Usage</label>
                <span className="text-sm font-bold text-green-600">{marginRatio}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={marginRatio}
                onChange={(e) => setMarginRatio(Number(e.target.value))}
                className={`${styles.slider} w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer`}
                style={{
                  background: `linear-gradient(to right, #10B981 0%, #10B981 ${marginRatio}%, #E5E7EB ${marginRatio}%, #E5E7EB 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Cash Only</span>
                <span>Max Margin</span>
              </div>
            </div>

            <InputField
              label="Entry Price"
              value={entryPrice}
              onChange={setEntryPrice}
              prefix="$"
              step="0.01"
              tooltip="Price at which you plan to buy"
              min={0.01}
              showSlider={true}
              sliderStep={0.01}
            />

            <InputField
              label="Target Price"
              value={exitPrice}
              onChange={setExitPrice}
              prefix="$"
              step="0.01"
              tooltip="Your target sell price"
              min={0.01}
              showSlider={true}
              sliderStep={0.01}
            />

            <InputField
              label="Stop Loss"
              value={stopLoss}
              onChange={setStopLoss}
              prefix="$"
              step="0.01"
              tooltip="Price at which you'll cut losses"
              min={0.01}
              showSlider={true}
              sliderStep={0.01}
            />

            <InputField
              label="Trade Duration"
              value={tradeDuration}
              onChange={setTradeDuration}
              suffix="days"
              tooltip="How long you plan to hold the position"
              min={1}
              max={365}
              showSlider={true}
              sliderStep={1}
            />

            {/* Robinhood Gold Toggle */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <div>
                    <div className="font-semibold text-yellow-800">Robinhood Gold</div>
                    <div className="text-xs text-yellow-600">First $1,000 margin free</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsGoldSubscriber(!isGoldSubscriber)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isGoldSubscriber ? 'bg-yellow-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isGoldSubscriber ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {isGoldSubscriber && (
                <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded-lg">
                  💰 You're saving {formatCurrency(calc.goldSavings)} in interest charges
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="xl:col-span-2">
            {/* Current Margin Rate Display */}
            <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">Current Margin Rate</h4>
                  <p className="text-sm text-gray-600">Based on {formatCurrency(calc.actualMarginUsed)} borrowed</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{calc.marginRate}%</div>
                  <div className="text-xs text-gray-500">Annual rate</div>
                </div>
              </div>
              {isGoldSubscriber && (
                <div className="mt-2 text-xs text-green-700">
                  Only charging interest on {formatCurrency(calc.chargeableMargin)} (Gold benefit applied)
                </div>
              )}
            </div>

            {/* Position Overview */}
            <div className="mb-8">
              <h4 className="text-lg font-bold text-gray-800 mb-4">Position Overview</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={DollarSign}
                  title="Shares"
                  value={formatNumber(calc.shares)}
                  color="blue"
                  tooltip="Number of shares you can purchase"
                />
                <StatCard
                  icon={DollarSign}
                  title="Your Cash"
                  value={formatCurrency(calc.actualOwnCash)}
                  color="green"
                  tooltip="Your own money invested"
                />
                <StatCard
                  icon={DollarSign}
                  title="Margin Used"
                  value={formatCurrency(calc.actualMarginUsed)}
                  color="yellow"
                  tooltip="Borrowed money from Robinhood"
                />
                <StatCard
                  icon={Calendar}
                  title="Interest Cost"
                  value={formatCurrency(calc.totalInterest)}
                  subtitle={`${tradeDuration} days @ ${calc.marginRate}%`}
                  color="purple"
                  tooltip="Total interest you'll pay on margin loan"
                />
              </div>
            </div>

            {/* Scenarios */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Profit Scenario */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <h5 className="text-lg font-bold text-green-800">Target Scenario</h5>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-600">Target Price</div>
                    <div className="font-bold text-green-800">{formatCurrency(exitPrice)}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Net Profit:</span>
                    <span className="text-xl font-bold text-green-800">
                      {formatCurrency(calc.exitScenario.netProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Return on Investment:</span>
                    <span className="text-xl font-bold text-green-800">
                      {formatROI(calc.exitScenario.roi)}%
                    </span>
                  </div>
                  <div className="text-xs text-green-600 bg-green-100 p-2 rounded-lg">
                    Gross profit: {formatCurrency(calc.exitScenario.grossProfit)} - Interest: {formatCurrency(calc.totalInterest)}
                  </div>
                </div>
              </div>

              {/* Loss Scenario */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                    <h5 className="text-lg font-bold text-red-800">Stop Loss Scenario</h5>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-red-600">Stop Loss</div>
                    <div className="font-bold text-red-800">{formatCurrency(stopLoss)}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-red-700">Net Loss:</span>
                    <span className="text-xl font-bold text-red-800">
                      {formatCurrency(calc.stopLossScenario.netLoss)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-red-700">Loss Percentage:</span>
                    <span className="text-xl font-bold text-red-800">
                      {formatROI(calc.stopLossScenario.roi)}%
                    </span>
                  </div>
                  <div className="text-xs text-red-600 bg-red-100 p-2 rounded-lg">
                    Gross loss: {formatCurrency(calc.stopLossScenario.grossLoss)} - Interest: {formatCurrency(calc.totalInterest)}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Warning */}
            {calc.isMarginCallRisk && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h5 className="font-bold text-yellow-800 mb-2">⚠️ Margin Call Risk Detected</h5>
                    <p className="text-yellow-700 mb-3">
                      Robinhood may issue a margin call if the stock drops to{' '}
                      <span className="font-bold">{formatCurrency(calc.marginCallPrice)}</span> per share.
                    </p>
                    <div className="bg-yellow-100 p-3 rounded-lg text-sm text-yellow-800">
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Consider raising your stop loss above {formatCurrency(calc.marginCallPrice)}</li>
                        <li>Reduce margin usage to lower risk</li>
                        <li>Keep additional cash available for margin calls</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Margin Rate Disclaimer */}
            <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Source:</strong> <a href="https://robinhood.com/us/en/support/articles/margin-rates/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Robinhood Margin Rates</a> • Rates current as of December 2024 and subject to change • 
              Interest calculated daily on settled margin balances • Margin investing involves risk
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 