/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DeviceType = 'unifi' | 'uisp';
export type DeviceCategory = 'router' | 'switch' | 'ap' | 'wireless';
export type DeviceStatus = 'online' | 'warning' | 'offline';

export interface PortStatus {
  portNumber: number;
  speedMbps: number;
  poeActive: boolean;
  poePowerW?: number;
  isConnected: boolean;
}

export interface UispWirelessDetails {
  signalStrengthDbm: number; // e.g. -55
  frequencyMhz: number; // e.g. 5800 (5GHz)
  distanceMeters: number; // e.g. 1200
  noiseFloorDbm: number; // e.g. -96
  txRateMbps: number;
  rxRateMbps: number;
}

export interface NetworkDevice {
  id: string;
  name: string;
  type: DeviceType;
  category: DeviceCategory;
  model: string;
  status: DeviceStatus;
  ipAddress: string;
  macAddress: string;
  firmware: string;
  cpuUsage: number; // 0-100
  ramUsage: number; // 0-100
  bandwidthInMbps: number;
  bandwidthOutMbps: number;
  uptimeSeconds: number;
  alertsCount: number;
  ports?: PortStatus[];
  poeBudgetTotalW?: number;
  poeBudgetUsedW?: number;
  wirelessDetails?: UispWirelessDetails;
}

export interface TrafficSnapshot {
  timestamp: string; // HH:MM:SS or ISO
  downloadMbps: number;
  uploadMbps: number;
  activeClients: number;
  latencyMs: number;
  packetLossPercent: number;
}

export interface Alert {
  id: string;
  timestamp: string; // ISO
  severity: 'info' | 'warning' | 'critical';
  deviceId: string;
  deviceName: string;
  title: string;
  message: string;
  acknowledged: boolean;
  category: 'bandwidth' | 'health' | 'connection';
}

export interface AlertThresholds {
  maxBandwidthMbps: number;
  maxLatencyMs: number;
  maxCpuUsage: number;
  maxRamUsage: number;
}

export interface NetOpsAnalysisRequest {
  deviceId: string;
  deviceContext: string;
  recentAlerts: string;
  customQuestion?: string;
}

export interface NetOpsAnalysisResponse {
  summary: string;
  diagnosis: string;
  recommendations: string[];
  cliCommands?: string;
}

export interface ClientDevice {
  id: string;
  name: string;
  ipAddress: string;
  macAddress: string;
  deviceType: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'iot' | 'tv' | 'server';
  apIdOrSwitchId: string;
  apOrSwitchName: string;
  connectionType: 'wifi' | 'wired';
  wifiBand?: '2.4GHz' | '5GHz' | '6GHz';
  signalStrengthDbm?: number; // e.g. -65
  vlanId: number;
  activityInMbps: number;
  activityOutMbps: number;
  totalDataDownloadedGb: number;
  totalDataUploadedGb: number;
  uptimeSeconds: number;
  isBlocked?: boolean;
}
