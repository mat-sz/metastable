export interface GPUInfo {
  source: string;
  vendor?: string;
  busAddress?: string;
  vram: number;
  name?: string;
  memoryUsed?: number;
  utilizationGpu?: number;
  temperatureGpu?: number;
}

export interface GPUUtilization {
  source: string;
  vendor?: string;
  vram: number;
  memoryUsed?: number;
  utilizationGpu?: number;
  temperatureGpu?: number;
}

export interface GPUInfoProvider {
  isAvailable(): Promise<boolean>;
  devices(): Promise<GPUInfo[]>;
  utilization?(): Promise<GPUUtilization[]>;
}
