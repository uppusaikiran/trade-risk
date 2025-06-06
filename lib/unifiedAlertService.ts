import { AlertConfiguration, TriggeredAlert, AlertSeverity, AlertStatus } from '../types/alerts';
import { TrackingEntry, RiskAlert } from '../types/stock';
import { alertEngine } from './alertEngine';
import { TrackingService } from './trackingService';

export interface UnifiedAlert {
  id: string;
  type: 'trading' | 'risk';
  source: 'alertEngine' | 'trackingService';
  title: string;
  message: string;
  symbol?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  triggeredAt: string;
  acknowledgedAt?: string;
  dismissedAt?: string;
  currentValue?: number;
  targetValue?: number;
  metadata?: Record<string, any>;
  // For compatibility with existing code
  alertId?: string; // References the original alert configuration
  // Additional fields for risk alerts
  entryId?: string; // For tracking which position this relates to
  riskType?: string;
}

export class UnifiedAlertService {
  /**
   * Get all alerts from both AlertEngine and TrackingService
   */
  static getAllAlerts(): UnifiedAlert[] {
    const tradingAlerts = this.getTradingAlerts();
    const riskAlerts = this.getRiskAlerts();
    
    return [...tradingAlerts, ...riskAlerts].sort((a, b) => 
      new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  }

  /**
   * Get alerts from AlertEngine converted to unified format
   */
  static getTradingAlerts(): UnifiedAlert[] {
    const alerts = alertEngine.getTriggeredAlerts();
    
    return alerts.map(alert => ({
      id: alert.id,
      type: 'trading' as const,
      source: 'alertEngine' as const,
      title: alert.title,
      message: alert.message,
      symbol: alert.symbol,
      severity: alert.severity,
      status: alert.status,
      triggeredAt: alert.triggeredAt,
      acknowledgedAt: alert.acknowledgedAt,
      dismissedAt: alert.dismissedAt,
      currentValue: alert.currentValue,
      targetValue: alert.targetValue,
      metadata: alert.metadata,
      alertId: alert.alertId
    }));
  }

  /**
   * Get risk alerts from TrackingService converted to unified format
   */
  static getRiskAlerts(): UnifiedAlert[] {
    const entries = TrackingService.getTrackingEntries();
    const riskAlerts: UnifiedAlert[] = [];

    entries.forEach(entry => {
      if (entry.riskAlerts) {
        entry.riskAlerts.forEach(alert => {
          riskAlerts.push({
            id: alert.id,
            type: 'risk' as const,
            source: 'trackingService' as const,
            title: this.getRiskAlertTitle(alert.type),
            message: alert.message,
            symbol: entry.symbol,
            severity: alert.severity,
            status: alert.acknowledged ? 'acknowledged' : 'triggered',
            triggeredAt: alert.timestamp,
            acknowledgedAt: alert.acknowledged ? alert.timestamp : undefined,
            entryId: entry.id,
            riskType: alert.type,
            alertId: alert.id, // Use the alert ID as alertId for risk alerts
            metadata: {
              entryPrice: entry.entryPrice,
              currentPrice: entry.currentPrice,
              shares: entry.shares,
              marginUsed: entry.marginUsed
            }
          });
        });
      }
    });

    return riskAlerts;
  }

  /**
   * Get count of active (unacknowledged) alerts
   */
  static getActiveAlertsCount(): number {
    const allAlerts = this.getAllAlerts();
    return allAlerts.filter(alert => alert.status === 'triggered').length;
  }

  /**
   * Get count by type
   */
  static getAlertsCountByType(): { trading: number; risk: number; total: number } {
    const allAlerts = this.getAllAlerts();
    const activeAlerts = allAlerts.filter(alert => alert.status === 'triggered');
    
    const trading = activeAlerts.filter(alert => alert.type === 'trading').length;
    const risk = activeAlerts.filter(alert => alert.type === 'risk').length;
    
    return {
      trading,
      risk,
      total: trading + risk
    };
  }

  /**
   * Get alerts by severity
   */
  static getAlertsBySeverity(): Record<AlertSeverity, UnifiedAlert[]> {
    const allAlerts = this.getAllAlerts().filter(alert => alert.status === 'triggered');
    
    return {
      low: allAlerts.filter(alert => alert.severity === 'low'),
      medium: allAlerts.filter(alert => alert.severity === 'medium'),
      high: allAlerts.filter(alert => alert.severity === 'high'),
      critical: allAlerts.filter(alert => alert.severity === 'critical')
    };
  }

  /**
   * Acknowledge an alert (handles both types)
   */
  static acknowledgeAlert(alertId: string): boolean {
    const alert = this.getAllAlerts().find(a => a.id === alertId);
    
    if (!alert) return false;

    if (alert.source === 'alertEngine') {
      alertEngine.acknowledgeAlert(alertId);
      return true;
    } else if (alert.source === 'trackingService' && alert.entryId) {
      TrackingService.acknowledgeRiskAlert(alert.entryId, alertId);
      return true;
    }

    return false;
  }

  /**
   * Dismiss an alert (handles both types)
   */
  static dismissAlert(alertId: string): boolean {
    const alert = this.getAllAlerts().find(a => a.id === alertId);
    
    if (!alert) return false;

    if (alert.source === 'alertEngine') {
      alertEngine.dismissAlert(alertId);
      return true;
    } else if (alert.source === 'trackingService' && alert.entryId) {
      // For risk alerts, acknowledging is the same as dismissing
      TrackingService.acknowledgeRiskAlert(alert.entryId, alertId);
      return true;
    }

    return false;
  }

  /**
   * Get recent alerts for notifications
   */
  static getRecentAlerts(limit: number = 5): UnifiedAlert[] {
    return this.getAllAlerts()
      .filter(alert => alert.status === 'triggered')
      .slice(0, limit);
  }

  /**
   * Clear old alerts (for cleanup)
   */
  static clearOldAlerts(olderThanDays: number = 7): void {
    // Clear old alerts from AlertEngine
    alertEngine.clearOldAlerts(olderThanDays);
    
    // Note: Risk alerts are tied to positions and cleared when positions are removed
    // so we don't need to implement separate cleanup for them
  }

  /**
   * Convert risk alert types to user-friendly titles
   */
  private static getRiskAlertTitle(type: string): string {
    const titles: Record<string, string> = {
      'sudden_loss': 'Sudden Loss Alert',
      'high_volatility': 'High Volatility Warning',
      'margin_risk': 'Margin Call Risk',
      'profit_decline': 'Profit Decline Alert'
    };
    
    return titles[type] || 'Risk Alert';
  }

  /**
   * Get alert statistics for dashboard
   */
  static getAlertStatistics(): {
    total: number;
    trading: number;
    risk: number;
    bySeverity: Record<AlertSeverity, number>;
    todayCount: number;
    acknowledgedCount: number;
  } {
    const allAlerts = this.getAllAlerts();
    const activeAlerts = allAlerts.filter(alert => alert.status === 'triggered');
    const today = new Date().toDateString();
    
    const todayAlerts = allAlerts.filter(alert => 
      new Date(alert.triggeredAt).toDateString() === today
    );
    
    const acknowledgedAlerts = allAlerts.filter(alert => 
      alert.status === 'acknowledged'
    );

    const bySeverity = {
      low: activeAlerts.filter(alert => alert.severity === 'low').length,
      medium: activeAlerts.filter(alert => alert.severity === 'medium').length,
      high: activeAlerts.filter(alert => alert.severity === 'high').length,
      critical: activeAlerts.filter(alert => alert.severity === 'critical').length
    };

    return {
      total: activeAlerts.length,
      trading: activeAlerts.filter(alert => alert.type === 'trading').length,
      risk: activeAlerts.filter(alert => alert.type === 'risk').length,
      bySeverity,
      todayCount: todayAlerts.length,
      acknowledgedCount: acknowledgedAlerts.length
    };
  }
} 