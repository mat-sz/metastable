export interface ComfySessionProgressEvent {
  value: number;
  max: number;
  preview?: string;
}

export interface ComfySessionLogEvent {
  type: 'stdout' | 'stderr';
  text: string;
}

export interface RPCRef {
  $ref: string | number;
}

export interface RPCBytes {
  $bytes: string;
}

export interface ComfyPreviewSettings {
  method: string;
  taesd?: any;
}

export interface ComfyCheckpointPaths {
  checkpoint?: string;
  diffusionModel?: string;
  textEncoders?: string[];
  vae?: string;
  embeddings?: string;
  config?: string;
}
