export interface GraphicsControllerData {
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

export interface GraphicsControllerUtilization {
  memoryTotal?: number;
  memoryUsed?: number;
  utilizationGpu?: number;
  temperatureGpu?: number;
}
