'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, X, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { TriggeredAlert } from '../types/alerts';
import { alertEngine } from '../lib/alertEngine';

interface FloatingAlertNotificationsProps {
  maxVisible?: number;
  autoHideDuration?: number; // in seconds
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function FloatingAlertNotifications({ 
  maxVisible = 3, 
  autoHideDuration = 15,
  position = 'top-right' 
}: FloatingAlertNotificationsProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<TriggeredAlert[]>([]);
  const [hiddenAlertIds, setHiddenAlertIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkForNewAlerts = () => {
      const allAlerts = alertEngine.getTriggeredAlerts()
        .filter(alert => alert.status === 'triggered')
        .filter(alert => !hiddenAlertIds.has(alert.id))
        .slice(0, maxVisible)
        .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());

      setVisibleAlerts(allAlerts);
    };

    checkForNewAlerts();
    const interval = setInterval(checkForNewAlerts, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [hiddenAlertIds, maxVisible]);

  // Auto-hide alerts after specified duration
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timers = visibleAlerts.map(alert => {
        const alertAge = Date.now() - new Date(alert.triggeredAt).getTime();
        const remainingTime = (autoHideDuration * 1000) - alertAge;
        
        if (remainingTime > 0) {
          return setTimeout(() => {
            setHiddenAlertIds(prev => new Set(prev).add(alert.id));
          }, remainingTime);
        }
        return null;
      }).filter(Boolean);

      return () => {
        timers.forEach(timer => timer && clearTimeout(timer));
      };
    }
  }, [visibleAlerts, autoHideDuration]);

  const handleDismissAlert = (alertId: string) => {
    setHiddenAlertIds(prev => new Set(prev).add(alertId));
    alertEngine.dismissAlert(alertId);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setHiddenAlertIds(prev => new Set(prev).add(alertId));
    alertEngine.acknowledgeAlert(alertId);
  };

  const getAlertIcon = (alert: TriggeredAlert) => {
    if (alert.type.includes('gain') || alert.type.includes('profit') || alert.type.includes('target')) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
    if (alert.type.includes('loss') || alert.type.includes('stop')) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    if (alert.severity === 'critical') {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (alert.severity === 'high') {
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
    return <Bell className="w-4 h-4 text-blue-500" />;
  };

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm w-full pointer-events-none`}>
      {visibleAlerts.map((alert, index) => (
        <div
          key={alert.id}
          className={`pointer-events-auto transform transition-all duration-300 ease-in-out animate-slide-in-right`}
          style={{ 
            animationDelay: `${index * 100}ms`,
            transform: `translateY(${index * 4}px)` 
          }}
        >
          <div className={`
            rounded-xl border-2 shadow-card backdrop-blur-sm p-4 
            ${getSeverityColors(alert.severity)}
            hover:shadow-card-hover transition-shadow duration-200
          `}>
            <div className="flex items-start space-x-3">
              {/* Alert Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert)}
              </div>
              
              {/* Alert Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold truncate pr-2">
                    {alert.title}
                  </h4>
                  <button
                    onClick={() => handleDismissAlert(alert.id)}
                    className="flex-shrink-0 p-1 hover:bg-black/10 rounded-full transition-colors"
                    title="Dismiss alert"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                
                <p className="text-xs opacity-90 mb-2 line-clamp-2">
                  {alert.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs opacity-75">
                    {alert.symbol && (
                      <span className="inline-block px-2 py-0.5 bg-black/10 rounded text-xs font-medium">
                        {alert.symbol}
                      </span>
                    )}
                    <Clock className="w-3 h-3" />
                    <span>{new Date(alert.triggeredAt).toLocaleTimeString()}</span>
                  </div>
                  
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="text-xs px-2 py-1 bg-black/10 hover:bg-black/20 rounded transition-colors font-medium"
                    title="Acknowledge alert"
                  >
                    ✓ Got it
                  </button>
                </div>
              </div>
            </div>
            
            {/* Progress bar for auto-hide */}
            {autoHideDuration > 0 && (
              <div className="mt-3 -mb-1 -mx-4">
                <div className="h-1 bg-black/10 rounded-b-xl overflow-hidden">
                  <div 
                    className="h-full bg-current opacity-50 animate-countdown"
                    style={{ 
                      animationDuration: `${autoHideDuration}s`,
                      animationDelay: `${(Date.now() - new Date(alert.triggeredAt).getTime()) / 1000}s`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* View All Link */}
      {visibleAlerts.length > 0 && (
        <div className="pointer-events-auto">
          <a
            href="/alerts"
            className="block text-center bg-white/90 backdrop-blur-sm text-gray-700 hover:text-gray-900 text-xs font-medium py-2 px-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-card"
          >
            View All Alerts →
          </a>
        </div>
      )}
    </div>
  );
} 