import assert from 'assert';

import { readPartial } from './utils.js';

const MAX_HEADER_SIZE = 16 * 1024 * 1024;

export async function readSafetensors(modelPath: string) {
  const start = await readPartial(modelPath, 0, 9);
  assert(start.readUint8(0x8) === 0x7b, "Header doesn't start with '{'.");

  const length = Number(start.readBigUint64LE(0));
  assert(length >= 8, 'Header too small.');
  assert(length <= MAX_HEADER_SIZE, 'Header too large.');

  const buffer = await readPartial(modelPath, 8, 8 + length - 1);

  try {
    const data = buffer.toString('utf8');
    const json = JSON.parse(data);
    const metadata = json['__metadata__'];
    delete json['__metadata__'];

    return {
      metadata,
      state_dict: json,
    };
  } catch {
    throw new Error('Unable to deserialize header.');
  }
}
