export interface GPUInfo {
  source: string;
  vendor: string;
  busAddress?: string;
  vram: number;
  name?: string;
}

export interface GPUUtilization {
  source: string;
  vendor: string;
  busAddress?: string;
  vram: number;
  vramUsed?: number;
  utilization?: number;
  temperature?: number;
}

export interface GPUInfoProvider {
  isAvailable(): Promise<boolean>;
  devices(): Promise<GPUInfo[]>;
  utilization?(): Promise<GPUUtilization[]>;
}
