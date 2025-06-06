import { 
  AlertConfiguration, 
  TriggeredAlert, 
  AlertType, 
  AlertSeverity,
  MarketConditions,
  EconomicIndicators,
  AlertCondition
} from '../types/alerts';
import { StockQuote, TrackingEntry } from '../types/stock';

const ALERTS_STORAGE_KEY = 'trade-risk-alerts';
const TRIGGERED_ALERTS_STORAGE_KEY = 'trade-risk-triggered-alerts';

export class AlertEngine {
  private alerts: AlertConfiguration[] = [];
  private triggeredAlerts: TriggeredAlert[] = [];
  private marketData: Map<string, StockQuote> = new Map();
  private marketConditions: MarketConditions | null = null;
  private economicIndicators: EconomicIndicators | null = null;

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultAlerts();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const storedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (storedAlerts) {
        this.alerts = JSON.parse(storedAlerts);
      }
      
      const storedTriggeredAlerts = localStorage.getItem(TRIGGERED_ALERTS_STORAGE_KEY);
      if (storedTriggeredAlerts) {
        this.triggeredAlerts = JSON.parse(storedTriggeredAlerts);
      }
    } catch (error) {
      console.error('Error loading alerts from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(this.alerts));
      localStorage.setItem(TRIGGERED_ALERTS_STORAGE_KEY, JSON.stringify(this.triggeredAlerts));
    } catch (error) {
      console.error('Error saving alerts to storage:', error);
    }
  }

  // Add alert configuration
  addAlert(alert: AlertConfiguration): void {
    this.alerts.push(alert);
    this.saveToStorage();
    console.log('Alert added:', alert.name, '- Total alerts:', this.alerts.length);
  }

  // Remove alert
  removeAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    this.saveToStorage();
  }

  updateAlert(alertId: string, updates: Partial<AlertConfiguration>): boolean {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      this.alerts[alertIndex] = { ...this.alerts[alertIndex], ...updates };
      this.saveToStorage();
      return true;
    }
    return false;
  }

  // Update market data
  updateMarketData(symbol: string, quote: StockQuote): void {
    this.marketData.set(symbol, quote);
  }

  // Update market conditions
  updateMarketConditions(conditions: MarketConditions): void {
    this.marketConditions = conditions;
  }

  // Main evaluation function
  async evaluateAlerts(positions: TrackingEntry[]): Promise<TriggeredAlert[]> {
    const newAlerts: TriggeredAlert[] = [];
    const enabledAlerts = this.alerts.filter(a => a.enabled);
    
    console.log(`Evaluating ${enabledAlerts.length} enabled alerts against ${positions.length} positions`);

    for (const alert of enabledAlerts) {
      try {
        const triggered = await this.evaluateAlert(alert, positions);
        if (triggered) {
          console.log(`Alert triggered: ${alert.name} for ${triggered.symbol || 'portfolio'}`);
          newAlerts.push(triggered);
        }
      } catch (error) {
        console.error(`Error evaluating alert ${alert.id}:`, error);
      }
    }

    if (newAlerts.length > 0) {
      this.triggeredAlerts.push(...newAlerts);
      this.saveToStorage();
      console.log(`${newAlerts.length} new alerts triggered. Total triggered alerts: ${this.triggeredAlerts.length}`);
    }
    
    return newAlerts;
  }

  private async evaluateAlert(alert: AlertConfiguration, positions: TrackingEntry[]): Promise<TriggeredAlert | null> {
    const relevantPositions = alert.symbol 
      ? positions.filter(p => p.symbol === alert.symbol)
      : positions;

    switch (alert.type) {
      // PROFIT-TAKING ALERTS
      case 'percentage_gain':
        return this.evaluatePercentageGain(alert, relevantPositions);
      case 'dollar_profit':
        return this.evaluateDollarProfit(alert, relevantPositions);
      case 'risk_reward_ratio':
        return this.evaluateRiskRewardRatio(alert, relevantPositions);
      case 'price_target':
        return this.evaluatePriceTarget(alert, relevantPositions);
      case 'resistance_breach':
        return this.evaluateResistanceBreach(alert, relevantPositions);
      case 'round_number':
        return this.evaluateRoundNumber(alert, relevantPositions);
      case 'trailing_stop':
        return this.evaluateTrailingStop(alert, relevantPositions);
      case 'fibonacci_profit':
        return this.evaluateFibonacciProfit(alert, relevantPositions);
      case 'ma_profit':
        return this.evaluateMAProfit(alert, relevantPositions);

      // STOP-LOSS ALERTS
      case 'percentage_loss':
        return this.evaluatePercentageLoss(alert, relevantPositions);
      case 'dollar_loss':
        return this.evaluateDollarLoss(alert, relevantPositions);
      case 'atr_stop':
        return this.evaluateATRStop(alert, relevantPositions);
      case 'support_break':
        return this.evaluateSupportBreak(alert, relevantPositions);
      case 'ma_stop':
        return this.evaluateMAStop(alert, relevantPositions);

      // RISK MANAGEMENT ALERTS
      case 'position_size_risk':
        return this.evaluatePositionSizeRisk(alert, relevantPositions);
      case 'portfolio_heat':
        return this.evaluatePortfolioHeat(alert, positions);
      case 'margin_call_risk':
        return this.evaluateMarginCallRisk(alert, relevantPositions);
      case 'correlation_risk':
        return this.evaluateCorrelationRisk(alert, positions);
      case 'sector_concentration':
        return this.evaluateSectorConcentration(alert, positions);

      // TIME-BASED ALERTS
      case 'holding_period':
        return this.evaluateHoldingPeriod(alert, relevantPositions);
      case 'end_of_day':
        return this.evaluateEndOfDay(alert, relevantPositions);
      case 'max_hold_time':
        return this.evaluateMaxHoldTime(alert, relevantPositions);
      case 'weekend_risk':
        return this.evaluateWeekendRisk(alert, relevantPositions);
      case 'earnings_date':
        return this.evaluateEarningsDate(alert, relevantPositions);

      // TECHNICAL INDICATOR ALERTS
      case 'rsi_overbought':
      case 'rsi_oversold':
        return this.evaluateRSI(alert, relevantPositions);
      case 'macd_cross':
        return this.evaluateMACDCross(alert, relevantPositions);
      case 'ma_cross':
        return this.evaluateMAcross(alert, relevantPositions);
      case 'bollinger_signal':
        return this.evaluateBollingerBands(alert, relevantPositions);

      // VOLUME ALERTS
      case 'volume_spike':
        return this.evaluateVolumeSpike(alert, relevantPositions);
      case 'volume_dryup':
        return this.evaluateVolumeDryup(alert, relevantPositions);

      // MARKET CONDITION ALERTS
      case 'vix_spike':
        return this.evaluateVIXSpike(alert);
      case 'volatility_expansion':
        return this.evaluateVolatilityExpansion(alert);
      case 'market_regime_change':
        return this.evaluateMarketRegimeChange(alert);

      // ADVANCED RISK ALERTS
      case 'max_drawdown':
        return this.evaluateMaxDrawdown(alert, positions);
      case 'portfolio_correlation':
        return this.evaluatePortfolioCorrelation(alert, positions);

      default:
        return null;
    }
  }

  // PROFIT-TAKING ALERT IMPLEMENTATIONS
  private evaluatePercentageGain(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const threshold = this.getConditionValue(alert.conditions, 'percentage_gain') as number;
    
    console.log(`Evaluating percentage gain alert: threshold=${threshold}%, positions=${positions.length}`);
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') {
        console.log(`Skipping position ${position.symbol}: currentPrice=${position.currentPrice}, status=${position.status}`);
        continue;
      }
      
      const gainPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
      console.log(`Position ${position.symbol}: entry=${position.entryPrice}, current=${position.currentPrice}, gain=${gainPercent.toFixed(2)}%`);
      
      if (gainPercent >= threshold) {
        console.log(`🎯 Alert triggered for ${position.symbol}: ${gainPercent.toFixed(2)}% >= ${threshold}%`);
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `${threshold}% Profit Target Reached`,
          message: `${position.symbol} has gained ${gainPercent.toFixed(2)}% (Target: ${threshold}%)`,
          currentValue: gainPercent,
          targetValue: threshold,
          metadata: {
            entryPrice: position.entryPrice,
            currentPrice: position.currentPrice,
            profitAmount: (position.currentPrice - position.entryPrice) * position.shares
          }
        });
      }
    }
    return null;
  }

  private evaluateDollarProfit(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const threshold = this.getConditionValue(alert.conditions, 'dollar_profit') as number;
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      const profitAmount = (position.currentPrice - position.entryPrice) * position.shares;
      
      if (profitAmount >= threshold) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `$${threshold} Profit Target Reached`,
          message: `${position.symbol} profit: $${profitAmount.toFixed(2)} (Target: $${threshold})`,
          currentValue: profitAmount,
          targetValue: threshold,
          metadata: {
            entryPrice: position.entryPrice,
            currentPrice: position.currentPrice,
            shares: position.shares
          }
        });
      }
    }
    return null;
  }

  private evaluateRiskRewardRatio(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const targetRatio = this.getConditionValue(alert.conditions, 'risk_reward_ratio') as number;
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      const potentialProfit = position.currentPrice - position.entryPrice;
      const potentialLoss = position.entryPrice - position.stopLoss;
      const currentRatio = potentialProfit / potentialLoss;
      
      if (currentRatio >= targetRatio) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `${targetRatio}:1 Risk-Reward Ratio Achieved`,
          message: `${position.symbol} R:R ratio: ${currentRatio.toFixed(2)}:1`,
          currentValue: currentRatio,
          targetValue: targetRatio
        });
      }
    }
    return null;
  }

  private evaluatePriceTarget(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const targetPrice = this.getConditionValue(alert.conditions, 'price_target') as number;
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      if (position.currentPrice >= targetPrice) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Price Target Reached`,
          message: `${position.symbol} reached $${position.currentPrice} (Target: $${targetPrice})`,
          currentValue: position.currentPrice,
          targetValue: targetPrice
        });
      }
    }
    return null;
  }

  // STOP-LOSS ALERT IMPLEMENTATIONS
  private evaluatePercentageLoss(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const threshold = this.getConditionValue(alert.conditions, 'percentage_loss') as number;
    
    console.log(`Evaluating percentage loss alert: threshold=${threshold}%, positions=${positions.length}`);
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') {
        console.log(`Skipping position ${position.symbol}: currentPrice=${position.currentPrice}, status=${position.status}`);
        continue;
      }
      
      const lossPercent = ((position.entryPrice - position.currentPrice) / position.entryPrice) * 100;
      console.log(`Position ${position.symbol}: entry=${position.entryPrice}, current=${position.currentPrice}, loss=${lossPercent.toFixed(2)}%`);
      
      if (lossPercent >= Math.abs(threshold)) {
        console.log(`🚨 Stop loss triggered for ${position.symbol}: ${lossPercent.toFixed(2)}% >= ${Math.abs(threshold)}%`);
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `${Math.abs(threshold)}% Stop Loss Triggered`,
          message: `${position.symbol} down ${lossPercent.toFixed(2)}% from entry`,
          currentValue: lossPercent,
          targetValue: Math.abs(threshold),
          severity: 'high'
        });
      }
    }
    return null;
  }

  private evaluateDollarLoss(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const threshold = this.getConditionValue(alert.conditions, 'dollar_loss') as number;
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      const lossAmount = (position.entryPrice - position.currentPrice) * position.shares;
      
      if (lossAmount >= Math.abs(threshold)) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `$${Math.abs(threshold)} Stop Loss Triggered`,
          message: `${position.symbol} loss: $${lossAmount.toFixed(2)}`,
          currentValue: lossAmount,
          targetValue: Math.abs(threshold),
          severity: 'high'
        });
      }
    }
    return null;
  }

  // RISK MANAGEMENT ALERT IMPLEMENTATIONS
  private evaluatePortfolioHeat(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const maxHeatPercent = this.getConditionValue(alert.conditions, 'portfolio_heat') as number;
    
    const totalValue = positions.reduce((sum, pos) => {
      return sum + (pos.currentPrice || pos.entryPrice) * pos.shares;
    }, 0);
    
    const totalRisk = positions.reduce((sum, pos) => {
      if (!pos.currentPrice) return sum;
      const positionRisk = Math.max(0, (pos.entryPrice - pos.stopLoss) * pos.shares);
      return sum + positionRisk;
    }, 0);
    
    const heatPercent = (totalRisk / totalValue) * 100;
    
    if (heatPercent > maxHeatPercent) {
      return this.createTriggeredAlert(alert, undefined, {
        title: `Portfolio Heat Warning`,
        message: `Portfolio risk at ${heatPercent.toFixed(2)}% (Max: ${maxHeatPercent}%)`,
        currentValue: heatPercent,
        targetValue: maxHeatPercent,
        severity: 'high'
      });
    }
    return null;
  }

  private evaluateMarginCallRisk(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const riskThreshold = this.getConditionValue(alert.conditions, 'margin_risk') as number || 25;
    
    for (const position of positions) {
      if (!position.currentPrice || position.marginUsed === 0) continue;
      
      const currentValue = position.currentPrice * position.shares;
      const marginEquity = currentValue - position.marginUsed;
      const marginPercent = (marginEquity / currentValue) * 100;
      
      if (marginPercent <= riskThreshold) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Margin Call Risk`,
          message: `${position.symbol} margin equity at ${marginPercent.toFixed(2)}%`,
          currentValue: marginPercent,
          targetValue: riskThreshold,
          severity: 'critical'
        });
      }
    }
    return null;
  }

  // TIME-BASED ALERT IMPLEMENTATIONS
  private evaluateHoldingPeriod(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const targetDays = this.getConditionValue(alert.conditions, 'holding_days') as number;
    
    for (const position of positions) {
      if (position.status !== 'active') continue;
      
      const holdingDays = Math.floor((Date.now() - new Date(position.entryDate).getTime()) / (1000 * 60 * 60 * 24));
      
      if (holdingDays >= targetDays) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Holding Period Review`,
          message: `${position.symbol} held for ${holdingDays} days`,
          currentValue: holdingDays,
          targetValue: targetDays
        });
      }
    }
    return null;
  }

  private evaluateEndOfDay(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const now = new Date();
    const marketClose = new Date();
    marketClose.setHours(16, 0, 0, 0); // 4 PM ET
    
    const minutesToClose = (marketClose.getTime() - now.getTime()) / (1000 * 60);
    
    if (minutesToClose <= 30 && minutesToClose > 0) {
      const activePositions = positions.filter(p => p.status === 'active');
      
      if (activePositions.length > 0) {
        return this.createTriggeredAlert(alert, undefined, {
          title: `End of Day Position Review`,
          message: `Market closes in ${Math.round(minutesToClose)} minutes. ${activePositions.length} active positions.`,
          currentValue: minutesToClose,
          targetValue: 30
        });
      }
    }
    return null;
  }

  // TECHNICAL INDICATOR IMPLEMENTATIONS
  private async evaluateRSI(alert: AlertConfiguration, positions: TrackingEntry[]): Promise<TriggeredAlert | null> {
    const threshold = alert.type === 'rsi_overbought' ? 70 : 30;
    
    for (const position of positions) {
      const rsi = await this.calculateRSI(position.symbol, 14);
      
      if (alert.type === 'rsi_overbought' && rsi >= threshold) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `RSI Overbought`,
          message: `${position.symbol} RSI: ${rsi.toFixed(2)} (Overbought at ${threshold})`,
          currentValue: rsi,
          targetValue: threshold
        });
      } else if (alert.type === 'rsi_oversold' && rsi <= threshold) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `RSI Oversold`,
          message: `${position.symbol} RSI: ${rsi.toFixed(2)} (Oversold at ${threshold})`,
          currentValue: rsi,
          targetValue: threshold
        });
      }
    }
    return null;
  }

  private evaluateVolumeSpike(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const spikeMultiplier = this.getConditionValue(alert.conditions, 'volume_multiplier') as number || 2;
    
    for (const position of positions) {
      const quote = this.marketData.get(position.symbol);
      if (!quote) continue;
      
      const volumeRatio = quote.regularMarketVolume / quote.averageVolume;
      
      if (volumeRatio >= spikeMultiplier) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Volume Spike Alert`,
          message: `${position.symbol} volume ${volumeRatio.toFixed(1)}x average`,
          currentValue: volumeRatio,
          targetValue: spikeMultiplier
        });
      }
    }
    return null;
  }

  // MARKET CONDITION IMPLEMENTATIONS
  private evaluateVIXSpike(alert: AlertConfiguration): TriggeredAlert | null {
    if (!this.marketConditions) return null;
    
    const vixThreshold = this.getConditionValue(alert.conditions, 'vix_threshold') as number || 25;
    
    if (this.marketConditions.vix >= vixThreshold) {
      return this.createTriggeredAlert(alert, 'VIX', {
        title: `VIX Spike Alert`,
        message: `VIX at ${this.marketConditions.vix.toFixed(2)} (Threshold: ${vixThreshold})`,
        currentValue: this.marketConditions.vix,
        targetValue: vixThreshold,
        severity: 'high'
      });
    }
    return null;
  }

  private evaluateMaxDrawdown(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const maxDrawdownPercent = this.getConditionValue(alert.conditions, 'max_drawdown') as number || 10;
    
    const totalCurrentValue = positions.reduce((sum, pos) => {
      return sum + (pos.currentPrice || pos.entryPrice) * pos.shares;
    }, 0);
    
    const totalCost = positions.reduce((sum, pos) => sum + pos.entryPrice * pos.shares, 0);
    const drawdownPercent = ((totalCost - totalCurrentValue) / totalCost) * 100;
    
    if (drawdownPercent >= maxDrawdownPercent) {
      return this.createTriggeredAlert(alert, undefined, {
        title: `Maximum Drawdown Alert`,
        message: `Portfolio drawdown: ${drawdownPercent.toFixed(2)}% (Max: ${maxDrawdownPercent}%)`,
        currentValue: drawdownPercent,
        targetValue: maxDrawdownPercent,
        severity: 'critical'
      });
    }
    return null;
  }

  // Additional missing method implementations
  private evaluateResistanceBreach(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const resistanceLevel = this.getConditionValue(alert.conditions, 'resistance_level') as number;
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      if (position.currentPrice >= resistanceLevel) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Resistance Level Breached`,
          message: `${position.symbol} broke resistance at $${resistanceLevel}`,
          currentValue: position.currentPrice,
          targetValue: resistanceLevel
        });
      }
    }
    return null;
  }

  private evaluateRoundNumber(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      const roundNumbers = [50, 100, 150, 200, 250, 300, 500, 1000];
      const nearestRound = roundNumbers.find(num => 
        Math.abs(position.currentPrice! - num) / num < 0.02 // Within 2%
      );
      
      if (nearestRound) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Round Number Alert`,
          message: `${position.symbol} approaching round number $${nearestRound}`,
          currentValue: position.currentPrice,
          targetValue: nearestRound
        });
      }
    }
    return null;
  }

  private evaluateTrailingStop(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const trailPercent = this.getConditionValue(alert.conditions, 'trail_percent') as number || 5;
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      // Calculate trailing stop (simplified)
      const highestPrice = Math.max(position.entryPrice, position.currentPrice);
      const trailStopLevel = highestPrice * (1 - trailPercent / 100);
      
      if (position.currentPrice <= trailStopLevel) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Trailing Stop Triggered`,
          message: `${position.symbol} hit trailing stop at $${trailStopLevel.toFixed(2)}`,
          currentValue: position.currentPrice,
          targetValue: trailStopLevel,
          severity: 'high'
        });
      }
    }
    return null;
  }

  private evaluateFibonacciProfit(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const fibLevel = this.getConditionValue(alert.conditions, 'fib_level') as number || 61.8;
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      // Simplified fibonacci calculation
      const priceRange = Math.abs(position.entryPrice - position.stopLoss);
      const fibTarget = position.entryPrice + (priceRange * fibLevel / 100);
      
      if (position.currentPrice >= fibTarget) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Fibonacci Level Reached`,
          message: `${position.symbol} hit ${fibLevel}% fib level at $${fibTarget.toFixed(2)}`,
          currentValue: position.currentPrice,
          targetValue: fibTarget
        });
      }
    }
    return null;
  }

  private evaluateMAProfit(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const maPeriod = this.getConditionValue(alert.conditions, 'ma_period') as number || 20;
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      // Simplified MA calculation (would need historical data in real implementation)
      const estimatedMA = position.entryPrice * 1.02; // Placeholder
      
      if (position.currentPrice <= estimatedMA) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Moving Average Profit Signal`,
          message: `${position.symbol} below ${maPeriod}-period MA`,
          currentValue: position.currentPrice,
          targetValue: estimatedMA
        });
      }
    }
    return null;
  }

  private evaluateATRStop(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const atrMultiplier = this.getConditionValue(alert.conditions, 'atr_multiplier') as number || 2;
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      // Simplified ATR calculation (would need historical data)
      const estimatedATR = position.entryPrice * 0.02; // 2% as placeholder
      const atrStopLevel = position.entryPrice - (estimatedATR * atrMultiplier);
      
      if (position.currentPrice <= atrStopLevel) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `ATR Stop Loss Triggered`,
          message: `${position.symbol} hit ATR stop at $${atrStopLevel.toFixed(2)}`,
          currentValue: position.currentPrice,
          targetValue: atrStopLevel,
          severity: 'high'
        });
      }
    }
    return null;
  }

  private evaluateSupportBreak(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const supportLevel = this.getConditionValue(alert.conditions, 'support_level') as number;
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      if (position.currentPrice <= supportLevel) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Support Level Broken`,
          message: `${position.symbol} broke support at $${supportLevel}`,
          currentValue: position.currentPrice,
          targetValue: supportLevel,
          severity: 'high'
        });
      }
    }
    return null;
  }

  private evaluateMAStop(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const maPeriod = this.getConditionValue(alert.conditions, 'ma_period') as number || 20;
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      // Simplified MA calculation
      const estimatedMA = position.entryPrice * 0.98; // Placeholder
      
      if (position.currentPrice <= estimatedMA) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `MA Stop Loss Triggered`,
          message: `${position.symbol} below ${maPeriod}-period MA stop`,
          currentValue: position.currentPrice,
          targetValue: estimatedMA,
          severity: 'high'
        });
      }
    }
    return null;
  }

  private evaluatePositionSizeRisk(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const maxPositionPercent = this.getConditionValue(alert.conditions, 'max_position_percent') as number || 10;
    
    const totalPortfolioValue = positions.reduce((sum, pos) => {
      return sum + (pos.currentPrice || pos.entryPrice) * pos.shares;
    }, 0);
    
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      const positionValue = position.currentPrice * position.shares;
      const positionPercent = (positionValue / totalPortfolioValue) * 100;
      
      if (positionPercent > maxPositionPercent) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Position Size Risk`,
          message: `${position.symbol} is ${positionPercent.toFixed(1)}% of portfolio (Max: ${maxPositionPercent}%)`,
          currentValue: positionPercent,
          targetValue: maxPositionPercent,
          severity: 'medium'
        });
      }
    }
    return null;
  }

  private evaluateCorrelationRisk(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const maxCorrelation = this.getConditionValue(alert.conditions, 'max_correlation') as number || 0.7;
    
    // Simplified correlation check (would need real correlation matrix)
    const sectors = positions.map(p => p.symbol.substring(0, 2)); // Simplified sector grouping
    const sectorCounts = sectors.reduce((acc, sector) => {
      acc[sector] = (acc[sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const maxSectorCount = Math.max(...Object.values(sectorCounts));
    const correlationRisk = maxSectorCount / positions.length;
    
    if (correlationRisk > maxCorrelation) {
      return this.createTriggeredAlert(alert, undefined, {
        title: `High Correlation Risk`,
        message: `Portfolio correlation risk at ${(correlationRisk * 100).toFixed(1)}%`,
        currentValue: correlationRisk,
        targetValue: maxCorrelation,
        severity: 'medium'
      });
    }
    return null;
  }

  private evaluateSectorConcentration(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const maxSectorPercent = this.getConditionValue(alert.conditions, 'max_sector_percent') as number || 30;
    
    // Simplified sector analysis
    const totalValue = positions.reduce((sum, pos) => sum + (pos.currentPrice || pos.entryPrice) * pos.shares, 0);
    const sectors = {} as Record<string, number>;
    
    positions.forEach(pos => {
      const sector = pos.symbol.substring(0, 2); // Simplified
      const value = (pos.currentPrice || pos.entryPrice) * pos.shares;
      sectors[sector] = (sectors[sector] || 0) + value;
    });
    
    for (const [sector, value] of Object.entries(sectors)) {
      const sectorPercent = (value / totalValue) * 100;
      if (sectorPercent > maxSectorPercent) {
        return this.createTriggeredAlert(alert, undefined, {
          title: `Sector Concentration Warning`,
          message: `${sector} sector at ${sectorPercent.toFixed(1)}% of portfolio`,
          currentValue: sectorPercent,
          targetValue: maxSectorPercent,
          severity: 'medium'
        });
      }
    }
    return null;
  }

  private evaluateMaxHoldTime(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const maxDays = this.getConditionValue(alert.conditions, 'max_days') as number || 30;
    
    for (const position of positions) {
      if (position.status !== 'active') continue;
      
      const holdingDays = Math.floor((Date.now() - new Date(position.entryDate).getTime()) / (1000 * 60 * 60 * 24));
      
      if (holdingDays >= maxDays) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Maximum Hold Time Exceeded`,
          message: `${position.symbol} held for ${holdingDays} days (Max: ${maxDays})`,
          currentValue: holdingDays,
          targetValue: maxDays,
          severity: 'medium'
        });
      }
    }
    return null;
  }

  private evaluateWeekendRisk(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (dayOfWeek === 5) { // Friday
      const activePositions = positions.filter(p => p.status === 'active');
      if (activePositions.length > 0) {
        return this.createTriggeredAlert(alert, undefined, {
          title: `Weekend Risk Warning`,
          message: `${activePositions.length} positions will be held over weekend`,
          currentValue: activePositions.length,
          targetValue: 0,
          severity: 'low'
        });
      }
    }
    return null;
  }

  private evaluateEarningsDate(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    // Simplified earnings date check (would need real earnings calendar)
    for (const position of positions) {
      if (position.status !== 'active') continue;
      
      // Placeholder: assume earnings in next 7 days if position held > 20 days
      const holdingDays = Math.floor((Date.now() - new Date(position.entryDate).getTime()) / (1000 * 60 * 60 * 24));
      if (holdingDays > 20 && holdingDays % 90 < 7) { // Rough quarterly check
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Earnings Risk Alert`,
          message: `${position.symbol} may have earnings announcement soon`,
          currentValue: holdingDays,
          targetValue: 90,
          severity: 'medium'
        });
      }
    }
    return null;
  }

  private evaluateMACDCross(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    // Simplified MACD implementation
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      // Placeholder MACD values
      const macd = Math.random() * 2 - 1; // -1 to 1
      const signal = Math.random() * 2 - 1;
      
      if (macd > signal && Math.abs(macd - signal) > 0.1) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `MACD Bullish Cross`,
          message: `${position.symbol} MACD crossed above signal line`,
          currentValue: macd,
          targetValue: signal
        });
      }
    }
    return null;
  }

  private evaluateMAcross(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    // Simplified MA cross implementation
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      // Placeholder MA values
      const shortMA = position.currentPrice * 1.01;
      const longMA = position.currentPrice * 0.99;
      
      if (position.currentPrice > shortMA && shortMA > longMA) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `MA Golden Cross`,
          message: `${position.symbol} moving averages crossed bullishly`,
          currentValue: position.currentPrice,
          targetValue: shortMA
        });
      }
    }
    return null;
  }

  private evaluateBollingerBands(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    // Simplified Bollinger Bands implementation
    for (const position of positions) {
      if (!position.currentPrice || position.status !== 'active') continue;
      
      // Placeholder Bollinger Band values
      const upperBand = position.entryPrice * 1.05;
      const lowerBand = position.entryPrice * 0.95;
      
      if (position.currentPrice >= upperBand) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Bollinger Upper Band Hit`,
          message: `${position.symbol} touched upper Bollinger Band`,
          currentValue: position.currentPrice,
          targetValue: upperBand
        });
      }
    }
    return null;
  }

  private evaluateVolumeDryup(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const dryupThreshold = this.getConditionValue(alert.conditions, 'volume_threshold') as number || 0.5;
    
    for (const position of positions) {
      const quote = this.marketData.get(position.symbol);
      if (!quote) continue;
      
      const volumeRatio = quote.regularMarketVolume / quote.averageVolume;
      
      if (volumeRatio <= dryupThreshold) {
        return this.createTriggeredAlert(alert, position.symbol, {
          title: `Volume Dry-up Alert`,
          message: `${position.symbol} volume only ${(volumeRatio * 100).toFixed(0)}% of average`,
          currentValue: volumeRatio,
          targetValue: dryupThreshold,
          severity: 'low'
        });
      }
    }
    return null;
  }

  private evaluateVolatilityExpansion(alert: AlertConfiguration): TriggeredAlert | null {
    if (!this.marketConditions) return null;
    
    const threshold = this.getConditionValue(alert.conditions, 'volatility_threshold') as number || 20;
    
    if (this.marketConditions.volatilityRegime === 'high') {
      return this.createTriggeredAlert(alert, undefined, {
        title: `Volatility Expansion Alert`,
        message: `Market volatility has expanded significantly`,
        currentValue: 25, // Placeholder
        targetValue: threshold,
        severity: 'medium'
      });
    }
    return null;
  }

  private evaluateMarketRegimeChange(alert: AlertConfiguration): TriggeredAlert | null {
    if (!this.marketConditions) return null;
    
    // Simplified regime change detection
    if (this.marketConditions.marketTrend !== 'bullish') {
      return this.createTriggeredAlert(alert, undefined, {
        title: `Market Regime Change`,
        message: `Market trend changed to ${this.marketConditions.marketTrend}`,
        currentValue: 1,
        targetValue: 0,
        severity: 'medium'
      });
    }
    return null;
  }

  private evaluatePortfolioCorrelation(alert: AlertConfiguration, positions: TrackingEntry[]): TriggeredAlert | null {
    const maxCorrelation = this.getConditionValue(alert.conditions, 'max_correlation') as number || 0.8;
    
    // Simplified correlation calculation
    const estimatedCorrelation = Math.min(0.9, positions.length * 0.1);
    
    if (estimatedCorrelation > maxCorrelation) {
      return this.createTriggeredAlert(alert, undefined, {
        title: `High Portfolio Correlation`,
        message: `Portfolio correlation estimated at ${(estimatedCorrelation * 100).toFixed(0)}%`,
        currentValue: estimatedCorrelation,
        targetValue: maxCorrelation,
        severity: 'medium'
      });
    }
    return null;
  }

  // HELPER METHODS
  private getConditionValue(conditions: AlertCondition[], field: string): number | string {
    const condition = conditions.find(c => c.field === field);
    return condition ? condition.value : 0;
  }

  private createTriggeredAlert(
    alert: AlertConfiguration, 
    symbol: string | undefined, 
    details: {
      title: string;
      message: string;
      currentValue?: number;
      targetValue?: number;
      severity?: AlertSeverity;
      metadata?: Record<string, any>;
    }
  ): TriggeredAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertId: alert.id,
      type: alert.type,
      symbol,
      title: details.title,
      message: details.message,
      severity: details.severity || alert.severity,
      status: 'triggered',
      triggeredAt: new Date().toISOString(),
      currentValue: details.currentValue,
      targetValue: details.targetValue,
      metadata: details.metadata
    };
  }

  // Technical indicator calculations (simplified)
  private async calculateRSI(symbol: string, period: number = 14): Promise<number> {
    // Simplified RSI calculation - in production, use proper technical analysis library
    return Math.random() * 100; // Placeholder
  }

  private async calculateMACD(symbol: string): Promise<{ macd: number; signal: number; histogram: number }> {
    // Simplified MACD calculation
    return { macd: 0, signal: 0, histogram: 0 }; // Placeholder
  }

  // Initialize default alert templates
  private initializeDefaultAlerts(): void {
    // Only add defaults if no alerts exist
    if (this.alerts.length > 0) return;
    
    console.log('Initializing default alerts');
    
    // Add some default alert configurations
    this.alerts.push({
      id: 'default_profit_5percent',
      type: 'percentage_gain',
      name: '5% Profit Alert',
      description: 'Alert when position gains 5%',
      conditions: [{ field: 'percentage_gain', operator: '>=', value: 5 }],
      severity: 'medium',
      enabled: false,
      createdAt: new Date().toISOString(),
      soundEnabled: true,
      emailEnabled: false,
      pushEnabled: true
    });

    this.alerts.push({
      id: 'default_loss_5percent',
      type: 'percentage_loss',
      name: '5% Stop Loss Alert',
      description: 'Alert when position loses 5%',
      conditions: [{ field: 'percentage_loss', operator: '>=', value: 5 }],
      severity: 'high',
      enabled: false,
      createdAt: new Date().toISOString(),
      soundEnabled: true,
      emailEnabled: true,
      pushEnabled: true
    });
    
    this.saveToStorage();
  }

  // Public methods for managing alerts
  getAlerts(): AlertConfiguration[] {
    return [...this.alerts];
  }

  getTriggeredAlerts(): TriggeredAlert[] {
    return [...this.triggeredAlerts];
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.triggeredAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  dismissAlert(alertId: string): void {
    const alert = this.triggeredAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'dismissed';
      alert.dismissedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  clearOldAlerts(olderThanDays: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    this.triggeredAlerts = this.triggeredAlerts.filter(alert => 
      new Date(alert.triggeredAt) > cutoffDate || alert.status === 'active'
    );
  }
}

// Export a singleton instance
export const alertEngine = new AlertEngine(); 