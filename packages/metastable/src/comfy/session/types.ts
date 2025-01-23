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
