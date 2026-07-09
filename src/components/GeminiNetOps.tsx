/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NetworkDevice, Alert, NetOpsAnalysisResponse } from '../types.js';
import { 
  Sparkles, 
  Terminal, 
  Cpu, 
  AlertTriangle, 
  CheckSquare, 
  Square,
  Copy,
  Check,
  ArrowRight,
  Send,
  Loader2,
  ChevronDown,
  Info
} from 'lucide-react';

interface GeminiNetOpsProps {
  devices: NetworkDevice[];
  alerts: Alert[];
  selectedDevice: NetworkDevice | null;
  setSelectedDevice: (device: NetworkDevice | null) => void;
}

export default function GeminiNetOps({
  devices,
  alerts,
  selectedDevice,
  setSelectedDevice
}: GeminiNetOpsProps) {
  const [customQuestion, setCustomQuestion] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [response, setResponse] = React.useState<NetOpsAnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = React.useState<Record<string, boolean>>({});
  const [copiedCommands, setCopiedCommands] = React.useState(false);

  // Trigger auto-analysis when selectedDevice changes
  React.useEffect(() => {
    if (selectedDevice) {
      handleTriggerAnalysis();
    }
  }, [selectedDevice]);

  const handleTriggerAnalysis = async () => {
    if (!selectedDevice) return;
    
    setIsLoading(true);
    setResponse(null);
    setErrorMessage(null);
    setCompletedTasks({});

    // Filter alerts related to the selected device
    const deviceAlerts = alerts
      .filter(a => a.deviceId === selectedDevice.id && !a.acknowledged)
      .map(a => `[Severity: ${a.severity}] ${a.title}: ${a.message}`)
      .join('\n');

    // Create a textual snapshot of the device's state
    const deviceContext = `
Model: ${selectedDevice.model}
Type: ${selectedDevice.type.toUpperCase()}
Category: ${selectedDevice.category.toUpperCase()}
Status: ${selectedDevice.status.toUpperCase()}
IP Address: ${selectedDevice.ipAddress}
MAC Address: ${selectedDevice.macAddress}
Firmware: ${selectedDevice.firmware}
CPU Usage: ${selectedDevice.cpuUsage}%
Memory RAM Usage: ${selectedDevice.ramUsage}%
Throughput (RX/TX): ${selectedDevice.bandwidthInMbps} Mbps / ${selectedDevice.bandwidthOutMbps} Mbps
Uptime: ${selectedDevice.uptimeSeconds} seconds
${selectedDevice.wirelessDetails ? `Wireless Signal: ${selectedDevice.wirelessDetails.signalStrengthDbm} dBm, Freq: ${selectedDevice.wirelessDetails.frequencyMhz} MHz, Distance: ${selectedDevice.wirelessDetails.distanceMeters}m` : ''}
${selectedDevice.ports ? `Active Ports: ${selectedDevice.ports.filter(p => p.isConnected).length}/${selectedDevice.ports.length}` : ''}
    `.trim();

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          deviceContext,
          recentAlerts: deviceAlerts || 'None active. Device is reporting clean heartbeats.',
          customQuestion: customQuestion.trim() || undefined
        })
      });

      if (!res.ok) {
        throw new Error('Server-side AI analysis failed.');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to the Gemini NetOps Engine. Make sure backend is responsive.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = (idx: number) => {
    setCompletedTasks(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const copyCommands = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedCommands(true);
    setTimeout(() => setCopiedCommands(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col" id="gemini-ai-copilot">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand via-brand-hover to-brand-dark p-3.5 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-white/10 rounded backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm flex items-center gap-1">
              Gemini AI NetOps Engine
              <span className="text-[8px] bg-emerald-500 text-white font-mono uppercase font-bold tracking-widest px-1 py-0.2 rounded">
                Copilot
              </span>
            </h3>
            <p className="text-[10px] text-blue-100">
              Automated Ubiquiti SSH command generation &amp; RF diagnosis
            </p>
          </div>
        </div>

        {selectedDevice && (
          <button
            onClick={() => setSelectedDevice(null)}
            className="text-[10px] font-semibold px-2 py-0.5 bg-white/15 hover:bg-white/25 rounded border border-white/10 transition-colors cursor-pointer"
          >
            Reset Copilot
          </button>
        )}
      </div>

      {/* Main Copilot Board */}
      <div className="p-3.5 space-y-3.5">
        
        {/* Step 1: Select Device for Analysis */}
        {!selectedDevice ? (
          <div className="py-6 text-center space-y-3">
            <div className="max-w-sm mx-auto space-y-1.5">
              <Terminal className="h-8 w-8 text-slate-300 mx-auto opacity-60" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-display">
                No active device selected for AI Diagnosis
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                Click any device&apos;s <strong className="text-slate-500 dark:text-slate-300">AI NetOps</strong> button in the grid above, or choose a device from the selector below to initiate diagnostic analysis.
              </p>
            </div>

            {/* Quick selector dropdown */}
            <div className="max-w-xs mx-auto">
              <select
                onChange={(e) => {
                  const dev = devices.find(d => d.id === e.target.value);
                  if (dev) setSelectedDevice(dev);
                }}
                className="w-full text-[11px] font-semibold px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand focus:bg-white"
                defaultValue=""
              >
                <option value="" disabled>Select device to diagnose...</option>
                {devices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.model} - {d.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          
          // Device Active Selection Panel
          <div className="space-y-4">
            
            {/* Selected Device Context Card */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400">Target diagnostic host</div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedDevice.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {selectedDevice.name}
                  <span className="text-[10px] font-mono font-medium text-slate-400">({selectedDevice.ipAddress})</span>
                </h4>
              </div>

              {/* Custom question parameters */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask custom question (e.g. 'How do I check routing rules?')..."
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    className="w-full pl-2.5 pr-8 py-1.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand"
                    onKeyDown={(e) => e.key === 'Enter' && handleTriggerAnalysis()}
                  />
                  <button
                    onClick={handleTriggerAnalysis}
                    disabled={isLoading}
                    className="absolute right-1 top-1 p-1 bg-brand hover:bg-brand-hover text-white rounded transition-colors cursor-pointer"
                    title="Send customized inquiry"
                  >
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-600 dark:text-rose-400 rounded flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Loader */}
            {isLoading && (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="h-6 w-6 text-brand dark:text-teal-400 animate-spin mx-auto" />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Gemini is parsing SNMP state logs and generating recommendations...
                </p>
              </div>
            )}

            {/* AI Insights Responses */}
            {response && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="gemini-insights-grid">
                
                {/* Left Column: Diagnosis & Action items */}
                <div className="space-y-3.5">
                  
                  {/* Summary Box */}
                  <div className="p-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded text-[11px] leading-tight text-indigo-800 dark:text-indigo-300">
                    <strong>AI NetOps Summary:</strong> {response.summary}
                  </div>

                  {/* Deep Diagnosis */}
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-blue-500" /> Physical Layer Diagnosis
                    </h5>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 leading-normal font-sans shadow-inner">
                      {response.diagnosis}
                    </div>
                  </div>

                  {/* Recommendations Checklist */}
                  <div className="space-y-1">
                    <h5 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                      Interactive Troubleshooting Plan
                    </h5>
                    
                    <div className="space-y-1">
                      {response.recommendations.map((rec, idx) => {
                        const isDone = completedTasks[idx];
                        return (
                          <div
                            key={idx}
                            onClick={() => toggleTask(idx)}
                            className={`p-2 border rounded text-[11px] transition-all flex items-center space-x-2.5 cursor-pointer ${
                              isDone
                                ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/30 text-slate-400 dark:text-slate-500 line-through'
                                : 'bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="shrink-0">
                              {isDone ? (
                                <CheckSquare className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Square className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700" />
                              )}
                            </span>
                            <span>{rec}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Right Column: SSH Console CLI Commands */}
                {response.cliCommands && (
                  <div className="flex flex-col h-full space-y-1">
                    
                    <div className="flex justify-between items-center">
                      <h5 className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Terminal className="h-3 w-3 text-blue-500" /> Secure SSH Controller Terminal
                      </h5>
                      
                      <button
                        onClick={() => copyCommands(response.cliCommands || '')}
                        className="text-[9px] font-bold font-mono text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-0.5 transition-colors bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 cursor-pointer"
                      >
                        {copiedCommands ? (
                          <>
                            <Check className="h-2.5 w-2.5 text-emerald-500" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-2.5 w-2.5" /> Copy SSH
                          </>
                        )}
                      </button>
                    </div>

                    {/* Dark Console Window */}
                    <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-lg p-3 font-mono text-[10px] text-emerald-400 space-y-2.5 shadow-inner flex flex-col justify-between min-h-[260px]">
                      
                      {/* Terminal header decorations */}
                      <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-0.5 shrink-0">
                        <div className="flex items-center space-x-1">
                          <span className="h-2 w-2 rounded-full bg-rose-500/80" />
                          <span className="h-2 w-2 rounded-full bg-amber-500/80" />
                          <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                        </div>
                        <span className="text-[9px] text-slate-600 uppercase tracking-widest">SSH SESSION - ADMIN</span>
                      </div>

                      {/* Command output render */}
                      <div className="flex-1 overflow-y-auto space-y-1.5 whitespace-pre-wrap select-all leading-relaxed">
                        <span className="text-slate-500 block"># Establishing secure SSH console loop to {selectedDevice.ipAddress}...</span>
                        <span className="text-slate-500 block"># Handshaking with Ubiquiti OS v3.2 (MIPS/ARM64 controller)...</span>
                        <span className="text-blue-400 block">$ ssh admin@{selectedDevice.ipAddress}</span>
                        
                        <div className="text-emerald-400 font-mono mt-0.5 leading-relaxed">
                          {response.cliCommands}
                        </div>
                      </div>

                      {/* Input line placeholder */}
                      <div className="border-t border-slate-900 pt-1.5 mt-1.5 flex items-center space-x-1 text-slate-500 shrink-0">
                        <span className="text-emerald-500">$</span>
                        <span className="animate-pulse">_</span>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
