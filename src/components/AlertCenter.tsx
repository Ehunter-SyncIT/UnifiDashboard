/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Alert, AlertThresholds } from '../types.js';
import { 
  Bell, 
  Trash2, 
  Check, 
  Sliders, 
  AlertTriangle, 
  ShieldAlert, 
  ZapOff, 
  Info,
  Clock,
  Settings
} from 'lucide-react';

interface AlertCenterProps {
  alerts: Alert[];
  thresholds: AlertThresholds;
  isSpikeSimulated: boolean;
  isLatencySimulated: boolean;
  onAcknowledge: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onUpdateSimulation: (config: { isSpikeSimulated?: boolean, isLatencySimulated?: boolean, thresholds?: Partial<AlertThresholds> }) => Promise<void>;
  onNavigateToNodes?: () => void;
}

export default function AlertCenter({
  alerts,
  thresholds,
  isSpikeSimulated,
  isLatencySimulated,
  onAcknowledge,
  onClearAll,
  onUpdateSimulation,
  onNavigateToNodes
}: AlertCenterProps) {
  const [bandThreshold, setBandThreshold] = React.useState(thresholds.maxBandwidthMbps);
  const [latThreshold, setLatThreshold] = React.useState(thresholds.maxLatencyMs);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningAlertsCount = activeAlerts.filter(a => a.severity === 'warning').length;
  const infoAlertsCount = activeAlerts.filter(a => a.severity === 'info').length;

  const handleApplyThresholds = async () => {
    setIsUpdating(true);
    await onUpdateSimulation({
      thresholds: {
        maxBandwidthMbps: Number(bandThreshold),
        maxLatencyMs: Number(latThreshold)
      }
    });
    setIsUpdating(false);
  };

  const handleToggleSpike = async () => {
    await onUpdateSimulation({ isSpikeSimulated: !isSpikeSimulated });
  };

  const handleToggleLatency = async () => {
    await onUpdateSimulation({ isLatencySimulated: !isLatencySimulated });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" id="alerts-and-simulation-control">
      
      {/* Column 1 & 2: Alerts Log List */}
      <div className="lg:col-span-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center space-x-2">
              <Bell className="h-4.5 w-4.5 text-rose-500" />
              <div>
                <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Real-Time NetOps Alerts Log
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Infrastructure alarms and system event captures
                </p>
              </div>
            </div>
            
            {alerts.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-500 flex items-center gap-1 px-2 py-1 bg-rose-50 dark:bg-rose-950/20 rounded border border-rose-100 dark:border-rose-900/30 transition-colors cursor-pointer"
                title="Acknowledge and clear all events"
              >
                <Trash2 className="h-3 w-3" /> Clear Log
              </button>
            )}
          </div>

          {/* Alerts Scroll Container */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-600 space-y-1.5">
                <Bell className="h-8 w-8 mx-auto opacity-30 animate-bounce" />
                <p className="text-xs font-medium">All infrastructure systems healthy.</p>
                <p className="text-[10px]">No active alerts or spikes triggered.</p>
              </div>
            ) : (
              alerts.map(alert => {
                const isCritical = alert.severity === 'critical';
                const isWarning = alert.severity === 'warning';
                
                return (
                  <div
                    key={alert.id}
                    id={`alert-item-${alert.id}`}
                    className={`p-2.5 border rounded-lg transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 ${
                      alert.acknowledged
                        ? 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-850 opacity-60'
                        : isCritical
                        ? 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
                        : isWarning
                        ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40'
                        : 'bg-blue-50/40 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/40'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      
                      {/* Severity Icon */}
                      <div className={`p-1.5 rounded shrink-0 mt-0.5 ${
                        isCritical 
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400' 
                          : isWarning 
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' 
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      }`}>
                        {isCritical ? (
                          <ShieldAlert className="h-4 w-4" />
                        ) : isWarning ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Info className="h-4 w-4" />
                        )}
                      </div>

                      {/* Message details */}
                      <div className="space-y-0.5">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {alert.title}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                            {alert.deviceName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                          {alert.message}
                        </p>
                        <span className="text-[9px] font-mono text-slate-400 block pt-0.5">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                    </div>

                    {/* Acknowledge trigger */}
                    {!alert.acknowledged && (
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        className="self-end sm:self-start shrink-0 px-2 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-[9px] font-bold font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <Check className="h-3 w-3 text-emerald-500" /> ACK
                      </button>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Info footer & Distribution Summary */}
        <div className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-3 mt-3.5 flex flex-col sm:flex-row gap-3 justify-between items-center font-mono">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 self-stretch sm:self-auto">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              Critical: <strong className="text-slate-700 dark:text-slate-300 font-bold">{criticalCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Warning: <strong className="text-slate-700 dark:text-slate-300 font-bold">{warningAlertsCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Info: <strong className="text-slate-700 dark:text-slate-300 font-bold">{infoAlertsCount}</strong>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800/40 pt-2 sm:pt-0">
            <span className="text-slate-400 text-[9px] sm:text-[10px]">GW latency: 12ms</span>
            {onNavigateToNodes && (
              <button
                onClick={onNavigateToNodes}
                className="flex items-center gap-0.5 text-brand hover:text-brand-hover dark:text-teal-400 dark:hover:text-teal-300 font-bold font-sans cursor-pointer text-[11px]"
              >
                Verify Nodes &rarr;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Column 3: Diagnostic thresholds & simulator triggers */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm space-y-4">
        
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
            <Sliders className="h-4.5 w-4.5 text-brand dark:text-teal-400" />
            NetOps Alarm Controller
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Configure triggers and simulate failures
          </p>
        </div>

        {/* Set thresholds inputs */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Alert Alarm Thresholds</h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="font-medium text-slate-600 dark:text-slate-300">Bandwidth Spike Limit</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{bandThreshold} Mbps</span>
              </div>
              <input
                type="range"
                min="100"
                max="950"
                step="50"
                value={bandThreshold}
                onChange={(e) => setBandThreshold(Number(e.target.value))}
                className="w-full accent-brand dark:accent-teal-400 h-1 bg-slate-100 dark:bg-slate-850 rounded appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="font-medium text-slate-600 dark:text-slate-300">Max Ping Latency</span>
                <span className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{latThreshold} ms</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                step="5"
                value={latThreshold}
                onChange={(e) => setLatThreshold(Number(e.target.value))}
                className="w-full accent-brand dark:accent-teal-400 h-1 bg-slate-100 dark:bg-slate-850 rounded appearance-none cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleApplyThresholds}
            disabled={isUpdating}
            className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-800 dark:text-slate-200 font-semibold rounded text-[11px] transition-colors flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-850 cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" /> 
            {isUpdating ? 'Applying Rules...' : 'Apply Threshold Rules'}
          </button>
        </div>

        {/* Simulated scenario triggers */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">Troubleshooting Simulator</h4>
          <p className="text-[10px] text-slate-500 leading-tight">Toggle simulated faults to evaluate real-time auto-alerts and run diagnostics.</p>

          <div className="space-y-2 pt-1">
            
            {/* Bandwidth Spike Toggle */}
            <button
              onClick={handleToggleSpike}
              className={`w-full py-2 px-2.5 rounded text-[11px] font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                isSpikeSimulated
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-300 dark:border-slate-850'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isSpikeSimulated ? 'bg-rose-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                Simulate Bandwidth Spike
              </span>
              <span className="font-mono text-[9px]">
                {isSpikeSimulated ? 'ACTIVE (~920M)' : 'OFF'}
              </span>
            </button>

            {/* Latency & Packet Loss Toggle */}
            <button
              onClick={handleToggleLatency}
              className={`w-full py-2 px-2.5 rounded text-[11px] font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                isLatencySimulated
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-300 dark:border-slate-850'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isLatencySimulated ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                Simulate High Latency
              </span>
              <span className="font-mono text-[9px]">
                {isLatencySimulated ? 'ACTIVE (~140ms)' : 'OFF'}
              </span>
            </button>

          </div>
        </div>

      </div>

    </div>
  );
}
