export interface GPUInfo {
  vendor?: string;
  vendorId?: string;
  model?: string;
  deviceId?: string;
  bus?: string;
  busAddress?: string;
  vram: number;
  vramDynamic: boolean;
  external?: boolean;
  subDeviceId?: string;
  name?: string;
  pciBus?: string;
  pciID?: string;
  memoryTotal?: number;
  memoryUsed?: number;
  utilizationGpu?: number;
  temperatureGpu?: number;
}

export interface GPUUtilization {
  memoryTotal?: number;
  memoryUsed?: number;
  utilizationGpu?: number;
  temperatureGpu?: number;
}

export interface GPUInfoProvider {
  isAvailable(): Promise<boolean>;
  devices(): Promise<GPUInfo[]>;
  utilization?(): Promise<GPUUtilization[]>;
}
