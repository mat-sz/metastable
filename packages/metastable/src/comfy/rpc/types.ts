export interface RPCSessionProgressEvent {
  value: number;
  max: number;
  preview?: string;
}

export interface RPCSessionLogEvent {
  type: 'stdout' | 'stderr';
  text: string;
}

export interface RPCRef<T = undefined> {
  $type: T;
  $ref: string | number;
}

export interface RPCBytes {
  $bytes: string;
}

export interface RPCRequest {
  type: 'rpc';
  method: string;
  params?: Record<string, any>;
  id: string;
  session: string;
}

export interface RPCResponse {
  type: 'rpc';
  result?: any;
  error?: {
    message: string;
    data?: any;
  };
  id: string;
}
