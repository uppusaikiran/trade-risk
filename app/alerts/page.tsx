'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Settings, BarChart3, List } from 'lucide-react';
import Navigation from '../../components/Navigation';
import UnifiedAlertsPage from '../../components/UnifiedAlertsPage';
import { AlertSystemDemo } from '../../components/AlertSystemExample';
import AlertManagement from '../../components/AlertManagement';
import AlertDashboard from '../../components/AlertDashboard';
import { TrackingService } from '../../lib/trackingService';
import { TrackingEntry } from '../../types/stock';

export default function AlertsPage() {
  const [activeView, setActiveView] = useState<'unified' | 'dashboard' | 'management'>('unified');
  const [positions, setPositions] = useState<TrackingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load positions for alert management
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
    const interval = setInterval(loadPositions, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation 
        currentPage="alerts" 
        pageTitle="Alert Center" 
        pageSubtitle="COMPLETE ALERT MANAGEMENT SYSTEM" 
      />

      {/* Background gradient matching homepage */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 -z-10"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5 -z-10"></div>

      {/* Main Content */}
      <div className="relative">
        <section className="relative py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Complete Alert 
                <span className="text-gradient"> Management System</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                View all alerts, manage trading alerts, and monitor risk alerts in one unified platform
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-2xl border border-white/20 shadow-card mb-8 max-w-2xl mx-auto">
              <button
                onClick={() => setActiveView('unified')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  activeView === 'unified'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <List className="w-4 h-4" />
                  <span>All Alerts</span>
                </div>
              </button>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  activeView === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </div>
              </button>
              <button
                onClick={() => setActiveView('management')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  activeView === 'management'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Create & Manage</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Tab Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {activeView === 'unified' && (
            <UnifiedAlertsPage />
          )}
          
          {activeView === 'dashboard' && (
            <AlertDashboard />
          )}
          
          {activeView === 'management' && (
            isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading positions...</span>
              </div>
            ) : (
              <AlertManagement 
                positions={positions}
                onAlertTriggered={(alert) => {
                  console.log('Alert triggered:', alert);
                }}
              />
            )
          )}
        </main>
      </div>
    </div>
  );
} 