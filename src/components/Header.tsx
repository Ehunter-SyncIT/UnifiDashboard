/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Moon, Cpu, Shield, Activity, Wifi, Settings, Terminal } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onlineCount: number;
  totalCount: number;
  alertCount: number;
  totalDownloadMbps: number;
  totalUploadMbps: number;
  onOpenSettings: () => void;
  onOpenApiHistory: () => void;
}

export default function Header({
  darkMode,
  setDarkMode,
  onlineCount,
  totalCount,
  alertCount,
  totalDownloadMbps,
  totalUploadMbps,
  onOpenSettings,
  onOpenApiHistory
}: HeaderProps) {
  
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 py-2">
          
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-brand rounded text-white shadow-xs">
              <Activity className="h-4.5 w-4.5" id="logo-icon" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-display tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                @Synchronous-IT
                <span className="text-[10px] px-1.5 py-0.2 font-mono rounded bg-brand/10 dark:bg-brand/30 text-brand dark:text-teal-300 font-bold">
                  NetOps v1.2
                </span>
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans hidden sm:block leading-tight">
                Enterprise UniFi &amp; UISP SD-WAN Controller
              </p>
            </div>
          </div>

          {/* Core Analytics Quick-Pills */}
          <div className="hidden lg:flex items-center space-x-4 text-xs font-sans">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-ring"></span>
              <span className="text-slate-600 dark:text-slate-300">
                Devices: <strong className="text-slate-900 dark:text-slate-100">{onlineCount}/{totalCount} Online</strong>
              </span>
            </div>
            
            <div className="flex items-center space-x-1.5 border-l border-slate-200 dark:border-slate-800 pl-4">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-slate-600 dark:text-slate-300">
                WAN RX: <strong className="text-slate-900 dark:text-slate-100">{totalDownloadMbps.toFixed(1)} Mbps</strong>
              </span>
            </div>

            <div className="flex items-center space-x-1.5 border-l border-slate-200 dark:border-slate-800 pl-4">
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-slate-600 dark:text-slate-300">
                WAN TX: <strong className="text-slate-900 dark:text-slate-100">{totalUploadMbps.toFixed(1)} Mbps</strong>
              </span>
            </div>

            {alertCount > 0 && (
              <div className="flex items-center space-x-1.5 border-l border-slate-200 dark:border-slate-800 pl-4">
                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold uppercase rounded border border-rose-500/30 animate-pulse">
                  {alertCount} Alerts
                </span>
              </div>
            )}
          </div>

          {/* Actions: API Settings, API Live Tracer & Dark Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenApiHistory}
              id="api-history-toggle"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center gap-1.5 px-2.5 text-xs font-mono font-medium"
              title="View Raw Live Controller API request & response history"
            >
              <Terminal className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
              <span className="hidden sm:inline text-slate-600 dark:text-slate-300">API Live Tracer</span>
            </button>

            <button
              onClick={onOpenSettings}
              id="api-settings-toggle"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              title="Configure Live UniFi & UISP API Connections"
            >
              <Settings className="h-4 w-4" />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              id="theme-toggle"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode (Late-night maintenance)"}
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
