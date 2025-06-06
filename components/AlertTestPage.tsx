'use client';

import React, { useState, useEffect } from 'react';
import { TestTube, Play, Trash2, Bell, CheckCircle, RefreshCw } from 'lucide-react';
import { alertEngine } from '@/lib/alertEngine';
import { TrackingService } from '@/lib/trackingService';
import { AlertConfiguration, TriggeredAlert } from '@/types/alerts';
import { TrackingEntry } from '@/types/stock';

export default function AlertTestPage() {
  const [positions, setPositions] = useState<TrackingEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertConfiguration[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const trackingPositions = TrackingService.getActiveEntries();
    const configuredAlerts = alertEngine.getAlerts();
    const triggered = alertEngine.getTriggeredAlerts();
    
    setPositions(trackingPositions);
    setAlerts(configuredAlerts);
    setTriggeredAlerts(triggered);
  };

  const testAlertEvaluation = async () => {
    setIsEvaluating(true);
    console.log('🧪 Starting manual alert evaluation test...');
    
    try {
      const newAlerts = await alertEngine.evaluateAlerts(positions);
      console.log('🎯 Test complete! New alerts:', newAlerts);
      loadData(); // Refresh data
    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const createTestAlert = () => {
    const testAlert: AlertConfiguration = {
      id: `test_alert_${Date.now()}`,
      type: 'percentage_gain',
      name: 'Test 1% Gain Alert',
      description: 'Test alert for 1% gain',
      conditions: [{ field: 'percentage_gain', operator: '>=', value: 1 }],
      severity: 'medium',
      enabled: true,
      createdAt: new Date().toISOString(),
      soundEnabled: true,
      emailEnabled: false,
      pushEnabled: true
    };
    
    alertEngine.addAlert(testAlert);
    loadData();
  };

  const simulatePriceIncrease = (positionId: string, increasePercent: number) => {
    const entries = TrackingService.getTrackingEntries();
    const position = entries.find(e => e.id === positionId);
    
    if (position) {
      const newPrice = position.entryPrice * (1 + increasePercent / 100);
      console.log(`📈 Simulating price change for ${position.symbol}: ${position.entryPrice} → ${newPrice.toFixed(2)} (+${increasePercent}%)`);
      
      TrackingService.updateTrackingEntry(positionId, {
        currentPrice: newPrice,
        currentProfit: (newPrice - position.entryPrice) * position.shares,
        currentROI: ((newPrice - position.entryPrice) / position.entryPrice) * 100
      });
      
      loadData();
    }
  };

  const refreshPositionPrices = async () => {
    console.log('🔄 Refreshing position prices...');
    await TrackingService.updateDailyPrices();
    loadData();
  };

  const clearAllAlerts = () => {
    const allAlerts = alertEngine.getAlerts();
    allAlerts.forEach(alert => alertEngine.removeAlert(alert.id));
    
    // Also clear triggered alerts
    alertEngine.clearOldAlerts(0);
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <TestTube className="w-6 h-6 mr-2 text-blue-600" />
              Alert System Testing
            </h1>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={testAlertEvaluation}
                disabled={isEvaluating}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-2" />
                {isEvaluating ? 'Testing...' : 'Test Alerts'}
              </button>
              <button
                onClick={createTestAlert}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Bell className="w-4 h-4 mr-2" />
                Add Test Alert
              </button>
              <button
                onClick={refreshPositionPrices}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Prices
              </button>
              <button
                onClick={clearAllAlerts}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </button>
            </div>
          </div>

          {/* Debug Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Active Positions</h3>
              <p className="text-2xl font-bold text-blue-600">{positions.length}</p>
              <p className="text-sm text-blue-700">Positions to monitor</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Enabled Alerts</h3>
              <p className="text-2xl font-bold text-green-600">
                {alerts.filter(a => a.enabled).length}
              </p>
              <p className="text-sm text-green-700">
                Total: {alerts.length}
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-2">Triggered Alerts</h3>
              <p className="text-2xl font-bold text-orange-600">{triggeredAlerts.length}</p>
              <p className="text-sm text-orange-700">All time</p>
            </div>
          </div>

          {/* Positions Detail */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Current Positions</h3>
            {positions.length === 0 ? (
              <p className="text-gray-500 italic">No active positions found. Add some positions to Portfolio Tracking first.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                                     <thead>
                     <tr className="border-b">
                       <th className="text-left p-2">Symbol</th>
                       <th className="text-left p-2">Entry Price</th>
                       <th className="text-left p-2">Current Price</th>
                       <th className="text-left p-2">Change %</th>
                       <th className="text-left p-2">Shares</th>
                       <th className="text-left p-2">Status</th>
                       <th className="text-left p-2">Test Actions</th>
                     </tr>
                   </thead>
                  <tbody>
                    {positions.map(position => {
                      const changePercent = position.currentPrice 
                        ? ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100
                        : 0;
                      return (
                        <tr key={position.id} className="border-b">
                          <td className="p-2 font-semibold">{position.symbol}</td>
                          <td className="p-2">${position.entryPrice.toFixed(2)}</td>
                          <td className="p-2">${(position.currentPrice || 0).toFixed(2)}</td>
                          <td className={`p-2 ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                          </td>
                          <td className="p-2">{position.shares}</td>
                                                     <td className="p-2">
                             <span className={`px-2 py-1 rounded text-xs ${
                               position.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                             }`}>
                               {position.status}
                             </span>
                           </td>
                           <td className="p-2">
                             <div className="flex gap-1">
                               <button
                                 onClick={() => simulatePriceIncrease(position.id, 2)}
                                 className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                 title="Simulate +2% gain"
                               >
                                 +2%
                               </button>
                               <button
                                 onClick={() => simulatePriceIncrease(position.id, 5)}
                                 className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                 title="Simulate +5% gain"
                               >
                                 +5%
                               </button>
                               <button
                                 onClick={() => simulatePriceIncrease(position.id, -3)}
                                 className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                 title="Simulate -3% loss"
                               >
                                 -3%
                               </button>
                             </div>
                           </td>
                         </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Alerts Detail */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Configured Alerts</h3>
            {alerts.length === 0 ? (
              <p className="text-gray-500 italic">No alerts configured.</p>
            ) : (
              <div className="space-y-2">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{alert.name}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          alert.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className="text-xs text-gray-500">{alert.type}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                      <p className="text-xs text-gray-500">
                        Conditions: {alert.conditions.map(c => `${c.field} ${c.operator} ${c.value}`).join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        alertEngine.removeAlert(alert.id);
                        loadData();
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Triggered Alerts */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Triggered Alerts</h3>
            {triggeredAlerts.length === 0 ? (
              <p className="text-gray-500 italic">No alerts have been triggered yet.</p>
            ) : (
              <div className="space-y-2">
                {triggeredAlerts.slice().reverse().map(alert => (
                  <div key={alert.id} className={`p-3 border rounded-lg ${
                    alert.status === 'triggered' ? 'bg-red-50 border-red-200' : 
                    alert.status === 'acknowledged' ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{alert.title}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            alert.status === 'triggered' ? 'bg-red-100 text-red-800' :
                            alert.status === 'acknowledged' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {alert.status}
                          </span>
                          {alert.symbol && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {alert.symbol}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500">
                          Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                        </p>
                      </div>
                      {alert.status === 'triggered' && (
                        <button
                          onClick={() => {
                            alertEngine.acknowledgeAlert(alert.id);
                            loadData();
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 