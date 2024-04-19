export interface ComfyTorchInfo {
  memory: {
    vram: number;
    ram: number;
  };
  device: {
    type: string;
    name: string;
    index?: number;
    allocator_backend?: string;
  };
  vae: {
    dtype: string;
  };
}

export type BackendStatus = 'ready' | 'starting' | 'error';
