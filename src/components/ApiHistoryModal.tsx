/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

// For safe import of icons, let's write normal named import from lucide-react
import { 
  X, Terminal, RefreshCw, Trash2, ChevronDown, ChevronRight, Copy, Check, 
  Filter, ShieldCheck, Info, AlertCircle, CheckCircle, ArrowUpRight
} from 'lucide-react';

interface ApiLogEntry {
  id: string;
  timestamp: string;
  integration: 'unifi' | 'uisp';
  url: string;
  method: string;
  headers: Record<string, string>;
  status: number;
  statusText: string;
  responsePreview: string;
  timeTakenMs: number;
  isCached: boolean;
}

interface ApiHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiHistoryModal({ isOpen, onClose }: ApiHistoryModalProps) {
  const [logs, setLogs] = React.useState<ApiLogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedLogId, setSelectedLogId] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [integrationFilter, setIntegrationFilter] = React.useState<'all' | 'unifi' | 'uisp'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchLogs = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch('/api/request-history');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching live API tracer logs:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to flush the live API transaction logs?')) return;
    try {
      const res = await fetch('/api/request-history/clear', { method: 'POST' });
      if (res.ok) {
        setLogs([]);
        setSelectedLogId(null);
      }
    } catch (err) {
      console.error('Failed to flush live API transaction logs:', err);
    }
  };

  // Poll for logs every 3 seconds if active & open
  React.useEffect(() => {
    if (!isOpen) return;
    fetchLogs(true);

    let intervalId: any = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchLogs(false);
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, autoRefresh, fetchLogs]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and search logs
  const filteredLogs = logs.filter(log => {
    const matchesIntegration = integrationFilter === 'all' || log.integration === integrationFilter;
    const matchesSearch = 
      log.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.method.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(log.status).includes(searchQuery) ||
      log.statusText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.responsePreview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIntegration && matchesSearch;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="api-history-modal-container">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            id="api-history-backdrop"
          />

          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-5xl rounded-xl border border-slate-800 bg-[#090d16] text-slate-100 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
              id="api-history-panel"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0d1220]">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-md border border-teal-500/20">
                    <Terminal className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-mono tracking-tight text-white flex items-center gap-2">
                      Live Controller API Tracer
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                        Container SD-WAN Stream
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans">
                      Inspect outbound network sockets communicating directly with remote Ubiquiti endpoint nodes.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                  id="api-history-close-btn"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status banner */}
              <div className="bg-[#12192c]/50 px-5 py-3 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Verification Engine:</strong> Real-time packets intercepted at host. No synthetic or local state caches bypass this logger.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wide font-bold">
                    Socket Tracer Listening
                  </span>
                </div>
              </div>

              {/* Top Controls Toolbar */}
              <div className="p-4 bg-[#0a0f1b] border-b border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Filters */}
                  <div className="inline-flex rounded-lg bg-[#0e1628] p-1 border border-slate-800 text-[11px] font-mono font-medium">
                    <button
                      onClick={() => setIntegrationFilter('all')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        integrationFilter === 'all' 
                          ? 'bg-slate-800 text-white font-bold' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All Packets
                    </button>
                    <button
                      onClick={() => setIntegrationFilter('unifi')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        integrationFilter === 'unifi' 
                          ? 'bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30' 
                          : 'text-slate-400 hover:text-blue-400'
                      }`}
                    >
                      UniFi Only
                    </button>
                    <button
                      onClick={() => setIntegrationFilter('uisp')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        integrationFilter === 'uisp' 
                          ? 'bg-teal-600/30 text-teal-300 font-bold border border-teal-500/30' 
                          : 'text-slate-400 hover:text-teal-400'
                      }`}
                    >
                      UISP Only
                    </button>
                  </div>

                  {/* Search */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs, methods, payloads..."
                    className="bg-[#0e1628] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500 max-w-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 text-xs">
                  {/* Auto refresh toggle */}
                  <label className="flex items-center space-x-2 cursor-pointer select-none border border-slate-800 px-2.5 py-1.5 rounded-lg bg-[#0e1628]/40 hover:bg-[#0e1628] transition-colors">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500/30 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-slate-400 text-[11px] font-mono">Auto Poll (3s)</span>
                  </label>

                  {/* Manual Refresh */}
                  <button
                    onClick={() => fetchLogs(true)}
                    disabled={isLoading}
                    className="p-1.5 bg-[#0e1628] hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    title="Force refresh transaction history"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
                  </button>

                  {/* Flush button */}
                  <button
                    onClick={handleClearLogs}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 rounded-lg transition-colors border border-rose-900/30 cursor-pointer font-mono text-[11px]"
                    title="Flush server trace log"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Flush Tracer</span>
                  </button>
                </div>
              </div>

              {/* Main Contents Grid */}
              <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
                
                {/* List Pane */}
                <div className="border-r border-slate-800 overflow-y-auto divide-y divide-slate-900 bg-[#05080f]">
                  {filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3 p-8 text-center">
                      <Terminal className="h-10 w-10 text-slate-700 animate-pulse" />
                      <div className="space-y-1">
                        <p className="text-xs font-mono font-bold text-slate-400">No Captured Packets Found</p>
                        <p className="text-[10px] text-slate-600 max-w-xs leading-relaxed">
                          Verify that live UniFi or UISP credentials are configured and active in <strong>API Settings</strong>. When the server polls the controllers, the raw request stream is generated instantly here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredLogs.map((log) => {
                      const isSelected = selectedLogId === log.id;
                      const hasSuccess = log.status >= 200 && log.status < 300;
                      const isUnifi = log.integration === 'unifi';

                      // Find a human readable slug of the URL endpoint
                      let endpointSlug = log.url;
                      try {
                        const parsed = new URL(log.url);
                        endpointSlug = parsed.pathname;
                      } catch {}

                      return (
                        <div
                          key={log.id}
                          onClick={() => setSelectedLogId(isSelected ? null : log.id)}
                          className={`p-3.5 hover:bg-[#0d1323] transition-colors cursor-pointer text-left select-none ${
                            isSelected ? 'bg-[#11182c]' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="min-w-0 space-y-1 flex-1">
                              
                              {/* Meta Indicators */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                                {/* Status badge */}
                                <span className={`px-1.5 py-0.2 rounded-md font-bold ${
                                  hasSuccess 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {log.status || 'FAIL'}
                                </span>

                                {/* Integration badge */}
                                <span className={`px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider ${
                                  isUnifi 
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                    : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                                }`}>
                                  {log.integration}
                                </span>

                                {/* Method */}
                                <span className="text-slate-400 font-bold">
                                  {log.method}
                                </span>

                                {/* Timestamp */}
                                <span className="text-slate-500">
                                  {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                                </span>
                              </div>

                              {/* Endpoint Slug */}
                              <p className="text-[11px] font-mono text-slate-200 truncate break-all" title={log.url}>
                                {endpointSlug}
                              </p>

                              {/* Latency and Details snippet */}
                              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                                <span className="flex items-center gap-1">
                                  Response Delay: <strong className="text-slate-400">{log.timeTakenMs}ms</strong>
                                </span>
                                <span>•</span>
                                <span className="truncate max-w-[200px]">
                                  {log.statusText || 'Error Connecting'}
                                </span>
                              </div>

                            </div>

                            {/* Chevron expand */}
                            <div className="text-slate-500 pt-0.5">
                              {isSelected ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Inspect Payload Pane */}
                <div className="overflow-y-auto bg-[#070b12] p-4 flex flex-col h-full border-t lg:border-t-0 border-slate-800">
                  {(() => {
                    const activeLog = logs.find(l => l.id === selectedLogId);
                    if (!activeLog) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-2 p-8 text-center h-full">
                          <Info className="h-6 w-6 text-slate-700" />
                          <p className="text-xs font-mono text-slate-400">Request Inspector Idle</p>
                          <p className="text-[10px] text-slate-600 max-w-xs">
                            Select any active HTTP exchange on the left pane to analyze raw headers and response JSON dumps received from the Ubiquiti controllers.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4 text-left">
                        
                        {/* Transaction Title */}
                        <div className="border-b border-slate-800 pb-3">
                          <h4 className="text-xs font-mono font-bold text-white tracking-wider uppercase mb-1">
                            Socket Connection Details
                          </h4>
                          <div className="bg-[#0f172a] p-2.5 rounded border border-slate-800/80 font-mono text-[10px] text-slate-300 break-all select-all select-text">
                            <span className="text-teal-400 font-bold">{activeLog.method}</span> {activeLog.url}
                          </div>
                        </div>

                        {/* Connection statistics */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                          <div className="bg-[#0f172a]/40 p-2 border border-slate-800/60 rounded">
                            <span className="text-slate-500 block mb-0.5">Transmission Delay</span>
                            <span className="text-white font-bold">{activeLog.timeTakenMs} ms</span>
                          </div>
                          <div className="bg-[#0f172a]/40 p-2 border border-slate-800/60 rounded">
                            <span className="text-slate-500 block mb-0.5">Response State</span>
                            <span className={`font-bold ${activeLog.status >= 200 && activeLog.status < 300 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              HTTP {activeLog.status} ({activeLog.statusText})
                            </span>
                          </div>
                          <div className="bg-[#0f172a]/40 p-2 border border-slate-800/60 rounded col-span-2">
                            <span className="text-slate-500 block mb-0.5">Captured Timestamp</span>
                            <span className="text-slate-300">{new Date(activeLog.timestamp).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Outbound Headers */}
                        <div className="space-y-1.5">
                          <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            Masked Request Headers
                          </h5>
                          <div className="bg-[#0b101c] p-3 rounded-lg border border-slate-800 text-[10px] font-mono space-y-1 max-h-[150px] overflow-y-auto">
                            {Object.keys(activeLog.headers).length === 0 ? (
                              <span className="text-slate-600 italic">No headers present</span>
                            ) : (
                              Object.entries(activeLog.headers).map(([k, v]) => (
                                <div key={k} className="flex justify-between border-b border-slate-900 pb-1 last:border-0 last:pb-0 gap-4">
                                  <span className="text-slate-500 select-all">{k}</span>
                                  <span className="text-slate-300 font-semibold truncate select-all" title={v}>{v}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Raw JSON / Payload Payload */}
                        <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                              Controller Raw Payload Stream
                            </h5>
                            <button
                              onClick={() => copyToClipboard(activeLog.responsePreview, activeLog.id)}
                              className="flex items-center space-x-1 px-2 py-0.5 bg-[#141b2c] hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-mono text-[9px] cursor-pointer"
                            >
                              {copiedId === activeLog.id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy payload</span>
                                </>
                              )}
                            </button>
                          </div>
                          
                          <div className="relative rounded-lg border border-slate-800 bg-[#02050a] flex-1 min-h-[220px]">
                            <pre className="absolute inset-0 p-3.5 overflow-auto text-[10px] font-mono text-emerald-400 leading-relaxed select-text select-all scrollbar-thin whitespace-pre-wrap word-break-all">
                              <code>{activeLog.responsePreview || '// No payload body response received.'}</code>
                            </pre>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>

              </div>

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
