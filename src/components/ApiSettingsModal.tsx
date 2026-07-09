/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Settings, Check, RefreshCw, AlertTriangle, Globe, Lock, ShieldCheck, Database 
} from 'lucide-react';

interface ApiConfig {
  unifi: {
    enabled: boolean;
    url: string;
    apiKey: string;
    siteId: string;
    skipTls: boolean;
  };
  uisp: {
    enabled: boolean;
    url: string;
    token: string;
    skipTls: boolean;
  };
}

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ApiSettingsModal({ isOpen, onClose, onSaved }: ApiSettingsModalProps) {
  const [activeTab, setActiveTab] = React.useState<'unifi' | 'uisp'>('unifi');
  const [config, setConfig] = React.useState<ApiConfig>({
    unifi: {
      enabled: false,
      url: '',
      apiKey: '',
      siteId: 'default',
      skipTls: true
    },
    uisp: {
      enabled: false,
      url: '',
      token: '',
      skipTls: true
    }
  });

  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [isSaving, setIsSaving] = React.useState(false);

  // Load current config from server when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/config')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to load API settings');
        })
        .then(data => {
          if (data) {
            setConfig({
              unifi: {
                enabled: data.unifi?.enabled ?? false,
                url: data.unifi?.url ?? '',
                apiKey: data.unifi?.apiKey ?? '',
                siteId: data.unifi?.siteId ?? 'default',
                skipTls: data.unifi?.skipTls ?? true
              },
              uisp: {
                enabled: data.uisp?.enabled ?? false,
                url: data.uisp?.url ?? '',
                token: data.uisp?.token ?? '',
                skipTls: data.uisp?.skipTls ?? true
              }
            });
          }
        })
        .catch(err => console.error(err));
      setTestResult(null);
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          credentials: config[activeTab]
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || `Successfully connected to ${activeTab === 'unifi' ? 'UniFi Controller' : 'UISP Server'}!`
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed. Please check host URL and credentials.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `HTTP Request Failed: ${err.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save configuration');
      }
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (section: 'unifi' | 'uisp', field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setTestResult(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.15 }}
          className="relative bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col z-10 font-sans"
        >
          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-500/10 rounded text-blue-600 dark:text-blue-400">
                <Settings className="h-4.5 w-4.5 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-950 dark:text-white font-display">
                  Live API Credentials Manager
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Configure live polling from UniFi &amp; UISP
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs Selector */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 px-4">
              <button
                type="button"
                onClick={() => { setActiveTab('unifi'); setTestResult(null); }}
                className={`py-3 px-4 font-display text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'unifi'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                UniFi Controller API
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('uisp'); setTestResult(null); }}
                className={`py-3 px-4 font-display text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'uisp'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                UISP (UNMS) API
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto">
              {activeTab === 'unifi' ? (
                /* UNIFI TAB CONTENT */
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                        Enable UniFi Live Sync
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight block">
                        If enabled, dashboard fetches node details from your real controller.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.unifi.enabled}
                        onChange={(e) => updateField('unifi', 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Controller Base URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="url"
                        placeholder="https://192.168.1.1:443"
                        value={config.unifi.url}
                        onChange={(e) => updateField('unifi', 'url', e.target.value)}
                        required={config.unifi.enabled}
                        className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 block leading-none pl-1">
                      Include protocol and port, e.g., https://unifi-controller.local:8443
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      UniFi Controller API Key
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Enter controller API key"
                        value={config.unifi.apiKey}
                        onChange={(e) => updateField('unifi', 'apiKey', e.target.value)}
                        required={config.unifi.enabled}
                        className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 block leading-none pl-1">
                      Generate this local API Key under UniFi Network Application Settings
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Site ID
                      </label>
                      <input
                        type="text"
                        placeholder="default"
                        value={config.unifi.siteId}
                        onChange={(e) => updateField('unifi', 'siteId', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950"
                      />
                    </div>

                    <div className="flex items-center pt-5 pl-1">
                      <label className="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.unifi.skipTls}
                          onChange={(e) => updateField('unifi', 'skipTls', e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Skip SSL Verification</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* UISP TAB CONTENT */
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                        Enable UISP Live Sync
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight block">
                        If enabled, dashboard fetches backhaul nodes from your real UISP Server.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.uisp.enabled}
                        onChange={(e) => updateField('uisp', 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      UISP Host URL
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="url"
                        placeholder="https://uisp.mycompany.com"
                        value={config.uisp.url}
                        onChange={(e) => updateField('uisp', 'url', e.target.value)}
                        required={config.uisp.enabled}
                        className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 block leading-none pl-1">
                      URL of your UISP deployment (or UNMS local controller)
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      UISP API Token
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Enter UISP App Token..."
                        value={config.uisp.token}
                        onChange={(e) => updateField('uisp', 'token', e.target.value)}
                        required={config.uisp.enabled}
                        className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-950"
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 block leading-tight pl-1">
                      Generate this in your UISP settings: Settings &gt; Users &gt; Add App Token.
                    </span>
                  </div>

                  <div className="flex items-center pt-2 pl-1">
                    <label className="flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.uisp.skipTls}
                        onChange={(e) => updateField('uisp', 'skipTls', e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Skip SSL Verification</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Test Connection feedback panel */}
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border text-xs flex items-start space-x-2 ${
                    testResult.success
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="font-semibold block mb-0.5">
                      {testResult.success ? 'Success' : 'Connection Failed'}
                    </strong>
                    <span className="leading-tight block">{testResult.message}</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer / Actions Bar */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || (activeTab === 'unifi' ? !config.unifi.url : !config.uisp.url)}
                className="text-[11px] font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[11px] font-semibold px-3 py-1.5 bg-white hover:bg-slate-50 dark:bg-[#0f172a] dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="text-[11px] font-semibold px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm hover:shadow transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
