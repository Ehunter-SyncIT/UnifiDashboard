/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Header from './components/Header.jsx';
import DeviceGrid from './components/DeviceGrid.jsx';
import ApiSettingsModal from './components/ApiSettingsModal.jsx';
import NetworkOverview from './components/NetworkOverview.jsx';
import ClientExplorer from './components/ClientExplorer.jsx';
import { NetworkDevice, TrafficSnapshot, Alert, AlertThresholds, ClientDevice } from './types.js';
import { Activity, ShieldCheck, Wifi, Radio, AlertTriangle, Cpu, Terminal, Sliders, Laptop } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [darkMode, setDarkMode] = React.useState(() => {
    const saved = localStorage.getItem('netops-dark-mode');
    return saved !== null ? JSON.parse(saved) : true; // Default to dark mode for late-night maintenance
  });

  const [devices, setDevices] = React.useState<NetworkDevice[]>([]);
  const [analytics, setAnalytics] = React.useState<TrafficSnapshot[]>([]);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [clients, setClients] = React.useState<ClientDevice[]>([]);
  const [activePage, setActivePage] = React.useState<'dashboard' | 'nodes' | 'clients'>('dashboard');
  
  const [isSpikeSimulated, setIsSpikeSimulated] = React.useState(false);
  const [isLatencySimulated, setIsLatencySimulated] = React.useState(false);
  const [thresholds, setThresholds] = React.useState<AlertThresholds>({
    maxBandwidthMbps: 750,
    maxLatencyMs: 45,
    maxCpuUsage: 85,
    maxRamUsage: 90
  });

  const [selectedDevice, setSelectedDevice] = React.useState<NetworkDevice | null>(null);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // Save dark mode state
  React.useEffect(() => {
    localStorage.setItem('netops-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Fetch initial telemetry and configure active intervals
  const fetchTelemetry = async (showLoading = false) => {
    if (showLoading) setIsInitialLoading(true);
    try {
      // Parallelize fetches for maximum performance
      const [devicesRes, analyticsRes, alertsRes, simRes, clientsRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/analytics'),
        fetch('/api/alerts'),
        fetch('/api/simulation'),
        fetch('/api/clients')
      ]);

      if (devicesRes.ok && analyticsRes.ok && alertsRes.ok && simRes.ok && clientsRes.ok) {
        const devsData = await devicesRes.json();
        const analyticsData = await analyticsRes.json();
        const alertsData = await alertsRes.json();
        const simData = await simRes.json();
        const clientsData = await clientsRes.json();

        setDevices(devsData);
        setAnalytics(analyticsData);
        setAlerts(alertsData);
        setClients(clientsData);
        setIsSpikeSimulated(simData.isSpikeSimulated);
        setIsLatencySimulated(simData.isLatencySimulated);
        setThresholds(simData.thresholds);
      }
    } catch (err) {
      console.error('Error fetching full-stack network telemetry:', err);
    } finally {
      if (showLoading) setIsInitialLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTelemetry(true);

    // Regular polling interval (10 seconds)
    const interval = setInterval(() => {
      fetchTelemetry(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Sync selected device properties on state refresh
  React.useEffect(() => {
    if (selectedDevice) {
      const refreshedDev = devices.find(d => d.id === selectedDevice.id);
      if (refreshedDev && JSON.stringify(refreshedDev) !== JSON.stringify(selectedDevice)) {
        setSelectedDevice(refreshedDev);
      }
    }
  }, [devices, selectedDevice]);

  // Actions handlers
  const handleRestartDevice = async (id: string) => {
    try {
      const res = await fetch(`/api/devices/${id}/restart`, { method: 'POST' });
      if (res.ok) {
        await fetchTelemetry(false);
      }
    } catch (err) {
      console.error('Failed to trigger device restart:', err);
    }
  };

  const handleDisconnectDevice = async (id: string) => {
    try {
      const res = await fetch('/api/simulation/disconnect-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchTelemetry(false);
      }
    } catch (err) {
      console.error('Failed to trigger device disconnect:', err);
    }
  };

  const handleConfigureDevice = async (id: string, name: string, ip: string) => {
    try {
      const res = await fetch(`/api/devices/${id}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ipAddress: ip })
      });
      if (res.ok) {
        await fetchTelemetry(false);
      }
    } catch (err) {
      console.error('Failed to save device configuration:', err);
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/acknowledge`, { method: 'POST' });
      if (res.ok) {
        await fetchTelemetry(false);
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleClearAllAlerts = async () => {
    try {
      const res = await fetch('/api/alerts/clear', { method: 'POST' });
      if (res.ok) {
        await fetchTelemetry(false);
      }
    } catch (err) {
      console.error('Failed to clear alerts log:', err);
    }
  };

  const handleUpdateSimulation = async (config: { isSpikeSimulated?: boolean, isLatencySimulated?: boolean, thresholds?: Partial<AlertThresholds> }) => {
    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        await fetchTelemetry(false);
      }
    } catch (err) {
      console.error('Failed to update simulation parameters:', err);
    }
  };



  const handleRenameClient = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/clients/${id}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        await fetchTelemetry(false);
      }
    } catch (err) {
      console.error('Failed to rename client:', err);
    }
  };

  const handleBlockClient = async (id: string, blocked: boolean) => {
    try {
      const res = await fetch(`/api/clients/${id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked })
      });
      if (res.ok) {
        await fetchTelemetry(false);
      }
    } catch (err) {
      console.error('Failed to toggle block state for client:', err);
    }
  };

  // Summary indicators calculations
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const totalCount = devices.length;
  const unreadAlertsCount = alerts.filter(a => !a.acknowledged).length;

  const wanDevice = devices.find(d => d.id === 'unifi-udm-se') || devices.find(d => d.category === 'router' && d.type === 'unifi') || devices.find(d => d.category === 'router');
  const totalDownloadMbps = wanDevice ? wanDevice.bandwidthInMbps : 0;
  const totalUploadMbps = wanDevice ? wanDevice.bandwidthOutMbps : 0;

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-slate-100 font-mono space-y-3">
        <Activity className="h-8 w-8 text-blue-500 animate-spin" />
        <div className="space-y-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider">Ubiquiti NetOps Dashboard</p>
          <p className="text-[10px] text-slate-500">Initiating live connection to UniFi &amp; UISP nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* Header with quick summaries & toggles */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onlineCount={onlineCount}
        totalCount={totalCount}
        alertCount={unreadAlertsCount}
        totalDownloadMbps={totalDownloadMbps}
        totalUploadMbps={totalUploadMbps}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Sticky Tab Navigation Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-xs sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 h-12">
            <button
              onClick={() => setActivePage('dashboard')}
              className={`flex items-center space-x-2 px-1 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer ${
                activePage === 'dashboard'
                  ? 'border-brand text-brand dark:border-teal-400 dark:text-teal-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Overview Dashboard</span>
            </button>

            <button
              onClick={() => setActivePage('nodes')}
              className={`flex items-center space-x-2 px-1 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer ${
                activePage === 'nodes'
                  ? 'border-brand text-brand dark:border-teal-400 dark:text-teal-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Node Explorer</span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full leading-none">
                {devices.length}
              </span>
            </button>

            <button
              onClick={() => setActivePage('clients')}
              className={`flex items-center space-x-2 px-1 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer ${
                activePage === 'clients'
                  ? 'border-brand text-brand dark:border-teal-400 dark:text-teal-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300'
              }`}
            >
              <Laptop className="h-4 w-4" />
              <span>Client Explorer</span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full leading-none">
                {clients.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {activePage === 'dashboard' && (
            <NetworkOverview
              devices={devices}
              alerts={alerts}
              clients={clients}
              analytics={analytics}
              thresholds={thresholds}
              isSpikeSimulated={isSpikeSimulated}
              isLatencySimulated={isLatencySimulated}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onClearAllAlerts={handleClearAllAlerts}
              onUpdateSimulation={handleUpdateSimulation}
              onNavigateToNodes={() => setActivePage('nodes')}
              onNavigateToClients={() => setActivePage('clients')}
            />
          )}

          {activePage === 'nodes' && (
            <div className="space-y-4">
              {/* Device Grid Filter layout */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                  <h2 className="text-sm sm:text-base font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Sliders className="h-4.5 w-4.5 text-blue-500" />
                    UniFi &amp; UISP Integrated Node Explorer
                  </h2>
                  <span className="text-[10px] font-mono text-slate-400">Total: {devices.length} nodes</span>
                </div>
                
                <DeviceGrid
                  devices={devices}
                  onRestart={handleRestartDevice}
                  onDisconnect={handleDisconnectDevice}
                  onConfigure={handleConfigureDevice}
                />
              </div>
            </div>
          )}

          {activePage === 'clients' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <h2 className="text-sm sm:text-base font-bold font-display text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Laptop className="h-4.5 w-4.5 text-blue-500" />
                  Live Station Client Explorer
                </h2>
                <span className="text-[10px] font-mono text-slate-400">Total: {clients.length} stations</span>
              </div>

              <ClientExplorer
                clients={clients}
                onRenameClient={handleRenameClient}
                onBlockClient={handleBlockClient}
              />
            </div>
          )}
        </motion.div>

      </main>

      {/* Footer credits and network standards */}
      <footer className="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 py-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-slate-400 font-mono">
          <p>© 2026 Ubiquiti NetOps. Authorized system access only.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <span>IEEE 802.3bt PoE++</span>
            <span>·</span>
            <span>60GHz Wave PTMP</span>
            <span>·</span>
            <span>WPA3-Enterprise</span>
          </div>
        </div>
      </footer>

      <ApiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => fetchTelemetry(false)}
      />

    </div>
  );
}
