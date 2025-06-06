'use client';

import React from 'react';
import { AlertTriangle, Bell, Clock, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { TriggeredAlert } from '../types/alerts';

interface AlertSummaryWidgetProps {
  alerts: TriggeredAlert[];
  className?: string;
}

export default function AlertSummaryWidget({ alerts, className = '' }: AlertSummaryWidgetProps) {
  if (!alerts || alerts.length === 0) return null;

  // Categorize alerts
  const profitAlerts = alerts.filter(alert => 
    alert.type.includes('gain') || alert.type.includes('profit') || alert.type.includes('target')
  );
  const riskAlerts = alerts.filter(alert => 
    alert.type.includes('loss') || alert.type.includes('stop') || alert.type.includes('risk')
  );
  const otherAlerts = alerts.filter(alert => 
    !alert.type.includes('gain') && !alert.type.includes('profit') && 
    !alert.type.includes('loss') && !alert.type.includes('stop') && 
    !alert.type.includes('risk') && !alert.type.includes('target')
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Bell className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Bell className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-blue-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">{alerts.length}</span>
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
        </div>
        <a 
          href="/alerts"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
        >
          Manage All →
        </a>
      </div>

      {/* Alert Categories Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Profit Alerts */}
        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Profit</span>
          </div>
          <p className="text-lg font-bold text-green-900">{profitAlerts.length}</p>
          <p className="text-xs text-green-600">Take profit alerts</p>
        </div>

        {/* Risk Alerts */}
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Risk</span>
          </div>
          <p className="text-lg font-bold text-red-900">{riskAlerts.length}</p>
          <p className="text-xs text-red-600">Stop loss alerts</p>
        </div>

        {/* Other Alerts */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center space-x-2 mb-1">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Monitor</span>
          </div>
          <p className="text-lg font-bold text-blue-900">{otherAlerts.length}</p>
          <p className="text-xs text-blue-600">Other alerts</p>
        </div>
      </div>

      {/* Recent Alerts List */}
      <div className="space-y-2">
        {alerts.slice(0, 3).map((alert) => (
          <div 
            key={alert.id} 
            className={`rounded-lg p-3 border ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium truncate">{alert.title}</h4>
                    {alert.symbol && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {alert.symbol}
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-80 line-clamp-1">{alert.message}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-3 h-3 opacity-60" />
                    <span className="text-xs opacity-60">
                      {new Date(alert.triggeredAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={() => {
                    // This would normally call alertEngine.acknowledgeAlert(alert.id)
                    // For now, just redirect to alerts page
                    window.location.href = '/alerts';
                  }}
                  className="text-xs px-2 py-1 rounded bg-white bg-opacity-50 hover:bg-opacity-70 transition-colors"
                  title="Acknowledge alert"
                >
                  ✓
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show more indicator */}
      {alerts.length > 3 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <a 
            href="/alerts"
            className="block text-center text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            View {alerts.length - 3} more alerts →
          </a>
        </div>
      )}
    </div>
  );
} 