import { RPCBytes } from './types.js';

export function bufferToRpcBytes(buffer: Buffer): RPCBytes {
  return {
    $bytes: buffer.toString('base64'),
  };
}

export function deserializeObject<T>(object: T): T {
  if (object === null || typeof object !== 'object') {
    return object;
  }

  const obj = object as any;
  if (obj['$bytes']) {
    return Buffer.from(obj['$bytes'], 'base64') as any;
  }

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object') {
      obj[key] = deserializeObject(obj[key]);
    }
  }

  return obj;
}

export function serializeObject<T>(object: T): T {
  if (object === null || typeof object !== 'object') {
    return object;
  }

  if (object instanceof Buffer) {
    return {
      $bytes: object.toString('base64'),
    } as any;
  }

  const obj = object as any;

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object') {
      obj[key] = serializeObject(obj[key]);
    }
  }

  return obj;
}
