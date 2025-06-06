'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';
import { UnifiedAlertService, UnifiedAlert } from '../lib/unifiedAlertService';
import { AlertSeverity } from '../types/alerts';

interface UnifiedAlertsPageProps {
  className?: string;
}

export default function UnifiedAlertsPage({ className = '' }: UnifiedAlertsPageProps) {
  const [alerts, setAlerts] = useState<UnifiedAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<UnifiedAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'triggered' | 'acknowledged' | 'dismissed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'trading' | 'risk'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load alerts
  useEffect(() => {
    const loadAlerts = () => {
      try {
        const allAlerts = UnifiedAlertService.getAllAlerts();
        setAlerts(allAlerts);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading alerts:', error);
        setIsLoading(false);
      }
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...alerts];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(alert => alert.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.type === typeFilter);
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    setFilteredAlerts(filtered);
  }, [alerts, statusFilter, typeFilter, severityFilter]);

  const handleAcknowledgeAlert = (alertId: string) => {
    const success = UnifiedAlertService.acknowledgeAlert(alertId);
    if (success) {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'acknowledged', acknowledgedAt: new Date().toISOString() }
          : alert
      ));
    }
  };

  const handleDismissAlert = (alertId: string) => {
    const success = UnifiedAlertService.dismissAlert(alertId);
    if (success) {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'dismissed', dismissedAt: new Date().toISOString() }
          : alert
      ));
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'triggered': return 'bg-red-100 text-red-800';
      case 'acknowledged': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: 'trading' | 'risk') => {
    return type === 'trading' ? (
      <BarChart3 className="w-4 h-4 text-blue-600" />
    ) : (
      <Shield className="w-4 h-4 text-red-600" />
    );
  };

  const statistics = UnifiedAlertService.getAlertStatistics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading alerts...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Statistics */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Alert Center</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <Bell className="w-6 h-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">Total Active</p>
                <p className="text-2xl font-bold text-blue-900">{statistics.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-800">Trading Alerts</p>
                <p className="text-2xl font-bold text-purple-900">{statistics.trading}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Risk Alerts</p>
                <p className="text-2xl font-bold text-red-900">{statistics.risk}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Today</p>
                <p className="text-2xl font-bold text-green-900">{statistics.todayCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="triggered">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="trading">Trading Alerts</option>
            <option value="risk">Risk Alerts</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredAlerts.length} of {alerts.length} alerts
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow border p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-600">
              {alerts.length === 0 
                ? "You don't have any alerts yet. Start trading to generate alerts."
                : "No alerts match your current filters. Try adjusting the filter criteria."
              }
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`bg-white rounded-lg shadow border p-4 ${
                alert.status === 'triggered' ? 'border-l-4 border-l-red-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(alert.type)}
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(alert.status)}`}>
                        {alert.status.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {alert.type === 'trading' ? 'TRADING' : 'RISK'}
                      </span>
                      {alert.symbol && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                          {alert.symbol}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{alert.title}</h3>
                  <p className="text-gray-700 mb-2">{alert.message}</p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{new Date(alert.triggeredAt).toLocaleString()}</span>
                    {alert.currentValue !== undefined && alert.targetValue !== undefined && (
                      <span>
                        Current: {alert.currentValue.toFixed(2)} | Target: {alert.targetValue.toFixed(2)}
                      </span>
                    )}
                    {alert.acknowledgedAt && (
                      <span className="text-green-600">
                        Acknowledged: {new Date(alert.acknowledgedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                {alert.status === 'triggered' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Acknowledge alert"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Dismiss alert"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 