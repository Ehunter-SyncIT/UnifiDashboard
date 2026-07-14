/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrafficSnapshot } from '../types.js';
import { ArrowDown, ArrowUp, Activity, Users, Clock, AlertTriangle } from 'lucide-react';

interface TrafficChartsProps {
  data: TrafficSnapshot[];
  thresholdMbps: number;
}

export default function TrafficCharts({ data, thresholdMbps }: TrafficChartsProps) {
  const [activeTab, setActiveTab] = React.useState<'bandwidth' | 'latency' | 'clients'>('bandwidth');

  // Calculate current vs. averages
  const latest = data[data.length - 1] || { downloadMbps: 0, uploadMbps: 0, activeClients: 0, latencyMs: 0, packetLossPercent: 0 };
  
  const avgDownload = data.reduce((acc, curr) => acc + curr.downloadMbps, 0) / (data.length || 1);
  const maxDownload = Math.max(...data.map(d => d.downloadMbps), 0);
  const avgLatency = data.reduce((acc, curr) => acc + curr.latencyMs, 0) / (data.length || 1);
  const maxPacketLoss = Math.max(...data.map(d => d.packetLossPercent), 0);

  const isCurrentSpike = latest.downloadMbps >= thresholdMbps;

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm transition-all duration-200 flex flex-col h-full" id="traffic-analytics-container">
      
      {/* Tabs and Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3 gap-2">
        <div>
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-brand dark:text-teal-400" />
            Live Infrastructure Telemetry
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Real-time metric polling (every 10 seconds)
          </p>
        </div>

        {/* Tab Selectors */}
        <div className="flex bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-0.5 rounded text-[10px] font-sans self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab('bandwidth')}
            className={`flex-1 sm:flex-none px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              activeTab === 'bandwidth'
                ? 'bg-brand text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Bandwidth
          </button>
          <button
            onClick={() => setActiveTab('latency')}
            className={`flex-1 sm:flex-none px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              activeTab === 'latency'
                ? 'bg-brand text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Latency &amp; Loss
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex-1 sm:flex-none px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-brand text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Clients
          </button>
        </div>
      </div>

      {/* Grid of Micro readouts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        
        {/* Download Readout */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-lg">
          <div className="flex justify-between items-center text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 mb-0.5">
            <span>WAN DOWNLOAD</span>
            <ArrowDown className="h-3 w-3 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-0.5">
            <span className={`text-lg font-bold font-mono tracking-tight transition-colors duration-300 ${
              isCurrentSpike ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
            }`}>
              {latest.downloadMbps.toFixed(1)}
            </span>
            <span className="text-[9px] font-mono text-slate-400">Mbps</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
            <span>Avg: {avgDownload.toFixed(0)} Mbps</span>
            {isCurrentSpike && (
              <span className="text-rose-500 font-semibold flex items-center gap-0.5 animate-pulse">
                <AlertTriangle className="h-2.5 w-2.5" /> Spike!
              </span>
            )}
          </div>
        </div>

        {/* Upload Readout */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-lg">
          <div className="flex justify-between items-center text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 mb-0.5">
            <span>WAN UPLOAD</span>
            <ArrowUp className="h-3 w-3 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-0.5">
            <span className="text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              {latest.uploadMbps.toFixed(1)}
            </span>
            <span className="text-[9px] font-mono text-slate-400">Mbps</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">
            Peak: {Math.max(...data.map(d => d.uploadMbps), 0).toFixed(0)} Mbps
          </span>
        </div>

        {/* Latency Readout */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-lg">
          <div className="flex justify-between items-center text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 mb-0.5">
            <span>LATENCY</span>
            <Clock className="h-3 w-3 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-0.5">
            <span className="text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              {latest.latencyMs.toFixed(1)}
            </span>
            <span className="text-[9px] font-mono text-slate-400">ms</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">
            Avg Ping: {avgLatency.toFixed(1)} ms
          </span>
        </div>

        {/* Client Count Readout */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 rounded-lg">
          <div className="flex justify-between items-center text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400 mb-0.5">
            <span>STATIONS</span>
            <Users className="h-3 w-3 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-0.5">
            <span className="text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
              {latest.activeClients}
            </span>
            <span className="text-[9px] font-mono text-slate-400">online</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">
            Max: {Math.max(...data.map(d => d.activeClients), 0)} active
          </span>
        </div>

      </div>

      {/* Main Chart Body - Two Graphs Back-to-Back */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[320px] w-full" id="telemetry-charts-grid">
        
        {/* UniFi Chart Card */}
        <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 rounded-xl p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-500"></span>
              UniFi Network Telemetry
            </h4>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
              Active WAN1
            </span>
          </div>
          
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'bandwidth' ? (
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUniFiDownload" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isCurrentSpike ? "#f43f5e" : "#10b981"} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={isCurrentSpike ? "#f43f5e" : "#10b981"} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUniFiUpload" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" />
                  <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" unit="M" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '6px', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }} />
                  <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Area 
                    name="UniFi Download (Mbps)" 
                    type="monotone" 
                    dataKey="unifiDownloadMbps" 
                    stroke={isCurrentSpike ? "#f43f5e" : "#10b981"} 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#colorUniFiDownload)" 
                  />
                  <Area 
                    name="UniFi Upload (Mbps)" 
                    type="monotone" 
                    dataKey="unifiUploadMbps" 
                    stroke="#3b82f6" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#colorUniFiUpload)" 
                  />
                </AreaChart>
              ) : activeTab === 'latency' ? (
                <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" />
                  <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" unit="ms" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '6px', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }} />
                  <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Line 
                    name="UniFi Ping (ms)" 
                    type="monotone" 
                    dataKey="unifiLatencyMs" 
                    stroke="#6366f1" 
                    strokeWidth={1.5} 
                    dot={false}
                  />
                  <Line 
                    name="Packet Loss (%)" 
                    type="step" 
                    dataKey="packetLossPercent" 
                    stroke="#ef4444" 
                    strokeWidth={1.5} 
                    dot={true}
                  />
                </LineChart>
              ) : (
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUniFiClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" />
                  <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '6px', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }} />
                  <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Area 
                    name="UniFi Active Stations" 
                    type="monotone" 
                    dataKey="unifiActiveClients" 
                    stroke="#06b6d4" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#colorUniFiClients)" 
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* UISP Chart Card */}
        <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/60 rounded-xl p-4 flex flex-col h-full">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              UISP Infrastructure Telemetry
            </h4>
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
              Active Bridge Links
            </span>
          </div>

          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'bandwidth' ? (
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUispDownload" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUispUpload" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" />
                  <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" unit="M" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '6px', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }} />
                  <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Area 
                    name="UISP Download (Mbps)" 
                    type="monotone" 
                    dataKey="uispDownloadMbps" 
                    stroke="#f59e0b" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#colorUispDownload)" 
                  />
                  <Area 
                    name="UISP Upload (Mbps)" 
                    type="monotone" 
                    dataKey="uispUploadMbps" 
                    stroke="#ec4899" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#colorUispUpload)" 
                  />
                </AreaChart>
              ) : activeTab === 'latency' ? (
                <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" />
                  <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" unit="ms" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '6px', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }} />
                  <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Line 
                    name="UISP Bridge Ping (ms)" 
                    type="monotone" 
                    dataKey="uispLatencyMs" 
                    stroke="#f59e0b" 
                    strokeWidth={1.5} 
                    dot={false}
                  />
                  <Line 
                    name="Jitter Rate (%)" 
                    type="step" 
                    dataKey={(d) => Math.round((d.packetLossPercent * 1.2) * 100) / 100} 
                    stroke="#ef4444" 
                    strokeWidth={1.5} 
                    dot={true}
                  />
                </LineChart>
              ) : (
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUispClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" />
                  <YAxis tick={{ fontSize: 9, fill: 'currentColor' }} className="text-slate-400" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.95)', border: 'none', borderRadius: '6px', color: '#f8fafc', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }} />
                  <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Area 
                    name="UISP Subscriber Links" 
                    type="monotone" 
                    dataKey="uispActiveClients" 
                    stroke="#ec4899" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#colorUispClients)" 
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

      </div>
      
    </div>
  );
}
