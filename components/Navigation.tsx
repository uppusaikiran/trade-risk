'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Bell, AlertTriangle, Zap, Home, BarChart3 } from 'lucide-react';
import { alertEngine } from '../lib/alertEngine';
import { TriggeredAlert } from '../types/alerts';
import { UnifiedAlertService, UnifiedAlert } from '../lib/unifiedAlertService';

interface NavigationProps {
  currentPage?: 'home' | 'alerts' | 'dashboard';
  showBackButton?: boolean;
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function Navigation({ 
  currentPage = 'home', 
  showBackButton = false,
  pageTitle = 'TradeRisk Pro',
  pageSubtitle = 'MARGIN TRADING CALCULATOR'
}: NavigationProps) {
  const [recentAlerts, setRecentAlerts] = useState<UnifiedAlert[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load recent alerts
  useEffect(() => {
    const loadAlerts = () => {
      const alerts = UnifiedAlertService.getAllAlerts()
        .filter(alert => alert.status === 'triggered')
        .slice(0, 3); // Show only 3 most recent
      setRecentAlerts(alerts);
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const navigationItems = [
    { id: 'home', label: 'Dashboard', href: '/', icon: Home },
    { id: 'alerts', label: 'Alerts', href: '/alerts', icon: Bell },
    { id: 'dashboard', label: 'Analytics', href: '/dashboard', icon: BarChart3 }
  ];

  return (
    <header className="glass-effect shadow-lg border-b border-white/20 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="relative">
                <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 blur"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">{pageTitle}</h1>
                <span className="text-xs text-gray-500 font-medium tracking-wide">{pageSubtitle}</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-6 ml-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.id === 'alerts' && recentAlerts.length > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {recentAlerts.length}
                      </span>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {/* Alert Summary - Quick View */}
            <div className="relative group">
              <a
                href="/alerts"
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                <div className="relative">
                  <Bell className="w-4 h-4 text-blue-500" />
                  {recentAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  Alerts {recentAlerts.length > 0 && `(${recentAlerts.length})`}
                </span>
              </a>
              
              {/* Quick Alert Preview Dropdown */}
              {recentAlerts.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Recent Alerts</span>
                      <span className="text-xs text-gray-500">{recentAlerts.length} active</span>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {recentAlerts.map((alert) => (
                      <div key={alert.id} className="p-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className={`w-4 h-4 mt-0.5 ${
                            alert.severity === 'critical' ? 'text-red-500' :
                            alert.severity === 'high' ? 'text-orange-500' :
                            alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{alert.message}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">
                                {alert.symbol && `${alert.symbol} • `}
                                {new Date(alert.triggeredAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-100">
                    <a 
                      href="/alerts" 
                      className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All Alerts →
                    </a>
                  </div>
                </div>
              )}
            </div>
            


            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm">
            <div className="px-4 py-3 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {item.id === 'alerts' && recentAlerts.length > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {recentAlerts.length}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 