'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Shield, 
  AlertTriangle,
  Calendar,
  Trash2,
  RefreshCw,
  Play,
  StopCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  X,
  Bell,
  BellOff,
  Timer
} from 'lucide-react';
import { TrackingEntry, RiskAlert } from '@/types/stock';
import { TrackingService } from '@/lib/trackingService';
import { useNotifications } from './NotificationProvider';
import { ConfirmationDialog } from './ConfirmationDialog';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatPercent = (percent: number) => {
  if (!isFinite(percent) || isNaN(percent)) return '0.00%';
  return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
};

const StatusBadge = ({ status }: { status: 'active' | 'completed' | 'stopped' | 'expired' }) => {
  const statusConfig = {
    active: { icon: Play, color: 'text-blue-600 bg-blue-50 border-blue-200', text: 'Active' },
    completed: { icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200', text: 'Completed' },
    stopped: { icon: StopCircle, color: 'text-red-600 bg-red-50 border-red-200', text: 'Stopped' },
    expired: { icon: Clock, color: 'text-orange-600 bg-orange-50 border-orange-200', text: 'Expired' }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
    </div>
  );
};

const RiskAlertBadge = ({ 
  alert, 
  onAcknowledge 
}: { 
  alert: RiskAlert; 
  onAcknowledge: (alertId: string) => void; 
}) => {
  const severityConfig = {
    low: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    medium: 'bg-orange-50 border-orange-200 text-orange-800',
    high: 'bg-red-50 border-red-200 text-red-800'
  };

  const severityColor = severityConfig[alert.severity];

  return (
    <div className={`p-3 rounded-lg border ${severityColor} mb-2`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <div>
            <p className="text-sm font-medium">{alert.message}</p>
            <p className="text-xs opacity-75 mt-1">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="p-1 hover:bg-white/50 rounded"
          title="Acknowledge alert"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const RenewalDialog = ({ 
  isOpen, 
  entry, 
  onRenew, 
  onCancel 
}: { 
  isOpen: boolean; 
  entry: TrackingEntry | null;
  onRenew: (days: number) => void;
  onCancel: () => void;
}) => {
  const [days, setDays] = useState(30);

  if (!isOpen || !entry) return null;

  const expirationDate = entry.expirationDate ? new Date(entry.expirationDate) : null;
  const daysUntilExpiry = expirationDate ? 
    Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Renew Tracking</h3>
        <p className="text-gray-600 mb-4">
          Extend tracking for <strong>{entry.symbol}</strong>
          {daysUntilExpiry <= 0 ? ' (expired)' : ` (expires in ${daysUntilExpiry} days)`}
        </p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Days
          </label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="1"
            max="365"
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => onRenew(days)}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Renew for {days} days
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const TrackingCard = ({ 
  entry, 
  onRemove, 
  onRefresh,
  onRenew
}: { 
  entry: TrackingEntry; 
  onRemove: (id: string) => void;
  onRefresh: (id: string) => void;
  onRenew: (id: string) => void;
}) => {
  const profitColor = (entry.currentProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600';
  const roiColor = (entry.currentROI || 0) >= 0 ? 'text-green-600' : 'text-red-600';
  
  // Fix margin call calculation - Using standard 25% maintenance requirement
  const marginCallPrice = entry.shares > 0 ? (entry.marginUsed * 4/3) / entry.shares : 0;
  const isMarginCallRisk = (entry.currentPrice || 0) <= marginCallPrice;

  // Calculate days until expiration
  const expirationDate = entry.expirationDate ? new Date(entry.expirationDate) : null;
  const daysUntilExpiry = expirationDate ? 
    Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  // Filter unacknowledged risk alerts
  const activeAlerts = (entry.riskAlerts || []).filter(alert => !alert.acknowledged);

  const handleAcknowledgeAlert = (alertId: string) => {
    TrackingService.acknowledgeRiskAlert(entry.id, alertId);
    // You might want to refresh the data here or use a callback
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-card hover:shadow-card-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">{entry.symbol[0]}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{entry.symbol}</h3>
            <p className="text-sm text-gray-600">{entry.stockName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <StatusBadge status={entry.status} />
          {entry.status === 'expired' && (
            <button
              onClick={() => onRenew(entry.id)}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Renew tracking"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onRefresh(entry.id)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(entry.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove tracking"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Risk Alerts */}
      {activeAlerts.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Bell className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">Risk Alerts ({activeAlerts.length})</span>
          </div>
          {activeAlerts.map(alert => (
            <RiskAlertBadge
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledgeAlert}
            />
          ))}
        </div>
      )}

      {/* Expiration Warning */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 7 && entry.status === 'active' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-yellow-600" />
            <span className="text-yellow-800 text-sm font-medium">
              {daysUntilExpiry <= 0 ? 'Trade has expired' : `Expires in ${daysUntilExpiry} days`}
            </span>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Current Price</p>
          <p className="font-bold text-gray-900">{formatCurrency(entry.currentPrice || 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Entry Price</p>
          <p className="font-bold text-gray-900">{formatCurrency(entry.entryPrice)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Current P&L</p>
          <p className={`font-bold ${profitColor}`}>
            {formatCurrency(entry.currentProfit || 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">ROI</p>
          <p className={`font-bold ${roiColor}`}>
            {formatPercent(entry.currentROI || 0)}
          </p>
        </div>
      </div>

      {/* Trade Details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Shares: {entry.shares}</span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Margin: {formatCurrency(entry.marginUsed)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Days: {entry.daysElapsed || 0}</span>
        </div>
      </div>

      {/* Warning Messages */}
      {isMarginCallRisk && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-red-800 text-sm font-medium">
              Margin Call Risk - Price below {formatCurrency(marginCallPrice)}
            </span>
          </div>
        </div>
      )}

      {/* Exit Conditions */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">Target</span>
          </div>
          <span className="font-medium text-gray-900">{formatCurrency(entry.exitPrice)}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">Stop Loss</span>
          </div>
          <span className="font-medium text-gray-900">{formatCurrency(entry.stopLoss)}</span>
        </div>
      </div>

      {/* Interest Cost */}
      {(entry.totalInterestPaid || 0) > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Interest Paid</span>
            <span className="text-red-600 font-medium">{formatCurrency(entry.totalInterestPaid || 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TrackingDashboard() {
  const [trackingEntries, setTrackingEntries] = useState<TrackingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    entryId: string;
    entrySymbol: string;
  }>({ isOpen: false, entryId: '', entrySymbol: '' });
  const [renewalDialog, setRenewalDialog] = useState<{
    isOpen: boolean;
    entry: TrackingEntry | null;
  }>({ isOpen: false, entry: null });

  const { addNotification } = useNotifications();

  const loadTrackingEntries = () => {
    const entries = TrackingService.getTrackingEntries();
    setTrackingEntries(entries);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTrackingEntries();
  }, []);

  const handleRemoveEntry = (id: string) => {
    const entry = trackingEntries.find(e => e.id === id);
    if (entry) {
      setDeleteConfirmation({
        isOpen: true,
        entryId: id,
        entrySymbol: entry.symbol,
      });
    }
  };

  const handleRenewEntry = (id: string) => {
    const entry = trackingEntries.find(e => e.id === id);
    if (entry) {
      setRenewalDialog({
        isOpen: true,
        entry: entry,
      });
    }
  };

  const confirmRenewal = (days: number) => {
    if (renewalDialog.entry) {
      TrackingService.renewTrackingEntry(renewalDialog.entry.id, days);
      loadTrackingEntries();
      setRenewalDialog({ isOpen: false, entry: null });
      addNotification({
        type: 'success',
        title: 'Tracking Renewed',
        message: `${renewalDialog.entry.symbol} tracking extended by ${days} days.`,
        duration: 3000,
      });
    }
  };

  const cancelRenewal = () => {
    setRenewalDialog({ isOpen: false, entry: null });
  };

  const confirmDelete = () => {
    TrackingService.removeTrackingEntry(deleteConfirmation.entryId);
    loadTrackingEntries();
    setDeleteConfirmation({ isOpen: false, entryId: '', entrySymbol: '' });
    addNotification({
      type: 'success',
      title: 'Entry Removed',
      message: `${deleteConfirmation.entrySymbol} tracking has been successfully removed.`,
      duration: 3000,
    });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, entryId: '', entrySymbol: '' });
  };

  const handleRefreshEntry = async (id: string) => {
    setIsRefreshing(true);
    try {
      const entry = trackingEntries.find(e => e.id === id);
      if (entry) {
        const stockData = await fetch(`/api/stock?symbol=${entry.symbol}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`Failed to fetch data for ${entry.symbol}`);
            }
            return res.json();
          });
        
        const updatedEntry = TrackingService.calculateDailyUpdate(entry, stockData);
        TrackingService.updateTrackingEntry(id, updatedEntry);
        loadTrackingEntries();
        addNotification({
          type: 'success',
          title: 'Data Refreshed',
          message: `Updated data for ${entry.symbol}`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error refreshing entry:', error);
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh data. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await TrackingService.updateDailyPrices();
      loadTrackingEntries();
      addNotification({
        type: 'success',
        title: 'All Data Refreshed',
        message: 'Successfully updated all tracking entries',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error refreshing all entries:', error);
      addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh all data. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeEntries = trackingEntries.filter(entry => entry.status === 'active');
  const expiredEntries = trackingEntries.filter(entry => entry.status === 'expired');
  const completedEntries = trackingEntries.filter(entry => entry.status !== 'active' && entry.status !== 'expired');

  // Get high-severity unacknowledged alerts
  const criticalAlerts = trackingEntries
    .flatMap(entry => (entry.riskAlerts || []))
    .filter(alert => !alert.acknowledged && alert.severity === 'high')
    .length;

  const totalCurrentValue = activeEntries.reduce((sum, entry) => sum + (entry.currentProfit || 0), 0);
  const totalInvested = activeEntries.reduce((sum, entry) => sum + entry.ownCash, 0);
  const totalROI = totalInvested > 0 ? (totalCurrentValue / totalInvested) * 100 : 0;

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading tracking data...</p>
      </div>
    );
  }

  if (trackingEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tracking Entries</h3>
        <p className="text-gray-600">
          Start tracking stocks by using the "Track" button when analyzing a stock.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Tracking</h2>
          <p className="text-gray-600">
            Monitor your paper trades and margin positions
            {criticalAlerts > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                <Bell className="w-3 h-3 mr-1" />
                {criticalAlerts} critical alerts
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh All
        </button>
      </div>

      {/* Portfolio Summary */}
      {activeEntries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-600">Total P&L</span>
            </div>
            <p className={`text-2xl font-bold ${totalCurrentValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalCurrentValue)}
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-600">Total Invested</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalInvested)}
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-600">Portfolio ROI</span>
            </div>
            <p className={`text-2xl font-bold ${totalROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(totalROI)}
            </p>
          </div>
        </div>
      )}

      {/* Active Entries */}
      {activeEntries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Active Positions ({activeEntries.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeEntries.map(entry => (
              <TrackingCard
                key={entry.id}
                entry={entry}
                onRemove={handleRemoveEntry}
                onRefresh={handleRefreshEntry}
                onRenew={handleRenewEntry}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expired Entries */}
      {expiredEntries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span>Expired Positions ({expiredEntries.length})</span>
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {expiredEntries.map(entry => (
              <TrackingCard
                key={entry.id}
                entry={entry}
                onRemove={handleRemoveEntry}
                onRefresh={handleRefreshEntry}
                onRenew={handleRenewEntry}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Entries */}
      {completedEntries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Completed Positions ({completedEntries.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {completedEntries.map(entry => (
              <TrackingCard
                key={entry.id}
                entry={entry}
                onRemove={handleRemoveEntry}
                onRefresh={handleRefreshEntry}
                onRenew={handleRenewEntry}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Remove Tracking Entry"
        message={`Are you sure you want to remove tracking for ${deleteConfirmation.entrySymbol}? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Renewal Dialog */}
      <RenewalDialog
        isOpen={renewalDialog.isOpen}
        entry={renewalDialog.entry}
        onRenew={confirmRenewal}
        onCancel={cancelRenewal}
      />
    </div>
  );
} 