/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NetworkDevice, Alert, AlertThresholds, TrafficSnapshot, ClientDevice } from '../types.js';
import { 
  Cpu, 
  HardDrive, 
  Wifi, 
  ShieldCheck, 
  Activity, 
  Radio, 
  AlertTriangle, 
  Sliders, 
  Zap, 
  Layers, 
  Router, 
  Cable, 
  ChevronRight,
  TrendingUp,
  XCircle,
  CheckCircle,
  AlertOctagon,
  Clock
} from 'lucide-react';
import TrafficCharts from './TrafficCharts.jsx';
import AlertCenter from './AlertCenter.jsx';

interface NetworkOverviewProps {
  devices: NetworkDevice[];
  alerts: Alert[];
  clients: ClientDevice[];
  analytics: TrafficSnapshot[];
  thresholds: AlertThresholds;
  isSpikeSimulated: boolean;
  isLatencySimulated: boolean;
  onAcknowledgeAlert: (id: string) => Promise<void>;
  onClearAllAlerts: () => Promise<void>;
  onUpdateSimulation: (config: { isSpikeSimulated?: boolean, isLatencySimulated?: boolean, thresholds?: Partial<AlertThresholds> }) => Promise<void>;
  onNavigateToNodes: () => void;
  onNavigateToClients: () => void;
}

