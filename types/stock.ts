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