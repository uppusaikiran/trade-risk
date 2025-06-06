'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Settings, BarChart3 } from 'lucide-react';
import { TrackingEntry } from '../types/stock';
import { TriggeredAlert } from '../types/alerts';
import AlertManagement from './AlertManagement';
import AlertNotification from './AlertNotification';
import AlertDashboard from './AlertDashboard';
import { alertEngine } from '../lib/alertEngine';
import { TrackingService } from '../lib/trackingService';

interface AlertSystemExampleProps {
  positions: TrackingEntry[];
}

export default function AlertSystemExample({ positions }: AlertSystemExampleProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'management'>('dashboard');
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);

  // Load triggered alerts
  useEffect(() => {
    const loadAlerts = () => {
      const alerts = alertEngine.getTriggeredAlerts().filter(alert => alert.status === 'triggered');
      setTriggeredAlerts(alerts);
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAlertTriggered = (alert: TriggeredAlert) => {
    setTriggeredAlerts(prev => [...prev, alert]);
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id
      });
    }

    // Log for debugging
    console.log('Alert triggered:', alert);
  };

  const handleDismissAlert = (alertId: string) => {
    alertEngine.dismissAlert(alertId);
    setTriggeredAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    alertEngine.acknowledgeAlert(alertId);
    setTriggeredAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-4">
              <Bell className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {alertEngine.getAlerts().filter(a => a.enabled).length} Active Alerts
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Manage Your 
              <span className="text-gradient"> Trading Alerts</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Monitor your positions with real-time alerts for profit targets, stop losses, 
              and risk management notifications
            </p>
          </div>

          {/* Tab Navigation - Enhanced Design */}
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-2xl border border-white/20 shadow-card mb-8 max-w-md mx-auto">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                activeView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView('management')}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                activeView === 'management'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Management</span>
              </div>
            </button>
          </div>

          {/* Notification Toggle */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                showNotifications
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-white/60 text-gray-600 border border-white/20 hover:bg-white/80'
              }`}
              title="Toggle notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">
                {showNotifications ? 'Notifications On' : 'Notifications Off'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeView === 'dashboard' ? (
          <AlertDashboard />
        ) : (
          <AlertManagement 
            positions={positions}
            onAlertTriggered={handleAlertTriggered}
          />
        )}
      </main>

      {/* Alert Notifications */}
      {showNotifications && (
        <AlertNotification
          alerts={triggeredAlerts}
          onDismiss={handleDismissAlert}
          onAcknowledge={handleAcknowledgeAlert}
          autoHideDuration={10}
        />
      )}

      {/* Sample Quick Setup Guide */}
      {alertEngine.getAlerts().length === 0 && (
        <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-blue-200 rounded-2xl p-6 max-w-sm shadow-card">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Get Started</h4>
              <p className="text-sm text-gray-600 mb-3">
                No alerts configured yet. Create your first alert to start monitoring your trades.
              </p>
              <button
                onClick={() => setActiveView('management')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Example usage with real portfolio data
export function AlertSystemDemo() {
  const [positions, setPositions] = useState<TrackingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real portfolio positions from TrackingService
  useEffect(() => {
    const loadPositions = () => {
      try {
        const trackingEntries = TrackingService.getActiveEntries();
        setPositions(trackingEntries);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading portfolio positions:', error);
        setIsLoading(false);
      }
    };

    loadPositions();
    // Reload positions every 30 seconds to get updates
    const interval = setInterval(loadPositions, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading portfolio positions...</p>
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Positions</h2>
          <p className="text-gray-600 mb-6">
            You don't have any active positions in your portfolio tracking. Add some positions first to set up alerts.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Portfolio Tracking
          </a>
        </div>
      </div>
    );
  }

  return <AlertSystemExample positions={positions} />;
} 