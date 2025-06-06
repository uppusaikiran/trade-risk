'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Settings, TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, Volume2, VolumeX, BarChart3, Activity, Shield, Brain } from 'lucide-react';
import { 
  AlertConfiguration, 
  TriggeredAlert, 
  AlertType, 
  AlertSeverity,
  AlertPreferences 
} from '../types/alerts';
import { alertEngine } from '../lib/alertEngine';
import { TrackingEntry } from '../types/stock';

interface AlertManagementProps {
  positions: TrackingEntry[];
  onAlertTriggered?: (alert: TriggeredAlert) => void;
}

const ALERT_CATEGORIES = {
  'Profit Taking': {
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    types: ['percentage_gain', 'dollar_profit', 'risk_reward_ratio', 'price_target', 'resistance_breach', 'round_number', 'trailing_stop', 'fibonacci_profit', 'ma_profit']
  },
  'Stop Loss': {
    icon: TrendingDown,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    types: ['percentage_loss', 'dollar_loss', 'atr_stop', 'support_break', 'ma_stop']
  },
  'Risk Management': {
    icon: Shield,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    types: ['position_size_risk', 'portfolio_heat', 'margin_call_risk', 'correlation_risk', 'sector_concentration', 'max_drawdown']
  },
  'Time Based': {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    types: ['holding_period', 'end_of_day', 'max_hold_time', 'weekend_risk', 'earnings_date']
  },
  'Technical': {
    icon: BarChart3,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    types: ['rsi_overbought', 'rsi_oversold', 'macd_cross', 'ma_cross', 'bollinger_signal', 'stochastic_signal', 'williams_r', 'cci_extreme']
  },
  'Volume': {
    icon: Activity,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    types: ['volume_spike', 'volume_dryup', 'obv_divergence', 'mfi_signal', 'vwap_alert']
  },
  'Market Conditions': {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    types: ['vix_spike', 'volatility_expansion', 'market_regime_change', 'sector_rotation', 'market_breadth']
  },
  'Behavioral': {
    icon: Brain,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    types: ['revenge_trading', 'fomo_warning', 'overconfidence', 'analysis_paralysis']
  }
};

const ALERT_TEMPLATES = [
  {
    name: 'Conservative Trader',
    description: 'Basic profit/loss alerts with low risk tolerance',
    alerts: [
      { type: 'percentage_gain', threshold: 5 },
      { type: 'percentage_loss', threshold: -3 },
      { type: 'portfolio_heat', threshold: 15 }
    ]
  },
  {
    name: 'Active Day Trader',
    description: 'Quick profit taking with tight stops',
    alerts: [
      { type: 'percentage_gain', threshold: 2 },
      { type: 'percentage_loss', threshold: -1 },
      { type: 'end_of_day', threshold: 30 },
      { type: 'volume_spike', threshold: 3 }
    ]
  },
  {
    name: 'Swing Trader',
    description: 'Medium-term alerts with technical analysis',
    alerts: [
      { type: 'percentage_gain', threshold: 10 },
      { type: 'percentage_loss', threshold: -5 },
      { type: 'rsi_overbought', threshold: 70 },
      { type: 'ma_cross', threshold: 0 }
    ]
  },
  {
    name: 'Risk Manager',
    description: 'Comprehensive risk monitoring',
    alerts: [
      { type: 'portfolio_heat', threshold: 20 },
      { type: 'correlation_risk', threshold: 0.7 },
      { type: 'max_drawdown', threshold: 10 },
      { type: 'margin_call_risk', threshold: 25 }
    ]
  }
];

