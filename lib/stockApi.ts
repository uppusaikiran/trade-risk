import { StockQuote } from '@/types/stock';

// Real-time Yahoo Finance API integration
export class StockAPI {
  private static readonly BASE_URL = '/api/stock';

  static async getQuote(symbol: string): Promise<StockQuote> {
    const response = await fetch(`${this.BASE_URL}?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
    return response.json();
  }

  static async searchStocks(query: string): Promise<Array<{symbol: string, name: string}>> {
    const response = await fetch(`${this.BASE_URL}/search?q=${query}`);
    if (!response.ok) {
      throw new Error('Failed to search stocks');
    }
    return response.json();
  }

  static async getHistoricalData(symbol: string, period: string = '1y') {
    const response = await fetch(`${this.BASE_URL}/historical?symbol=${symbol}&period=${period}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch historical data for ${symbol}`);
    }
    return response.json();
  }
}

// Margin calculation utilities
export class MarginCalculator {
  // Robinhood Gold margin rate (as of 2024 - this should be updated dynamically)
  private static readonly ROBINHOOD_MARGIN_RATE = 0.075; // 7.5% annual
  
  static calculateMarginInterest(
    marginAmount: number, 
    days: number, 
    annualRate: number = this.ROBINHOOD_MARGIN_RATE
  ): number {
    const dailyRate = annualRate / 365;
    return marginAmount * dailyRate * days;
  }

  static calculateMarginCall(
    stockPrice: number,
    shares: number,
    marginUsed: number,
    maintenanceMargin: number = 0.25 // 25% maintenance requirement
  ): boolean {
    const portfolioValue = stockPrice * shares;
    const equity = portfolioValue - marginUsed;
    const requiredEquity = portfolioValue * maintenanceMargin;
    return equity < requiredEquity;
  }

  static calculateMaxLoss(
    entryPrice: number,
    shares: number,
    marginUsed: number,
    stopLoss?: number
  ): number {
    if (stopLoss) {
      return Math.max(0, (entryPrice - stopLoss) * shares);
    }
    // If no stop loss, max loss is total investment
    return entryPrice * shares;
  }

  static calculateROI(
    entryPrice: number,
    exitPrice: number,
    shares: number,
    ownCash: number,
    marginInterest: number
  ): number {
    const grossProfit = (exitPrice - entryPrice) * shares;
    const netProfit = grossProfit - marginInterest;
    return (netProfit / ownCash) * 100;
  }
} 