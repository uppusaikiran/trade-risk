'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, Volume2 } from 'lucide-react';
import { TriggeredAlert, AlertSeverity } from '../types/alerts';

interface AlertNotificationProps {
  alerts: TriggeredAlert[];
  onDismiss: (alertId: string) => void;
  onAcknowledge: (alertId: string) => void;
  autoHideDuration?: number; // in seconds
}

const SEVERITY_CONFIG = {
  low: {
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    icon: Clock
  },
  medium: {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-600',
    icon: AlertTriangle
  },
  high: {
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-800',
    iconColor: 'text-orange-600',
    icon: TrendingDown
  },
  critical: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600',
    icon: AlertTriangle
  }
};

const ALERT_TYPE_ICONS = {
  percentage_gain: TrendingUp,
  dollar_profit: DollarSign,
  percentage_loss: TrendingDown,
  dollar_loss: DollarSign,
  volume_spike: Volume2,
  portfolio_heat: AlertTriangle,
  // Add more as needed
} as const;

export default function AlertNotification({ 
  alerts, 
  onDismiss, 
  onAcknowledge, 
  autoHideDuration = 10 
}: AlertNotificationProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<string[]>([]);
  const [timers, setTimers] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Show new alerts
  useEffect(() => {
    const newAlerts = alerts
      .filter(alert => alert.status === 'triggered')
      .filter(alert => !visibleAlerts.includes(alert.id));

    if (newAlerts.length > 0) {
      const newAlertIds = newAlerts.map(alert => alert.id);
      setVisibleAlerts(prev => [...prev, ...newAlertIds]);

      // Set auto-hide timers for non-critical alerts
      newAlerts.forEach(alert => {
        if (alert.severity !== 'critical') {
          const timer = setTimeout(() => {
            handleDismiss(alert.id);
          }, autoHideDuration * 1000);
          
          setTimers(prev => new Map(prev).set(alert.id, timer));
        }
      });
    }
  }, [alerts, visibleAlerts, autoHideDuration]);

  // Clean up timers
  useEffect(() => {
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [timers]);

  const handleDismiss = (alertId: string) => {
    // Clear timer if exists
    const timer = timers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      setTimers(prev => {
        const newTimers = new Map(prev);
        newTimers.delete(alertId);
        return newTimers;
      });
    }

    // Remove from visible alerts
    setVisibleAlerts(prev => prev.filter(id => id !== alertId));
    
    // Call parent dismiss handler
    onDismiss(alertId);
  };

  const handleAcknowledge = (alertId: string) => {
    handleDismiss(alertId);
    onAcknowledge(alertId);
  };

  const visibleAlertObjects = alerts.filter(alert => 
    visibleAlerts.includes(alert.id) && alert.status === 'triggered'
  );

  if (visibleAlertObjects.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {visibleAlertObjects.map(alert => {
        const config = SEVERITY_CONFIG[alert.severity];
        const SeverityIcon = config.icon;
        const TypeIcon = ALERT_TYPE_ICONS[alert.type as keyof typeof ALERT_TYPE_ICONS] || AlertTriangle;

        return (
          <div
            key={alert.id}
            className={`${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4 animate-slide-in-right`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <SeverityIcon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <TypeIcon className="w-4 h-4 text-gray-600" />
                  {alert.symbol && (
                    <span className="text-sm font-semibold text-gray-900">
                      {alert.symbol}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${config.bgColor} ${config.textColor}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                
                <h4 className={`text-sm font-medium ${config.textColor} mb-1`}>
                  {alert.title}
                </h4>
                
                <p className="text-sm text-gray-700 mb-2">
                  {alert.message}
                </p>

                {/* Alert Values */}
                {(alert.currentValue !== undefined || alert.targetValue !== undefined) && (
                  <div className="flex items-center space-x-4 text-xs text-gray-600 mb-3">
                    {alert.currentValue !== undefined && (
                      <span>Current: {formatValue(alert.currentValue, alert.type)}</span>
                    )}
                    {alert.targetValue !== undefined && (
                      <span>Target: {formatValue(alert.targetValue, alert.type)}</span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="text-xs bg-white text-gray-700 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Acknowledge
                  </button>
                  
                  {alert.severity !== 'critical' && (
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="text-xs text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      Dismiss
                    </button>
                  )}
                </div>

                {/* Auto-hide countdown for non-critical alerts */}
                {alert.severity !== 'critical' && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">
                      Auto-dismiss in {autoHideDuration}s
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div 
                        className="bg-gray-400 h-1 rounded-full animate-countdown"
                        style={{ 
                          animationDuration: `${autoHideDuration}s`,
                          animationTimingFunction: 'linear'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={() => handleDismiss(alert.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper function to format values based on alert type
function formatValue(value: number, alertType: string): string {
  if (alertType.includes('percentage') || alertType.includes('percent')) {
    return `${value.toFixed(2)}%`;
  }
  if (alertType.includes('dollar') || alertType.includes('profit') || alertType.includes('loss')) {
    return `$${value.toFixed(2)}`;
  }
  if (alertType.includes('ratio')) {
    return `${value.toFixed(2)}:1`;
  }
  if (alertType.includes('volume')) {
    return `${value.toFixed(1)}x`;
  }
  return value.toFixed(2);
}

// CSS for animations (add to your global CSS or Tailwind config)
const alertStyles = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes countdown {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}

.animate-countdown {
  animation: countdown linear;
}
`; 