export default function NetworkOverview({
  devices,
  alerts,
  clients,
  analytics,
  thresholds,
  isSpikeSimulated,
  isLatencySimulated,
  onAcknowledgeAlert,
  onClearAllAlerts,
  onUpdateSimulation,
  onNavigateToNodes,
  onNavigateToClients
}: NetworkOverviewProps) {
  
  // Categorized counts
  const totalCount = devices.length;
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const warningCount = devices.filter(d => d.status === 'warning').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  const routers = devices.filter(d => d.category === 'router');
  const switches = devices.filter(d => d.category === 'switch');
  const aps = devices.filter(d => d.category === 'ap');
  const wireless = devices.filter(d => d.category === 'wireless');

  // Switch Details
  const totalSwitches = switches.length;
  const onlineSwitches = switches.filter(s => s.status === 'online').length;
  const totalPoeBudget = switches.reduce((acc, s) => acc + (s.poeBudgetTotalW || 0), 0);
  const usedPoeBudget = switches.reduce((acc, s) => acc + (s.poeBudgetUsedW || 0), 0);
  const activePoePorts = switches.reduce((acc, s) => {
    const ports = s.ports || [];
    return acc + ports.filter(p => p.poeActive && p.isConnected).length;
  }, 0);

  // AP Details
  const totalAPs = aps.length;
  const onlineAPs = aps.filter(ap => ap.status === 'online').length;
  const wifiClients = clients.filter(c => c.connectionType === 'wifi');
  const wiredClients = clients.filter(c => c.connectionType === 'wired');
  
  // Distribution by wifi band
  const wifi6Count = wifiClients.filter(c => c.wifiBand === '6GHz').length;
  const wifi5Count = wifiClients.filter(c => c.wifiBand === '5GHz').length;
  const wifi24Count = wifiClients.filter(c => c.wifiBand === '2.4GHz').length;

  // Wireless Bridge details (UISP Backhaul)
  const totalWireless = wireless.length;
  const degradedWireless = wireless.filter(w => w.status === 'warning' || w.status === 'offline').length;
  const avgSignalStrength = wireless.length > 0 
    ? Math.round(wireless.reduce((acc, w) => acc + (w.wirelessDetails?.signalStrengthDbm || 0), 0) / wireless.length)
    : -50;

  // Alert Metrics
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const warningAlertsCount = activeAlerts.filter(a => a.severity === 'warning').length;
  const infoAlertsCount = activeAlerts.filter(a => a.severity === 'info').length;

  return (
    <div className="space-y-4" id="network-overview-root">
      
      {/* Bento Grid: Device Category Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Router Details Card */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-brand/40 transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Routers / Gateways</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-1.5">
                {routers.length} <span className="text-xs font-normal text-slate-500">Active</span>
              </h3>
            </div>
            <div className="p-2.5 bg-brand-muted text-brand dark:text-teal-400 rounded-lg">
              <Router className="h-5 w-5" />
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2 text-xs font-mono">
            {routers.map(r => (
              <div key={r.id} className="flex justify-between items-center">
                <span className="text-slate-400 truncate max-w-[120px]">{r.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">{r.ipAddress}</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${r.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-1 text-[10px] text-slate-400">
              <span>Security Engine</span>
              <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                <ShieldCheck className="h-3 w-3" /> IPS Active
              </span>
            </div>
          </div>
        </div>

        {/* Switch Details Card */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Ethernet Switches</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-1.5">
                {totalSwitches} <span className="text-xs font-normal text-slate-500">Provisioned</span>
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <Layers className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">PoE Sourcing</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                {usedPoeBudget.toFixed(1)}W / {totalPoeBudget}W
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">PoE Active Ports</span>
              <span className="text-slate-900 dark:text-slate-100 font-semibold">{activePoePorts} Links</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-1.5 rounded-full transition-all" 
                style={{ width: `${(usedPoeBudget / (totalPoeBudget || 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* AP Details Card */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Access Points</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-1.5">
                {totalAPs} <span className="text-xs font-normal text-slate-500">Nodes ({onlineAPs} Online)</span>
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Wifi className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">WiFi Clients</span>
              <span className="text-emerald-500 font-bold">{wifiClients.length} Stations</span>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1 text-center text-[10px]">
              <div className="p-1 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800/50">
                <span className="block text-slate-400">6 GHz</span>
                <span className="font-bold text-indigo-400">{wifi6Count}</span>
              </div>
              <div className="p-1 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800/50">
                <span className="block text-slate-400">5 GHz</span>
                <span className="font-bold text-emerald-500">{wifi5Count}</span>
              </div>
              <div className="p-1 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800/50">
                <span className="block text-slate-400">2.4 GHz</span>
                <span className="font-bold text-amber-500">{wifi24Count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wireless Backhaul Details Card */}
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-amber-500/30 transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">UISP Backhaul Links</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-baseline gap-1.5">
                {totalWireless} <span className="text-xs font-normal text-slate-500">Nodes ({degradedWireless} Alert)</span>
              </h3>
            </div>
            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-lg">
              <Radio className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Average RSSI</span>
              <span className={`font-bold ${avgSignalStrength < -65 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {avgSignalStrength} dBm
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DFS Channels</span>
              <span className="text-slate-900 dark:text-slate-100 font-semibold">DFS Re-entry Clear</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>PTMP Wireless</span>
              <span className="text-amber-500 font-semibold">60GHz Active</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Core telemetry chart section */}
      <div className="grid grid-cols-1 gap-4">
        <TrafficCharts 
          data={analytics} 
          thresholdMbps={thresholds.maxBandwidthMbps} 
        />
      </div>

      {/* Sub-grid: Alerts Dashboard & Fault Testing Simulator */}
      <AlertCenter
        alerts={alerts}
        thresholds={thresholds}
        isSpikeSimulated={isSpikeSimulated}
        isLatencySimulated={isLatencySimulated}
        onAcknowledge={onAcknowledgeAlert}
        onClearAll={onClearAllAlerts}
        onUpdateSimulation={onUpdateSimulation}
        onNavigateToNodes={onNavigateToNodes}
      />

      {/* Quick Navigation Panel */}
      <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors duration-200">
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
            @Synchronous-IT Operations Controller
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-none">
            Deep dive into connected nodes or search live client sessions using the explorer tabs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToNodes}
            className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white font-mono text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            Node Explorer ({devices.length})
          </button>
          <button
            onClick={onNavigateToClients}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Client Explorer ({clients.length})
          </button>
        </div>
      </div>

    </div>
  );
}
