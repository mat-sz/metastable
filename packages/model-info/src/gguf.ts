import assert from 'assert';

import { readPartial } from './utils.js';

enum GGUFMetadataValueType {
  UINT8 = 0,
  INT8 = 1,
  UINT16 = 2,
  INT16 = 3,
  UINT32 = 4,
  INT32 = 5,
  FLOAT32 = 6,
  BOOL = 7,
  STRING = 8,
  ARRAY = 9,
  UINT64 = 10,
  INT64 = 11,
  FLOAT64 = 12,
}

const METADATA_OFFSET = 24;
const MAX_METADATA_SIZE = 16 * 1024 * 1024;

export async function readGguf(modelPath: string) {
  const start = await readPartial(modelPath, 0, METADATA_OFFSET);
  assert(
    start.readUint32BE(0) === 0x47475546,
    "Header doesn't start with 'GGUF'.",
  );

  const count = Number(start.readBigUint64LE(16));
  const buffer = await readPartial(
    modelPath,
    METADATA_OFFSET,
    MAX_METADATA_SIZE,
  );

  let offset = 0;
  let i = 0;

  function readString() {
    const length = Number(buffer.readBigUint64LE(offset));
    offset += 8;
    const data = buffer.subarray(offset, offset + length);
    offset += length;
    return data.toString('utf-8');
  }

  function readValue(type: GGUFMetadataValueType) {
    let value;
    switch (type) {
      case GGUFMetadataValueType.INT8:
        value = buffer.readInt8(offset);
        offset++;
        break;
      case GGUFMetadataValueType.UINT8:
        value = buffer.readUInt8(offset);
        offset++;
        break;
      case GGUFMetadataValueType.INT16:
        value = buffer.readInt16LE(offset);
        offset += 2;
        break;
      case GGUFMetadataValueType.UINT16:
        value = buffer.readUInt16LE(offset);
        offset += 2;
        break;
      case GGUFMetadataValueType.INT32:
        value = buffer.readInt32LE(offset);
        offset += 4;
        break;
      case GGUFMetadataValueType.UINT32:
        value = buffer.readUInt32LE(offset);
        offset += 4;
        break;
      case GGUFMetadataValueType.INT64:
        value = buffer.readBigInt64LE(offset);
        offset += 8;
        break;
      case GGUFMetadataValueType.UINT64:
        value = buffer.readBigUInt64LE(offset);
        offset += 8;
        break;
      case GGUFMetadataValueType.FLOAT32:
        value = buffer.readFloatLE(offset);
        offset += 4;
        break;
      case GGUFMetadataValueType.FLOAT64:
        // We skip this for now.
        offset += 8;
        break;
      case GGUFMetadataValueType.BOOL:
        value = !!buffer.readUInt8(offset);
        offset++;
        break;
      case GGUFMetadataValueType.ARRAY:
        {
          const array: any[] = [];
          const type = buffer.readUint32LE(offset) as GGUFMetadataValueType;
          offset += 4;
          const count = Number(buffer.readBigUint64LE(offset));
          offset += 8;

          let i = 0;
          while (i < count) {
            array.push(readValue(type));
            i++;
          }

          value = array;
        }
        break;
      case GGUFMetadataValueType.STRING:
        value = readString();
        break;
    }

    return value;
  }

  const obj: Record<string, any> = {};

  while (i < count) {
    i++;
    const key = readString();
    const type = buffer.readUint32LE(offset) as GGUFMetadataValueType;
    offset += 4;
    obj[key] = readValue(type);
  }

  return obj;
}
