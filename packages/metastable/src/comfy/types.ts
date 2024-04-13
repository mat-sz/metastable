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