export default function AlertManagement({ positions, onAlertTriggered }: AlertManagementProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'create' | 'templates' | 'settings'>('alerts');
  const [alerts, setAlerts] = useState<AlertConfiguration[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Profit Taking');
  const [alertForm, setAlertForm] = useState({
    type: '' as AlertType,
    name: '',
    description: '',
    symbol: '',
    threshold: 0,
    severity: 'medium' as AlertSeverity,
    enabled: true,
    soundEnabled: true,
    emailEnabled: false,
    pushEnabled: true
  });
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  // Load alerts on component mount
  useEffect(() => {
    const loadedAlerts = alertEngine.getAlerts();
    const loadedTriggeredAlerts = alertEngine.getTriggeredAlerts();
    setAlerts(loadedAlerts);
    setTriggeredAlerts(loadedTriggeredAlerts);
  }, []);

  // Evaluate alerts periodically
  useEffect(() => {
    const evaluateAlerts = async () => {
      try {
        const newAlerts = await alertEngine.evaluateAlerts(positions);
        if (newAlerts.length > 0) {
          setTriggeredAlerts(prev => [...prev, ...newAlerts]);
          newAlerts.forEach(alert => {
            if (onAlertTriggered) {
              onAlertTriggered(alert);
            }
            // Play sound if enabled
            if (alert.severity === 'high' || alert.severity === 'critical') {
              playAlertSound();
            }
          });
        }
      } catch (error) {
        console.error('Error evaluating alerts:', error);
      }
    };

    const interval = setInterval(evaluateAlerts, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [positions, onAlertTriggered]);

  const playAlertSound = useCallback(() => {
    const audio = new Audio('/alert-sound.mp3'); // You'll need to add this sound file
    audio.play().catch(e => console.log('Could not play alert sound:', e));
  }, []);

  const handleCreateAlert = () => {
    if (!alertForm.type || !alertForm.name) return;

    if (editingAlertId) {
      // Update existing alert
      const success = alertEngine.updateAlert(editingAlertId, {
        type: alertForm.type,
        name: alertForm.name,
        description: alertForm.description,
        symbol: alertForm.symbol || undefined,
        conditions: [
          {
            field: getFieldForAlertType(alertForm.type),
            operator: alertForm.type.includes('loss') ? '<=' : '>=',
            value: alertForm.threshold
          }
        ],
        severity: alertForm.severity,
        enabled: alertForm.enabled,
        soundEnabled: alertForm.soundEnabled,
        emailEnabled: alertForm.emailEnabled,
        pushEnabled: alertForm.pushEnabled
      });

      if (success) {
        setAlerts(alertEngine.getAlerts());
        setEditingAlertId(null);
      }
    } else {
      // Create new alert
      const newAlert: AlertConfiguration = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: alertForm.type,
        name: alertForm.name,
        description: alertForm.description,
        symbol: alertForm.symbol || undefined,
        conditions: [
          {
            field: getFieldForAlertType(alertForm.type),
            operator: alertForm.type.includes('loss') ? '<=' : '>=',
            value: alertForm.threshold
          }
        ],
        severity: alertForm.severity,
        enabled: alertForm.enabled,
        createdAt: new Date().toISOString(),
        soundEnabled: alertForm.soundEnabled,
        emailEnabled: alertForm.emailEnabled,
        pushEnabled: alertForm.pushEnabled
      };

      alertEngine.addAlert(newAlert);
      setAlerts(alertEngine.getAlerts());
    }
    
    // Reset form
    resetForm();
  };

  const resetForm = () => {
    setAlertForm({
      type: '' as AlertType,
      name: '',
      description: '',
      symbol: '',
      threshold: 0,
      severity: 'medium',
      enabled: true,
      soundEnabled: true,
      emailEnabled: false,
      pushEnabled: true
    });
    setEditingAlertId(null);
  };

  const handleEditAlert = (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      // Extract threshold from conditions
      const threshold = alert.conditions.length > 0 ? alert.conditions[0].value as number : 0;
      
      // Populate form with alert data
      setAlertForm({
        type: alert.type,
        name: alert.name,
        description: alert.description || '',
        symbol: alert.symbol || '',
        threshold: threshold,
        severity: alert.severity,
        enabled: alert.enabled,
        soundEnabled: alert.soundEnabled || true,
        emailEnabled: alert.emailEnabled || false,
        pushEnabled: alert.pushEnabled || true
      });
      
      // Find the correct category for this alert type
      const category = Object.keys(ALERT_CATEGORIES).find(cat => 
        ALERT_CATEGORIES[cat as keyof typeof ALERT_CATEGORIES].types.includes(alert.type)
      );
      if (category) {
        setSelectedCategory(category);
      }
      
      setEditingAlertId(alertId);
      setActiveTab('create');
    }
  };

  const handleDeleteAlert = (alertId: string) => {
    alertEngine.removeAlert(alertId);
    setAlerts(alertEngine.getAlerts());
  };

  const handleToggleAlert = (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      // Update the alert in alertEngine
      const success = alertEngine.updateAlert(alertId, { enabled: !alert.enabled });
      
      if (success) {
        // Update local state to reflect the change
        setAlerts(alertEngine.getAlerts());
      }
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    alertEngine.acknowledgeAlert(alertId);
    setTriggeredAlerts(alertEngine.getTriggeredAlerts());
  };

  const handleDismissAlert = (alertId: string) => {
    alertEngine.dismissAlert(alertId);
    setTriggeredAlerts(alertEngine.getTriggeredAlerts());
  };

  const applyTemplate = (template: any) => {
    template.alerts.forEach((alertConfig: any) => {
      const newAlert: AlertConfiguration = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: alertConfig.type,
        name: `${template.name} - ${getAlertTypeLabel(alertConfig.type)}`,
        description: `Auto-created from ${template.name} template`,
        conditions: [
          {
            field: getFieldForAlertType(alertConfig.type),
            operator: alertConfig.type.includes('loss') ? '<=' : '>=',
            value: alertConfig.threshold
          }
        ],
        severity: getSeverityForAlertType(alertConfig.type),
        enabled: true,
        createdAt: new Date().toISOString(),
        soundEnabled: true,
        emailEnabled: false,
        pushEnabled: true
      };
      alertEngine.addAlert(newAlert);
    });
    setAlerts(alertEngine.getAlerts());
  };

  const getFieldForAlertType = (type: AlertType): string => {
    const fieldMap: Record<string, string> = {
      'percentage_gain': 'percentage_gain',
      'percentage_loss': 'percentage_loss',
      'dollar_profit': 'dollar_profit',
      'dollar_loss': 'dollar_loss',
      'price_target': 'price_target',
      'portfolio_heat': 'portfolio_heat',
      'volume_spike': 'volume_multiplier',
      'vix_spike': 'vix_threshold',
      'rsi_overbought': 'rsi_threshold',
      'rsi_oversold': 'rsi_threshold'
    };
    return fieldMap[type] || type;
  };

  const getAlertTypeLabel = (type: AlertType): string => {
    const labelMap: Record<string, string> = {
      'percentage_gain': 'Percentage Gain',
      'percentage_loss': 'Percentage Loss',
      'dollar_profit': 'Dollar Profit',
      'dollar_loss': 'Dollar Loss',
      'price_target': 'Price Target',
      'portfolio_heat': 'Portfolio Heat',
      'volume_spike': 'Volume Spike',
      'vix_spike': 'VIX Spike',
      'rsi_overbought': 'RSI Overbought',
      'rsi_oversold': 'RSI Oversold'
    };
    return labelMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSeverityForAlertType = (type: AlertType): AlertSeverity => {
    if (type.includes('loss') || type.includes('risk') || type.includes('margin')) {
      return 'high';
    }
    if (type.includes('profit') || type.includes('gain')) {
      return 'medium';
    }
    return 'low';
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    const colors = {
      low: 'text-blue-600 bg-blue-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[severity];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-600 bg-green-100',
      triggered: 'text-red-600 bg-red-100',
      acknowledged: 'text-blue-600 bg-blue-100',
      dismissed: 'text-gray-600 bg-gray-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'alerts', label: 'Active Alerts', icon: Bell },
            { id: 'create', label: 'Create Alert', icon: Settings },
            { id: 'templates', label: 'Templates', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* Triggered Alerts */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {triggeredAlerts
                  .filter(alert => alert.status === 'triggered')
                  .slice(0, 5)
                  .map(alert => (
                    <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                            {alert.symbol && (
                              <span className="text-sm font-medium text-gray-900">{alert.symbol}</span>
                            )}
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 mt-1">{alert.title}</h4>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.triggeredAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleDismissAlert(alert.id)}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Active Alert Configurations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Rules</h3>
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${alert.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {alert.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          {alert.symbol && (
                            <span className="text-sm font-medium text-gray-900">{alert.symbol}</span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 mt-1">{alert.name}</h4>
                        <p className="text-sm text-gray-600">{alert.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleAlert(alert.id)}
                          className={`text-xs px-3 py-1 rounded ${
                            alert.enabled 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {alert.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleEditAlert(alert.id)}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAlertId ? 'Edit Alert' : 'Create New Alert'}
              </h3>
              {editingAlertId && (
                <button
                  onClick={resetForm}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alert Category</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(ALERT_CATEGORIES).map(([category, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`p-3 rounded-lg border text-left ${
                        selectedCategory === category
                          ? `${config.bgColor} border-current ${config.color}`
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${selectedCategory === category ? config.color : 'text-gray-400'}`} />
                      <div className="text-sm font-medium">{category}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alert Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
              <select
                value={alertForm.type}
                onChange={(e) => setAlertForm(prev => ({ ...prev, type: e.target.value as AlertType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select alert type</option>
                                 {(ALERT_CATEGORIES[selectedCategory as keyof typeof ALERT_CATEGORIES]?.types || []).map((type: string) => (
                   <option key={type} value={type}>
                     {getAlertTypeLabel(type as AlertType)}
                   </option>
                 ))}
              </select>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Name</label>
                <input
                  type="text"
                  value={alertForm.name}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter alert name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol (Optional)</label>
                <input
                  type="text"
                  value={alertForm.symbol}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="AAPL, TSLA, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
                <input
                  type="number"
                  value={alertForm.threshold}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter threshold value"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  value={alertForm.severity}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, severity: e.target.value as AlertSeverity }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={alertForm.description}
                onChange={(e) => setAlertForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe when this alert should trigger"
              />
            </div>

            {/* Notification Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notification Methods</label>
              <div className="space-y-2">
                {[
                  { key: 'soundEnabled', label: 'Sound Alert', icon: Volume2 },
                  { key: 'pushEnabled', label: 'Push Notification', icon: Bell },
                  { key: 'emailEnabled', label: 'Email Alert', icon: DollarSign }
                ].map(option => {
                  const Icon = option.icon;
                  return (
                    <label key={option.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={alertForm[option.key as keyof typeof alertForm] as boolean}
                        onChange={(e) => setAlertForm(prev => ({ ...prev, [option.key]: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleCreateAlert}
              disabled={!alertForm.type || !alertForm.name}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {editingAlertId ? 'Update Alert' : 'Create Alert'}
            </button>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Alert Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ALERT_TEMPLATES.map(template => (
                <div key={template.name} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="space-y-1 mb-4">
                    {template.alerts.map((alert, index) => (
                      <div key={index} className="text-xs text-gray-500">
                        • {getAlertTypeLabel(alert.type as AlertType)}: {alert.threshold}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => applyTemplate(template)}
                    className="w-full bg-blue-100 text-blue-700 py-2 px-3 rounded text-sm hover:bg-blue-200"
                  >
                    Apply Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Alert Settings</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Alert settings and preferences will be implemented here. This includes:
              </p>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Quiet hours configuration</li>
                <li>Maximum alerts per day</li>
                <li>Alert frequency batching</li>
                <li>Severity filtering</li>
                <li>Category filtering</li>
                <li>Default notification methods</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 