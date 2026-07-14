/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ClientDevice } from '../types.js';
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Server, 
  Tv, 
  Wifi, 
  Ban, 
  Unlock, 
  Edit2, 
  Search, 
  Filter, 
  Check, 
  X, 
  Globe, 
  Cable, 
  ShieldAlert,
  ArrowDown,
  ArrowUp,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

interface ClientExplorerProps {
  clients: ClientDevice[];
  onRenameClient: (id: string, name: string) => Promise<void>;
  onBlockClient: (id: string, blocked: boolean) => Promise<void>;
}

export default function ClientExplorer({
  clients,
  onRenameClient,
  onBlockClient
}: ClientExplorerProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [connectionFilter, setConnectionFilter] = React.useState<'all' | 'wifi' | 'wired'>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [vlanFilter, setVlanFilter] = React.useState<string>('all');
  
  // Inline editing state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');

  // Get unique lists for filter options
  const vlans = Array.from(new Set(clients.map(c => c.vlanId.toString()))).sort();
  const deviceTypes = Array.from(new Set(clients.map(c => c.deviceType))).sort();

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.ipAddress.includes(searchTerm) ||
      client.macAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesConnection = 
      connectionFilter === 'all' || 
      client.connectionType === connectionFilter;

    const matchesType = 
      typeFilter === 'all' || 
      client.deviceType === typeFilter;

    const matchesVlan = 
      vlanFilter === 'all' || 
      client.vlanId.toString() === vlanFilter;

    return matchesSearch && matchesConnection && matchesType && matchesVlan;
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'laptop':
        return <Laptop className="h-4 w-4" />;
      case 'phone':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'server':
        return <Server className="h-4 w-4" />;
      case 'tv':
        return <Tv className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const handleStartEdit = (client: ClientDevice) => {
    setEditingId(client.id);
    setEditName(client.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (editName.trim()) {
      await onRenameClient(id, editName.trim());
    }
    setEditingId(null);
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatTraffic = (mbps: number) => {
    if (mbps < 0.1) return '0.0 Kbps';
    if (mbps < 1) return `${Math.round(mbps * 1024)} Kbps`;
    return `${mbps.toFixed(1)} Mbps`;
  };

  return (
    <div className="space-y-4" id="client-explorer-container">
      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs space-y-3.5 transition-colors duration-200">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, IP, or MAC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand focus:bg-white dark:focus:bg-slate-950"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Connection filter toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setConnectionFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${connectionFilter === 'all' ? 'bg-brand text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
              >
                All
              </button>
              <button
                onClick={() => setConnectionFilter('wifi')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${connectionFilter === 'wifi' ? 'bg-brand text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
              >
                <Wifi className="h-3.5 w-3.5" /> WiFi
              </button>
              <button
                onClick={() => setConnectionFilter('wired')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 cursor-pointer ${connectionFilter === 'wired' ? 'bg-brand text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}
              >
                <Cable className="h-3.5 w-3.5" /> Wired
              </button>
            </div>

            {/* Quick stats badge */}
            <span className="text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 ml-auto md:ml-0">
              Filtered: {filteredClients.length} of {clients.length}
            </span>
          </div>
        </div>

        {/* Extended Dropdown Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Device Type
            </label>
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand appearance-none"
              >
                <option value="all">All Types</option>
                {deviceTypes.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-2.5 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Network VLAN
            </label>
            <div className="relative">
              <select
                value={vlanFilter}
                onChange={(e) => setVlanFilter(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand appearance-none"
              >
                <option value="all">All VLANs</option>
                {vlans.map(v => (
                  <option key={v} value={v}>VLAN {v}</option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-2.5 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table/Grid Card */}
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Client Name &amp; MAC</th>
                <th className="py-3 px-4">IP / VLAN</th>
                <th className="py-3 px-4">Connection / Link Node</th>
                <th className="py-3 px-4 text-right">Down Activity</th>
                <th className="py-3 px-4 text-right">Up Activity</th>
                <th className="py-3 px-4 text-right">Total Transferred</th>
                <th className="py-3 px-4">Uptime</th>
                <th className="py-3 px-4 text-center">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans" id="clients-empty-state">
                    <ShieldAlert className="h-8 w-8 text-slate-400 mx-auto mb-3 animate-pulse" />
                    <h5 className="font-display font-semibold text-slate-800 dark:text-slate-200 text-sm">No Active Client Stations Found</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
                      Please make sure your UniFi Controller or UISP Server integration is configured and active to stream connected client details in real-time.
                    </p>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-mono">
                    <ShieldAlert className="h-5 w-5 text-slate-400 mx-auto mb-2" />
                    No clients found matching the search or filters
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isEditing = editingId === client.id;
                  
                  return (
                    <tr 
                      key={client.id}
                      className={`hover:bg-slate-50/55 dark:hover:bg-slate-900/20 transition-colors ${client.isBlocked ? 'bg-rose-50/20 dark:bg-rose-950/5' : ''}`}
                    >
                      {/* Name and MAC */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-2 rounded-lg ${client.isBlocked ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                            {getDeviceIcon(client.deviceType)}
                          </div>
                          <div className="space-y-0.5">
                            {isEditing ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="px-2 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveEdit(client.id)}
                                  className="p-1 bg-brand text-white rounded hover:bg-brand-hover transition-colors"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1.5 group">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                  {client.name}
                                </span>
                                <button
                                  onClick={() => handleStartEdit(client)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-brand dark:hover:text-teal-400 transition-all rounded cursor-pointer"
                                  title="Edit Client Name"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                            <div className="font-mono text-[10px] text-slate-400 tracking-tight">
                              {client.macAddress}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* IP and VLAN */}
                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-700 dark:text-slate-300">{client.ipAddress}</div>
                        <div className="text-[10px] text-slate-400">
                          VLAN {client.vlanId}
                        </div>
                      </td>

                      {/* Connection and Node */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300">
                          {client.connectionType === 'wifi' ? (
                            <>
                              <Wifi className="h-3.5 w-3.5 text-slate-400" />
                              <span>WiFi ({client.wifiBand})</span>
                              {client.signalStrengthDbm && (
                                <span className={`text-[10px] ml-1 px-1 rounded font-bold ${
                                  client.signalStrengthDbm >= -60 
                                    ? 'text-emerald-500 bg-emerald-500/10' 
                                    : client.signalStrengthDbm >= -70 
                                      ? 'text-amber-500 bg-amber-500/10' 
                                      : 'text-rose-500 bg-rose-500/10'
                                }`}>
                                  {client.signalStrengthDbm} dBm
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <Cable className="h-3.5 w-3.5 text-slate-400" />
                              <span>1GbE Wired</span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Linked: {client.apOrSwitchName}
                        </div>
                      </td>

                      {/* Traffic Down */}
                      <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100">
                        {client.isBlocked ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <span className="flex items-center justify-end space-x-1">
                            <ArrowDown className="h-3 w-3 text-emerald-500" />
                            <span>{formatTraffic(client.activityInMbps)}</span>
                          </span>
                        )}
                      </td>

                      {/* Traffic Up */}
                      <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100">
                        {client.isBlocked ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <span className="flex items-center justify-end space-x-1">
                            <ArrowUp className="h-3 w-3 text-blue-500" />
                            <span>{formatTraffic(client.activityOutMbps)}</span>
                          </span>
                        )}
                      </td>

                      {/* Total Transferred */}
                      <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-500">
                        <div>{client.totalDataDownloadedGb.toFixed(1)} GB ↓</div>
                        <div>{client.totalDataUploadedGb.toFixed(1)} GB ↑</div>
                      </td>

                      {/* Uptime */}
                      <td className="py-3 px-4 font-mono text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatUptime(client.uptimeSeconds)}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {client.isBlocked ? (
                            <>
                              <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-[9px] font-bold uppercase rounded border border-rose-500/20">
                                BLOCKED
                              </span>
                              <button
                                onClick={() => onBlockClient(client.id, false)}
                                className="p-1 text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                                title="Authorize Client"
                              >
                                <Unlock className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold uppercase rounded border border-emerald-500/20">
                                ACTIVE
                              </span>
                              <button
                                onClick={() => onBlockClient(client.id, true)}
                                className="p-1 text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                                title="Block Client"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
