export type AlertType = 
  // Profit-Taking Alerts
  | 'percentage_gain' | 'dollar_profit' | 'risk_reward_ratio' | 'price_target' 
  | 'resistance_breach' | 'round_number' | 'trailing_stop' | 'parabolic_sar'
  | 'fibonacci_profit' | 'ma_profit'
  
  // Position Closing Alerts
  | 'percentage_loss' | 'dollar_loss' | 'atr_stop' | 'support_break' 
  | 'ma_stop' | 'position_size_risk' | 'portfolio_heat' | 'margin_call_risk'
  | 'correlation_risk' | 'sector_concentration'
  
  // Time-Based Alerts
  | 'holding_period' | 'end_of_day' | 'weekly_review' | 'monthly_review'
  | 'max_hold_time' | 'weekend_risk' | 'holiday_risk' | 'earnings_date'
  
  // Technical Indicator Alerts
  | 'rsi_overbought' | 'rsi_oversold' | 'macd_cross' | 'stochastic_signal'
  | 'williams_r' | 'cci_extreme' | 'ma_cross' | 'trend_break' | 'channel_break'
  | 'bollinger_signal' | 'donchian_break'
  
  // Volume Alerts
  | 'volume_spike' | 'volume_dryup' | 'obv_divergence' | 'mfi_signal' | 'vwap_alert'
  
  // Market Condition Alerts
  | 'vix_spike' | 'volatility_expansion' | 'iv_change' | 'atr_expansion'
  | 'market_regime_change' | 'sector_rotation' | 'market_breadth' | 'index_divergence'
  
  // Fundamental & News Alerts
  | 'earnings_surprise' | 'revenue_growth' | 'insider_trading' | 'analyst_rating'
  | 'short_interest' | 'economic_data' | 'fed_decision' | 'currency_movement'
  
  // Advanced Risk Alerts
  | 'max_drawdown' | 'sharpe_deterioration' | 'beta_change' | 'var_breach'
  | 'expected_shortfall' | 'kelly_criterion' | 'portfolio_correlation'
  
  // Behavioral Alerts
  | 'revenge_trading' | 'fomo_warning' | 'overconfidence' | 'analysis_paralysis';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'active' | 'triggered' | 'acknowledged' | 'dismissed' | 'expired';

export interface AlertCondition {
  field: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'crosses_above' | 'crosses_below';
  value: number | string;
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
}

export interface AlertConfiguration {
  id: string;
  type: AlertType;
  name: string;
  description: string;
  symbol?: string;
  conditions: AlertCondition[];
  severity: AlertSeverity;
  enabled: boolean;
  createdAt: string;
  triggeredAt?: string;
  lastChecked?: string;
  repeatInterval?: number; // minutes
  expiresAt?: string;
  soundEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  webhookUrl?: string;
}

export interface TriggeredAlert {
  id: string;
  alertId: string;
  type: AlertType;
  symbol?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggeredAt: string;
  acknowledgedAt?: string;
  dismissedAt?: string;
  currentValue?: number;
  targetValue?: number;
  metadata?: Record<string, any>;
}

export interface ProfitTakingAlert extends AlertConfiguration {
  type: 'percentage_gain' | 'dollar_profit' | 'risk_reward_ratio' | 'price_target';
  profitTarget: number;
  partialTakeProfit?: boolean;
  partialPercentage?: number;
}

export interface StopLossAlert extends AlertConfiguration {
  type: 'percentage_loss' | 'dollar_loss' | 'atr_stop' | 'support_break';
  stopLossLevel: number;
  trailingStop?: boolean;
  trailingDistance?: number;
}

export interface TechnicalAlert extends AlertConfiguration {
  type: 'rsi_overbought' | 'rsi_oversold' | 'macd_cross' | 'ma_cross';
  indicatorValue: number;
  lookbackPeriod: number;
  timeframe: string;
}

export interface VolumeAlert extends AlertConfiguration {
  type: 'volume_spike' | 'volume_dryup' | 'obv_divergence';
  volumeThreshold: number;
  averagePeriod: number;
}

export interface MarketAlert extends AlertConfiguration {
  type: 'vix_spike' | 'volatility_expansion' | 'market_regime_change';
  marketCondition: string;
  threshold: number;
}

export interface RiskAlert extends AlertConfiguration {
  type: 'max_drawdown' | 'portfolio_heat' | 'correlation_risk';
  riskLevel: number;
  portfolioImpact: 'low' | 'medium' | 'high';
}

export interface TimeBasedAlert extends AlertConfiguration {
  type: 'holding_period' | 'end_of_day' | 'max_hold_time';
  timeThreshold: number; // in minutes/hours/days
  recurringSchedule?: string; // cron expression
}

export interface AlertPreferences {
  userId: string;
  soundEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  maxAlertsPerDay: number;
  alertFrequency: 'immediate' | 'batched_5min' | 'batched_15min' | 'batched_1hour';
  severityFilter: AlertSeverity[];
  categoryFilter: AlertType[];
}

export interface AlertStatistics {
  totalAlerts: number;
  activeAlerts: number;
  triggeredToday: number;
  accuracyRate: number; // percentage of profitable alerts
  falsePositiveRate: number;
  avgResponseTime: number; // in minutes
  profitFromAlerts: number;
  lossFromIgnoredAlerts: number;
}

export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  alertConfigs: Partial<AlertConfiguration>[];
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  rating: number;
}

export interface MarketConditions {
  vix: number;
  sp500Price: number;
  sp500Change: number;
  volatilityRegime: 'low' | 'medium' | 'high';
  marketTrend: 'bullish' | 'bearish' | 'sideways';
  sectorRotation: Record<string, number>;
  marketBreadth: {
    advanceDeclineRatio: number;
    newHighsLows: number;
  };
}

export interface EconomicIndicators {
  fedFundsRate: number;
  unemploymentRate: number;
  inflationRate: number;
  gdpGrowth: number;
  dollarIndex: number;
  bondYields: {
    '2y': number;
    '10y': number;
    '30y': number;
  };
  commodities: {
    oil: number;
    gold: number;
    copper: number;
  };
} 