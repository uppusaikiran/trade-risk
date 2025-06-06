export interface StockQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap: number;
  trailingPE?: number;
  forwardPE?: number;
  dividendYield?: number;
  beta?: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  averageVolume: number;
  shortName: string;
  longName?: string;
}

export interface MarginCalculation {
  initialCost: number;
  marginUsed: number;
  ownCash: number;
  dailyInterestRate: number;
  totalInterest: number;
  netProfitLoss: number;
  returnOnInvestment: number;
  marginMaintenanceRequirement: number;
}

export interface TradeStrategy {
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  marginRatio: number;
}

export interface RiskTolerance {
  maxLossPercentage: number;
  maxPositionSize: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
}

export interface TradeScenario {
  price: number;
  profit: number;
  loss: number;
  marginCall: boolean;
}

export interface DailyUpdate {
  date: string;
  price: number;
  profit: number;
  loss: number;
  totalInterest: number;
  roi: number;
  marginCallRisk: boolean;
}

export interface RiskAlert {
  id: string;
  type: 'sudden_loss' | 'high_volatility' | 'margin_risk' | 'profit_decline';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface TrackingEntry {
  id: string;
  symbol: string;
  stockName: string;
  entryDate: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  shares: number;
  investmentAmount: number;
  marginUsed: number;
  ownCash: number;
  marginRatio: number;
  tradeDuration: number;
  isGoldSubscriber: boolean;
  status: 'active' | 'completed' | 'stopped' | 'expired';
  dailyUpdates: DailyUpdate[];
  currentPrice?: number;
  currentProfit?: number;
  currentROI?: number;
  daysElapsed?: number;
  totalInterestPaid?: number;
  expirationDate?: string;
  riskAlerts?: RiskAlert[];
  lastRiskCheck?: string;
} 