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
      roi: ((exitPrice - entryPrice) * shares - totalInterest) / actualOwnCash * 100
    };

    const stopLossScenario = {
      grossLoss: (stopLoss - entryPrice) * shares,
      netLoss: (stopLoss - entryPrice) * shares - totalInterest,
      roi: ((stopLoss - entryPrice) * shares - totalInterest) / actualOwnCash * 100
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
    min,
    max
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
        onChange(0);
        setInputValue('0');
      } else {
        const numValue = parseFloat(inputValue);
        if (!isNaN(numValue)) {
          onChange(numValue);
          setInputValue(numValue.toString());
        } else {
          setInputValue(value.toString());
        }
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-semibold text-gray-700">{label}</label>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </Tooltip>
          )}
        </div>
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
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
            className={`${styles.inputField} w-full py-3 px-4 ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-sm font-medium`}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Robinhood Margin Calculator</h3>
              <p className="text-green-100 text-sm">Real-time margin rates for {symbol} • Rates as of Dec 2024</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-100">Current Price</div>
            <div className="text-2xl font-bold">{formatCurrency(stockPrice)}</div>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="p-6 bg-gray-50 border-b">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800">Quick Scenarios</h4>
          <div className="text-xs text-gray-500">Click to apply preset</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => applyPreset('conservative')}
            className={`${styles.presetButton} p-3 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 transition-colors duration-200 group`}
          >
            <Shield className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-sm font-semibold text-green-700">Conservative</div>
            <div className="text-xs text-green-600">25% margin, 5% target</div>
          </button>
          <button
            onClick={() => applyPreset('moderate')}
            className={`${styles.presetButton} p-3 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors duration-200 group`}
          >
            <Target className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-semibold text-blue-700">Moderate</div>
            <div className="text-xs text-blue-600">50% margin, 10% target</div>
          </button>
          <button
            onClick={() => applyPreset('aggressive')}
            className={`${styles.presetButton} p-3 bg-red-50 border-2 border-red-200 rounded-xl hover:bg-red-100 transition-colors duration-200 group`}
          >
            <TrendingUp className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <div className="text-sm font-semibold text-red-700">Aggressive</div>
            <div className="text-xs text-red-600">100% margin, 20% target</div>
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
            />

            <InputField
              label="Target Price"
              value={exitPrice}
              onChange={setExitPrice}
              prefix="$"
              step="0.01"
              tooltip="Your target sell price"
            />

            <InputField
              label="Stop Loss"
              value={stopLoss}
              onChange={setStopLoss}
              prefix="$"
              step="0.01"
              tooltip="Price at which you'll cut losses"
            />

            <InputField
              label="Trade Duration"
              value={tradeDuration}
              onChange={setTradeDuration}
              suffix="days"
              tooltip="How long you plan to hold the position"
              min={1}
              max={365}
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
                      {calc.exitScenario.roi.toFixed(2)}%
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
                      {calc.stopLossScenario.roi.toFixed(2)}%
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