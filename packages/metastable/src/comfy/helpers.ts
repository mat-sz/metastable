import { RPCBytes } from './types.js';

export function bufferToRpcBytes(buffer: Buffer): RPCBytes {
  return {
    $bytes: buffer.toString('base64'),
  };
}
