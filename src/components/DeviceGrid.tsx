/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NetworkDevice, DeviceType, DeviceCategory, DeviceStatus } from '../types.js';
import { 
  Wifi, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  Search, 
  Filter, 
  Settings, 
  Terminal, 
  HelpCircle,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  Radio,
  PowerOff
} from 'lucide-react';

interface DeviceGridProps {
  devices: NetworkDevice[];
  onRestart: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
  onConfigure: (id: string, name: string, ip: string) => Promise<void>;
}

export default function DeviceGrid({
  devices,
  onRestart,
  onDisconnect,
  onConfigure
}: DeviceGridProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | DeviceType>('all');
  const [filterCategory, setFilterCategory] = React.useState<'all' | DeviceCategory>('all');
  const [filterStatus, setFilterStatus] = React.useState<'all' | DeviceStatus>('all');
  const [sortBy, setSortBy] = React.useState<'name' | 'ip' | 'mac' | 'status' | 'type'>('ip');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [rebootingIds, setRebootingIds] = React.useState<Record<string, boolean>>({});
  const [editingDevice, setEditingDevice] = React.useState<NetworkDevice | null>(null);
  const [newName, setNewName] = React.useState('');
  const [newIp, setNewIp] = React.useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleRestartClick = async (id: string) => {
    setRebootingIds(prev => ({ ...prev, [id]: true }));
    await onRestart(id);
    setTimeout(() => {
      setRebootingIds(prev => ({ ...prev, [id]: false }));
    }, 1500);
  };

  const startEditing = (dev: NetworkDevice) => {
    setEditingDevice(dev);
    setNewName(dev.name);
    setNewIp(dev.ipAddress);
  };

  const saveConfiguration = async () => {
    if (editingDevice) {
      await onConfigure(editingDevice.id, newName, newIp);
      setEditingDevice(null);
    }
  };

  // Filtering Logic
  const filteredDevices = devices.filter(dev => {
    const matchesSearch = 
      dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.ipAddress.includes(searchTerm) ||
      dev.macAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || dev.type === filterType;
    const matchesCategory = filterCategory === 'all' || dev.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || dev.status === filterStatus;
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  // Sorting Logic
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    let fieldA: any = '';
    let fieldB: any = '';

    switch (sortBy) {
      case 'name':
        fieldA = a.name.toLowerCase();
        fieldB = b.name.toLowerCase();
        break;
      case 'ip':
        // Pad IP segments with zeros for perfect numeric IP sorting
        fieldA = a.ipAddress.split('.').map(num => num.padStart(3, '0')).join('.');
        fieldB = b.ipAddress.split('.').map(num => num.padStart(3, '0')).join('.');
        break;
      case 'mac':
        fieldA = a.macAddress.toLowerCase();
        fieldB = b.macAddress.toLowerCase();
        break;
      case 'status':
        fieldA = a.status;
        fieldB = b.status;
        break;
      case 'type':
        fieldA = a.type;
        fieldB = b.type;
        break;
      default:
        fieldA = a.name.toLowerCase();
        fieldB = b.name.toLowerCase();
    }

    if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6" id="device-management-grid">
      
      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search devices by name, IP, MAC, model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand focus:bg-white"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
            
            {/* System Type Filter */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-0.5 rounded">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                  filterType === 'all' 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All Systems
              </button>
              <button
                onClick={() => setFilterType('unifi')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                  filterType === 'unifi' 
                    ? 'bg-brand text-white shadow-xs' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                UniFi
              </button>
              <button
                onClick={() => setFilterType('uisp')}
                className={`px-2.5 py-1 rounded font-medium cursor-pointer ${
                  filterType === 'uisp' 
                    ? 'bg-brand text-white shadow-xs' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                UISP
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="all">All Categories</option>
              <option value="router">Gateways &amp; Routers</option>
              <option value="switch">Switches</option>
              <option value="ap">Access Points</option>
              <option value="wireless">UISP Wireless Bridges</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="all">All Statuses</option>
              <option value="online">Online</option>
              <option value="warning">Warning</option>
              <option value="offline">Offline</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="name">Name</option>
                <option value="ip">IP Address</option>
                <option value="mac">MAC Address</option>
                <option value="status">Status</option>
                <option value="type">System Type</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 px-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                {sortOrder === 'asc' ? '▲' : '▼'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Grid of Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {sortedDevices.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-950/25 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3" id="device-empty-state">
            <AlertTriangle className="h-8 w-8 text-slate-400" />
            <h5 className="font-display font-semibold text-slate-800 dark:text-slate-200 text-sm">No Active Network Devices Found</h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm font-sans leading-relaxed">
              Please verify your UniFi or UISP controller integration status. If live integration is disabled, configure your API credentials in the NetOps control panel.
            </p>
          </div>
        ) : (
          sortedDevices.map(dev => {
            const isUisp = dev.type === 'uisp';
            const isRebooting = rebootingIds[dev.id];
            
            return (
              <div 
                key={dev.id}
                id={`device-card-${dev.id}`}
                className={`bg-white dark:bg-[#0f172a] border rounded-xl overflow-hidden shadow-xs transition-all duration-200 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 ${
                  dev.status === 'offline' 
                    ? 'border-rose-500/40 bg-rose-500/5' 
                    : dev.status === 'warning'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
              {/* Card Header */}
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex justify-between items-start">
                  
                  {/* Left: Branding Badges & Name */}
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                        isUisp 
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30' 
                          : 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30'
                      }`}>
                        {dev.type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                        {dev.model}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-1">
                      {dev.name}
                      {dev.status === 'warning' && (
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                    </h4>
                  </div>

                  {/* Right: Status Pill */}
                  <div className="flex flex-col items-end space-y-0.5">
                    <span className={`inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono uppercase tracking-wider font-bold rounded border ${
                      dev.status === 'online' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : dev.status === 'warning'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      <span className={`h-1 w-1 rounded-full mr-1 ${
                        dev.status === 'online' 
                          ? 'bg-emerald-400 animate-pulse' 
                          : dev.status === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`} />
                      {dev.status}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      UPTIME: {dev.status === 'offline' ? '0s' : `${Math.floor(dev.uptimeSeconds / 86400)}d ${Math.floor((dev.uptimeSeconds % 86400) / 3600)}h`}
                    </span>
                  </div>

                </div>

                {/* IP & MAC indicators */}
                <div className="mt-2.5 flex items-center space-x-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" onClick={() => copyToClipboard(dev.ipAddress, `${dev.id}-ip`)}>
                    <span>IP:</span>
                    <span className="underline decoration-dotted">{dev.ipAddress}</span>
                    {copiedId === `${dev.id}-ip` ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5 opacity-60" />}
                  </div>
                  <div className="flex items-center space-x-1 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100" onClick={() => copyToClipboard(dev.macAddress, `${dev.id}-mac`)}>
                    <span>MAC:</span>
                    <span className="underline decoration-dotted">{dev.macAddress}</span>
                    {copiedId === `${dev.id}-mac` ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5 opacity-60" />}
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-3.5 flex-1 space-y-3.5 text-xs font-sans">
                
                {/* Micro Gauges CPU / RAM */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* CPU Usage */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-0.5"><Cpu className="h-3 w-3" /> CPU Load</span>
                      <span>{dev.cpuUsage}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          dev.cpuUsage > 80 ? 'bg-rose-500' : dev.cpuUsage > 60 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${dev.cpuUsage}%` }}
                      />
                    </div>
                  </div>

                  {/* RAM Usage */}
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-0.5"><HardDrive className="h-3 w-3" /> RAM Memory</span>
                      <span>{dev.ramUsage}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          dev.ramUsage > 85 ? 'bg-rose-500' : dev.ramUsage > 65 ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${dev.ramUsage}%` }}
                      />
                    </div>
                  </div>

                </div>

                {/* Bandwidth Throughput Rate */}
                <div className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded border border-slate-100 dark:border-slate-850 flex justify-between items-center text-[10px] font-mono">
                  <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>RX:</span>
                    <strong>{dev.status === 'offline' ? '0.0' : dev.bandwidthInMbps.toFixed(1)} Mbps</strong>
                  </div>
                  <div className="flex items-center space-x-1.5 text-blue-600 dark:text-blue-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    <span>TX:</span>
                    <strong>{dev.status === 'offline' ? '0.0' : dev.bandwidthOutMbps.toFixed(1)} Mbps</strong>
                  </div>
                </div>

                {/* Category-Specific Visuals */}
                {/* Switch PoE & Ports layout */}
                {dev.category === 'switch' && dev.ports && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {/* PoE Budget */}
                    {dev.poeBudgetTotalW && dev.poeBudgetUsedW && (() => {
                      const displayTotal = Math.max(dev.poeBudgetTotalW, Math.ceil(dev.poeBudgetUsedW / 10) * 10);
                      return (
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex justify-between text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-0.5 text-amber-500">
                              <Zap className="h-3 w-3 fill-current" /> Active PoE Delivery
                            </span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {dev.poeBudgetUsedW.toFixed(1)}W / {displayTotal}W
                            </span>
                          </div>
                          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, (dev.poeBudgetUsedW / displayTotal) * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Port Matrix */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Switch Port Map:</span>
                      <div className="flex items-center flex-wrap gap-0.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded border border-slate-200/50 dark:border-slate-850">
                        {dev.ports.map(port => (
                          <div 
                            key={port.portNumber} 
                            title={`Port ${port.portNumber}: ${port.isConnected ? `${port.speedMbps >= 1000 ? `${port.speedMbps/1000}G` : `${port.speedMbps}M`} connection` : 'Disconnected'}${port.poeActive ? ` (PoE Active: ${port.poePowerW}W)` : ''}`}
                            className={`h-5.5 w-5.5 rounded border flex flex-col items-center justify-center text-[8px] font-mono font-bold transition-all relative ${
                              !port.isConnected 
                                ? 'bg-slate-200 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-400' 
                                : port.poeActive 
                                ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 shadow-xs shadow-amber-500/10' 
                                : 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            <span>{port.portNumber}</span>
                            {port.poeActive && port.isConnected && (
                              <span className="absolute bottom-0.5 right-0.5 h-0.5 w-0.5 bg-amber-500 rounded-full" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Wireless backhaul link details */}
                {dev.category === 'wireless' && dev.wirelessDetails && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block">Wireless Link Alignment:</span>
                    
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded">
                        <div className="text-slate-400 text-[9px]">SIGNAL STRENGTH</div>
                        <div className={`font-bold flex items-center gap-1 text-sm ${
                          dev.wirelessDetails.signalStrengthDbm < -65 ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          <Radio className="h-3.5 w-3.5" />
                          {dev.wirelessDetails.signalStrengthDbm} dBm
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50 rounded">
                        <div className="text-slate-400 text-[10px]">FREQ / DISTANCE</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {dev.wirelessDetails.frequencyMhz >= 1000 ? `${(dev.wirelessDetails.frequencyMhz / 1000).toFixed(1)} GHz` : `${dev.wirelessDetails.frequencyMhz} MHz`}
                          <span className="text-[10px] text-slate-400 ml-1">({dev.wirelessDetails.distanceMeters}m)</span>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50 rounded col-span-2">
                        <div className="text-slate-400 text-[10px] mb-0.5">ESTIMATED LINK CAPACITIES (TX / RX)</div>
                        <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                          <span className="font-semibold text-emerald-500">TX: {dev.wirelessDetails.txRateMbps} Mbps</span>
                          <span className="text-slate-300 dark:text-slate-800">|</span>
                          <span className="font-semibold text-blue-500">RX: {dev.wirelessDetails.rxRateMbps} Mbps</span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>

              {/* Card Actions */}
              <div className="px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2 items-center justify-between">
                
                {/* Configuration / edit button */}
                <button
                  onClick={() => startEditing(dev)}
                  className="px-2 py-1 text-[11px] font-semibold rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="h-3 w-3" /> Config
                </button>

                <div className="flex items-center gap-1.5">
                  
                  {/* Test alert disconnection trigger */}
                  {dev.status !== 'offline' && (
                    <button
                      onClick={() => onDisconnect(dev.id)}
                      className="px-2 py-1 text-[11px] font-semibold rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Simulate physical unplug / heartbeat lost"
                    >
                      <PowerOff className="h-3 w-3" /> Kill Link
                    </button>
                  )}

                  {/* Manual reboot trigger */}
                  <button
                    onClick={() => handleRestartClick(dev.id)}
                    disabled={isRebooting}
                    className="px-2 py-1 text-[11px] font-semibold rounded text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRebooting ? 'animate-spin text-brand dark:text-teal-400' : ''}`} />
                    {isRebooting ? 'Rebooting...' : 'Reboot'}
                  </button>



                </div>

              </div>

            </div>
          );
        })
        )}
      </div>

      {/* Editing Dialog Modal */}
      {editingDevice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-5 max-w-md w-full shadow-xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-semibold font-display text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Configure Device
              </h3>
              <button 
                onClick={() => setEditingDevice(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Device Label / Alias</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Local IP Address</label>
                <input
                  type="text"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              
              <div className="text-xs text-slate-400 p-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-lg">
                <strong>Ubiquiti Controller Note:</strong> Modifying parameters sends local provision scripts. Uptime counter will preserve state unless a hard reboot is scheduled.
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                onClick={() => setEditingDevice(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={saveConfiguration}
                className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                Save Settings
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
