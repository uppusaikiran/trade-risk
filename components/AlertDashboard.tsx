'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AlertTriangle, TrendingUp, Clock, Target, Activity, Bell, CheckCircle, XCircle } from 'lucide-react';
import { AlertConfiguration, TriggeredAlert, AlertStatistics } from '../types/alerts';
import { alertEngine } from '../lib/alertEngine';
import { UnifiedAlertService, UnifiedAlert } from '../lib/unifiedAlertService';

interface AlertDashboardProps {
  className?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

// Helper functions (moved outside component to avoid hoisting issues)
const getAlertCategory = (alertType: string): string => {
  if (alertType.includes('gain') || alertType.includes('profit')) return 'Profit Taking';
  if (alertType.includes('loss') || alertType.includes('stop')) return 'Stop Loss';
  if (alertType.includes('risk') || alertType.includes('margin') || alertType.includes('drawdown')) return 'Risk Management';
  if (alertType.includes('rsi') || alertType.includes('ma') || alertType.includes('macd')) return 'Technical';
  if (alertType.includes('volume')) return 'Volume';
  if (alertType.includes('time') || alertType.includes('day') || alertType.includes('weekend')) return 'Time Based';
  if (alertType.includes('vix') || alertType.includes('market')) return 'Market Conditions';
  return 'Other';
};

const getSeverityColor = (severity: string) => {
  const colors = {
    low: 'text-blue-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600'
  };
  return colors[severity as keyof typeof colors] || 'text-gray-600';
};

export default function AlertDashboard({ className = '' }: AlertDashboardProps) {
  const [alerts, setAlerts] = useState<AlertConfiguration[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<UnifiedAlert[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    const loadData = () => {
      setAlerts(alertEngine.getAlerts());
      setTriggeredAlerts(UnifiedAlertService.getAllAlerts());
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate alert statistics
  const statistics = useMemo((): AlertStatistics => {
    const now = new Date();
    const timeRangeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    }[timeRange];

    const recentAlerts = triggeredAlerts.filter(alert => 
      new Date(alert.triggeredAt).getTime() > now.getTime() - timeRangeMs
    );

    const todayAlerts = triggeredAlerts.filter(alert => 
      new Date(alert.triggeredAt).toDateString() === now.toDateString()
    );

    const acknowledgedAlerts = recentAlerts.filter(alert => alert.status === 'acknowledged').length;
    const totalTriggered = recentAlerts.length;

    // Calculate real response time from triggered alerts
    const responseTimes = recentAlerts
      .filter(alert => alert.status === 'acknowledged' && alert.acknowledgedAt)
      .map(alert => {
        const triggered = new Date(alert.triggeredAt).getTime();
        const acknowledged = new Date(alert.acknowledgedAt!).getTime();
        return (acknowledged - triggered) / (1000 * 60); // Convert to minutes
      });
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    return {
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => a.enabled).length,
      triggeredToday: todayAlerts.length,
      accuracyRate: totalTriggered > 0 ? (acknowledgedAlerts / totalTriggered) * 100 : 0,
      falsePositiveRate: totalTriggered > 0 ? ((totalTriggered - acknowledgedAlerts) / totalTriggered) * 100 : 0,
      avgResponseTime: avgResponseTime,
      profitFromAlerts: 0, // Will be calculated from real position data when available
      lossFromIgnoredAlerts: 0 // Will be calculated from real position data when available
    };
  }, [alerts, triggeredAlerts, timeRange]);

  // Alert type distribution
  const alertTypeDistribution = useMemo(() => {
    const distribution = alerts.reduce((acc, alert) => {
      const category = getAlertCategory(alert.type);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([category, count]) => ({
      name: category,
      value: count
    }));
  }, [alerts]);

  // Severity distribution of triggered alerts
  const severityDistribution = useMemo(() => {
    const distribution = triggeredAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribution).map(([severity, count]) => ({
      name: severity,
      value: count
    }));
  }, [triggeredAlerts]);

  // Daily alert trend
  const dailyTrend = useMemo(() => {
    const days = 7;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayAlerts = triggeredAlerts.filter(alert => 
        alert.triggeredAt.startsWith(dateStr)
      );

      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        alerts: dayAlerts.length,
        acknowledged: dayAlerts.filter(a => a.status === 'acknowledged').length,
        dismissed: dayAlerts.filter(a => a.status === 'dismissed').length
      });
    }
    
    return data;
  }, [triggeredAlerts]);

  // Top performing alerts
  const topAlerts = useMemo(() => {
    const alertPerformance = alerts.map(alert => {
      const triggered = triggeredAlerts.filter(ta => ta.alertId === alert.id);
      const acknowledged = triggered.filter(ta => ta.status === 'acknowledged');
      
      return {
        name: alert.name,
        triggered: triggered.length,
        acknowledged: acknowledged.length,
        accuracy: triggered.length > 0 ? (acknowledged.length / triggered.length) * 100 : 0,
        severity: alert.severity
      };
    }).sort((a, b) => b.accuracy - a.accuracy);

    return alertPerformance.slice(0, 5);
  }, [alerts, triggeredAlerts]);



  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Alert Dashboard</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Real Data Notice */}
      {statistics.totalAlerts === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Real-Time Data Dashboard</h3>
              <p className="text-sm text-blue-700 mt-1">
                This dashboard displays real data from your alert system. Create alerts to see performance metrics, 
                accuracy rates, and analytics. All data shown is live and updates automatically.
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Start by creating your first alert in the Management tab →
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Bell className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalAlerts}</p>
              <p className="text-sm text-gray-500">{statistics.activeAlerts} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.triggeredToday}</p>
              <p className="text-sm text-green-600">
                {statistics.accuracyRate.toFixed(1)}% accuracy
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.avgResponseTime > 0 ? `${statistics.avgResponseTime.toFixed(1)}m` : '--'}
              </p>
              <p className="text-sm text-gray-500">
                {statistics.avgResponseTime > 0 ? 'average' : 'no data yet'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alert P&L</p>
              <p className="text-2xl font-bold text-gray-600">--</p>
              <p className="text-sm text-gray-500">coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Alert Trend */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="alerts" fill="#3B82F6" name="Total Alerts" />
              <Bar dataKey="acknowledged" fill="#10B981" name="Acknowledged" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={alertTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {alertTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Severity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={severityDistribution} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="name" type="category" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performing Alerts */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Alerts</h3>
          <div className="space-y-3">
            {topAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{alert.name}</p>
                  <p className="text-xs text-gray-500">
                    {alert.triggered} triggered, {alert.acknowledged} acknowledged
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(alert.severity)} bg-gray-100`}>
                    {alert.severity}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {alert.accuracy.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Alert Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {triggeredAlerts
              .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
              .slice(0, 10)
              .map(alert => (
                <div key={alert.id} className="flex items-center space-x-3 py-2">
                  <div className="flex-shrink-0">
                    {alert.status === 'acknowledged' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : alert.status === 'dismissed' ? (
                      <XCircle className="w-5 h-5 text-gray-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {alert.title}
                      </p>
                      {alert.symbol && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {alert.symbol}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(alert.severity)} bg-gray-100`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.triggeredAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
} 