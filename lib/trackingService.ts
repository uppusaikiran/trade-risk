'use client';

import { TrackingEntry, DailyUpdate, StockQuote, RiskAlert } from '@/types/stock';
import { StockAPI } from './stockApi';

const STORAGE_KEY = 'trade-risk-tracking';

// Robinhood margin rate calculation
const getRobinhoodMarginRate = (marginAmount: number): number => {
  if (marginAmount <= 50000) return 5.75;
  if (marginAmount <= 100000) return 5.55;
  if (marginAmount <= 1000000) return 5.25;
  if (marginAmount <= 10000000) return 5.0;
  if (marginAmount <= 50000000) return 4.95;
  return 4.7;
};

export class TrackingService {
  static getTrackingEntries(): TrackingEntry[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading tracking entries:', error);
      return [];
    }
  }

  static saveTrackingEntries(entries: TrackingEntry[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving tracking entries:', error);
    }
  }

  static addTrackingEntry(params: {
    symbol: string;
    stockName: string;
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
  }): TrackingEntry {
    const entryDate = new Date();
    const expirationDate = new Date(entryDate);
    expirationDate.setDate(expirationDate.getDate() + params.tradeDuration);

    const entry: TrackingEntry = {
      id: Date.now().toString(),
      ...params,
      entryDate: entryDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      status: 'active',
      dailyUpdates: [],
      currentPrice: params.entryPrice,
      currentProfit: 0,
      currentROI: 0,
      daysElapsed: 0,
      totalInterestPaid: 0,
      riskAlerts: [],
      lastRiskCheck: entryDate.toISOString(),
    };

    const entries = this.getTrackingEntries();
    entries.push(entry);
    this.saveTrackingEntries(entries);
    
    return entry;
  }

  static renewTrackingEntry(id: string, additionalDays: number): void {
    const entries = this.getTrackingEntries();
    const index = entries.findIndex(entry => entry.id === id);
    
    if (index !== -1) {
      const entry = entries[index];
      const currentExpiration = new Date(entry.expirationDate || entry.entryDate);
      const newExpiration = new Date(currentExpiration);
      newExpiration.setDate(newExpiration.getDate() + additionalDays);
      
      entries[index] = {
        ...entry,
        expirationDate: newExpiration.toISOString(),
        tradeDuration: entry.tradeDuration + additionalDays,
        status: 'active'
      };
      
      this.saveTrackingEntries(entries);
    }
  }

  static checkForRiskAlerts(entry: TrackingEntry): RiskAlert[] {
    const alerts: RiskAlert[] = [];
    const now = new Date().toISOString();
    
    // Check for sudden losses (more than 10% drop in a day)
    if (entry.dailyUpdates.length >= 2) {
      const lastTwo = entry.dailyUpdates.slice(-2);
      const [yesterday, today] = lastTwo;
      const dailyChange = ((today.roi - yesterday.roi) / Math.abs(yesterday.roi)) * 100;
      
      if (dailyChange < -10) {
        alerts.push({
          id: `${entry.id}-sudden-loss-${Date.now()}`,
          type: 'sudden_loss',
          severity: dailyChange < -25 ? 'high' : dailyChange < -15 ? 'medium' : 'low',
          message: `Sudden loss detected: ${dailyChange.toFixed(2)}% drop in ROI`,
          timestamp: now,
          acknowledged: false,
        });
      }
    }
    
    // Check for high volatility (price swings > 15% from entry)
    if (entry.currentPrice && entry.entryPrice) {
      const priceChange = Math.abs((entry.currentPrice - entry.entryPrice) / entry.entryPrice * 100);
      if (priceChange > 15 && entry.currentROI && entry.currentROI < 0) {
        alerts.push({
          id: `${entry.id}-volatility-${Date.now()}`,
          type: 'high_volatility',
          severity: priceChange > 25 ? 'high' : 'medium',
          message: `High volatility detected: ${priceChange.toFixed(2)}% price movement`,
          timestamp: now,
          acknowledged: false,
        });
      }
    }
    
    // Check for margin call risk - Using standard 25% maintenance requirement
    // Formula: marginCallPrice = marginUsed / (0.75 * shares) = (marginUsed * 4/3) / shares
    const marginCallPrice = entry.shares > 0 ? (entry.marginUsed * 4/3) / entry.shares : 0;
    if (entry.currentPrice && entry.currentPrice <= marginCallPrice) {
      alerts.push({
        id: `${entry.id}-margin-risk-${Date.now()}`,
        type: 'margin_risk',
        severity: 'high',
        message: `Margin call risk: Price ${entry.currentPrice.toFixed(2)} below threshold ${marginCallPrice.toFixed(2)}`,
        timestamp: now,
        acknowledged: false,
      });
    }
    
    // Check for declining profits (consistent losses over 3 days)
    if (entry.dailyUpdates.length >= 3) {
      const lastThree = entry.dailyUpdates.slice(-3);
      const isDecreasing = lastThree.every((update, index) => 
        index === 0 || update.roi < lastThree[index - 1].roi
      );
      
      if (isDecreasing && entry.currentROI && entry.currentROI < -5) {
        alerts.push({
          id: `${entry.id}-profit-decline-${Date.now()}`,
          type: 'profit_decline',
          severity: entry.currentROI < -15 ? 'high' : 'medium',
          message: `Consistent profit decline over 3 days, current ROI: ${entry.currentROI.toFixed(2)}%`,
          timestamp: now,
          acknowledged: false,
        });
      }
    }
    
    return alerts;
  }

  static acknowledgeRiskAlert(entryId: string, alertId: string): void {
    const entries = this.getTrackingEntries();
    const index = entries.findIndex(entry => entry.id === entryId);
    
    if (index !== -1 && entries[index].riskAlerts) {
      entries[index].riskAlerts = entries[index].riskAlerts!.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      );
      this.saveTrackingEntries(entries);
    }
  }

  static updateTrackingEntry(id: string, updates: Partial<TrackingEntry>): void {
    const entries = this.getTrackingEntries();
    const index = entries.findIndex(entry => entry.id === id);
    
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates };
      this.saveTrackingEntries(entries);
    }
  }

  static removeTrackingEntry(id: string): void {
    const entries = this.getTrackingEntries();
    const filtered = entries.filter(entry => entry.id !== id);
    this.saveTrackingEntries(filtered);
  }

  static async updateDailyPrices(): Promise<void> {
    const entries = this.getTrackingEntries();
    const activeEntries = entries.filter(entry => entry.status === 'active');
    
    for (const entry of activeEntries) {
      try {
        const stockData = await StockAPI.getQuote(entry.symbol);
        const updatedEntry = this.calculateDailyUpdate(entry, stockData);
        this.updateTrackingEntry(entry.id, updatedEntry);
      } catch (error) {
        console.error(`Error updating ${entry.symbol}:`, error);
      }
    }
  }

  static calculateDailyUpdate(entry: TrackingEntry, stockData: StockQuote): Partial<TrackingEntry> {
    const currentPrice = stockData.regularMarketPrice;
    const entryDate = new Date(entry.entryDate);
    const today = new Date();
    const daysElapsed = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if entry has expired
    const expirationDate = entry.expirationDate ? new Date(entry.expirationDate) : null;
    let status: 'active' | 'completed' | 'stopped' | 'expired' = entry.status;
    
    if (expirationDate && today >= expirationDate && status === 'active') {
      status = 'expired';
    }
    
    // Calculate margin interest
    const marginRate = getRobinhoodMarginRate(entry.marginUsed);
    const chargeableMargin = entry.isGoldSubscriber 
      ? Math.max(0, entry.marginUsed - 1000)
      : entry.marginUsed;
    
    const dailyInterestRate = marginRate / 365 / 100;
    const totalInterestPaid = chargeableMargin * dailyInterestRate * daysElapsed;
    
    // Calculate current profit/loss
    const grossProfit = (currentPrice - entry.entryPrice) * entry.shares;
    const currentProfit = grossProfit - totalInterestPaid;
    const currentROI = entry.ownCash > 0 ? (currentProfit / entry.ownCash) * 100 : 0;
    
    // Check for margin call risk
    const marginCallPrice = entry.shares > 0 ? (entry.marginUsed * 4/3) / entry.shares : 0;
    const marginCallRisk = entry.shares > 0 && currentPrice <= marginCallPrice;
    
    // Check if exit conditions are met (only if not expired)
    if (status !== 'expired') {
      if (currentPrice >= entry.exitPrice) {
        status = 'completed';
      } else if (currentPrice <= entry.stopLoss) {
        status = 'stopped';
      }
    }
    
    // Create daily update entry
    const dailyUpdate: DailyUpdate = {
      date: today.toISOString().split('T')[0],
      price: currentPrice,
      profit: grossProfit,
      loss: grossProfit < 0 ? Math.abs(grossProfit) : 0,
      totalInterest: totalInterestPaid,
      roi: currentROI,
      marginCallRisk,
    };
    
    // Add to daily updates if it's a new day
    const existingUpdates = [...entry.dailyUpdates];
    const lastUpdate = existingUpdates[existingUpdates.length - 1];
    
    if (!lastUpdate || lastUpdate.date !== dailyUpdate.date) {
      existingUpdates.push(dailyUpdate);
    } else {
      // Update today's entry
      existingUpdates[existingUpdates.length - 1] = dailyUpdate;
    }

    // Create updated entry for risk checking
    const updatedEntry: TrackingEntry = {
      ...entry,
      currentPrice,
      currentProfit,
      currentROI,
      daysElapsed,
      totalInterestPaid,
      status,
      dailyUpdates: existingUpdates,
    };

    // Check for risk alerts
    const newAlerts = this.checkForRiskAlerts(updatedEntry);
    const existingAlerts = entry.riskAlerts || [];
    const allAlerts = [...existingAlerts, ...newAlerts];
    
    return {
      currentPrice,
      currentProfit,
      currentROI,
      daysElapsed,
      totalInterestPaid,
      status,
      dailyUpdates: existingUpdates,
      riskAlerts: allAlerts,
      lastRiskCheck: today.toISOString(),
    };
  }

  static getActiveEntries(): TrackingEntry[] {
    return this.getTrackingEntries().filter(entry => entry.status === 'active');
  }

  static getCompletedEntries(): TrackingEntry[] {
    return this.getTrackingEntries().filter(entry => entry.status !== 'active' && entry.status !== 'expired');
  }

  static getExpiredEntries(): TrackingEntry[] {
    return this.getTrackingEntries().filter(entry => entry.status === 'expired');
  }
} 