import {
  string,
  struct,
  uint16,
  uint32,
  array,
  uint8Array,
  uint64,
} from 'ebin';
import { inflateRaw } from 'pako';

const SIG_CD = 0x02014b50;
const SIG_EOCD = 0x06054b50;
const SIG_LOCAL = 0x04034b50;
const SIG_ZIP64_EOCD = 0x06064b50;
const SIG_ZIP64_EOCD_LOCATOR = 0x07064b50;

const USE_ZIP64_FIELD = 0xffffffff;

const extraFieldData = struct({
  id: uint16(),
  length: uint16(),
  data: uint8Array(),
})
  .littleEndian()
  .withByteLength('data', 'length');

const localRecord = struct({
  signature: uint32(),
  minVersion: uint16(),
  flag: uint16(),
  method: uint16(),
  modifiedTime: uint16(),
  modifiedDate: uint16(),
  checksum: uint32(),
  compressedSize: uint32(),
  uncompressedSize: uint32(),
  nameLength: uint16(),
  extraFieldLength: uint16(),
  name: string(),
  extraField: array(extraFieldData),
})
  .withByteLength('name', 'nameLength')
  .withByteLength('extraField', 'extraFieldLength')
  .littleEndian();

const zip64ExtendedField = struct({
  data: uint64(),
}).littleEndian();

const cdRecord = struct({
  signature: uint32(),
  version: uint16(),
  minVersion: uint16(),
  flag: uint16(),
  method: uint16(),
  modifiedTime: uint16(),
  modifiedDate: uint16(),
  checksum: uint32(),
  compressedSize: uint32(),
  uncompressedSize: uint32(),
  nameLength: uint16(),
  extraFieldLength: uint16(),
  commentLength: uint16(),
  diskNumber: uint16(),
  internalFileAttributes: uint16(),
  externalFileAttributes: uint32(),
  relativeOffset: uint32(),
  name: string(),
  extraField: array(extraFieldData),
  comment: string(),
})
  .littleEndian()
  .withByteLength('name', 'nameLength')
  .withByteLength('extraField', 'extraFieldLength')
  .withByteLength('comment', 'commentLength');

const eocdRecord = struct({
  signature: uint32(),
  diskNumber: uint16(),
  startDiskNumber: uint16(),
  diskRecordsCount: uint16(),
  totalRecordsCount: uint16(),
  centralDirectorySize: uint32(),
  centralDirectoryOffset: uint32(),
  commentLength: uint16(),
  comment: string(),
}).withByteLength('comment', 'commentLength');

const zip64EocdRecord = struct({
  signature: uint32(),
  size: uint64(),
  version: uint16(),
  minVersion: uint16(),
  diskNumber: uint32(),
  cdDiskNumber: uint32(),
  diskRecordsCount: uint64(),
  totalRecordsCount: uint64(),
  cdSize: uint64(),
  cdOffset: uint64(),
}).littleEndian();

const zip64EocdLocator = struct({
  signature: uint32(),
  diskNumber: uint32(),
  zip64EocdOffset: uint64(),
  diskCount: uint32(),
}).littleEndian();

const zip64ExtraFieldData = struct({
  id: uint16(),
  length: uint32(),
  data: string(),
}).withByteLength('data', 'length');

const cdRecords = array(cdRecord);

const decoder = new TextDecoder();

class RemoteZip {
  constructor(
    private url: string,
    private records: (typeof cdRecord)['TYPE'][],
  ) {}

  get files() {
    return this.records.map(record => ({
      name: record.name,
      size: record.uncompressedSize,
    }));
  }

  async file(path: string) {
    for (const record of this.records) {
      if (record.name === path) {
        if (record.signature !== SIG_CD) {
          throw new Error('Received invalid central directory record.');
        }

        let offset = zip64Offset(record);
        const local = localRecord.fromArrayBuffer(
          await fetchRange(this.url, offset, 512),
        );
        if (local.signature !== SIG_LOCAL) {
          throw new Error('Received invalid local record.');
        }

        offset += 30 + local.nameLength + local.extraFieldLength;
        const size = local.compressedSize;
        const buffer = await fetchRange(this.url, offset, size);

        if (local.method === 8) {
          return inflateRaw(buffer, { to: 'string' });
        } else {
          return decoder.decode(buffer);
        }
      }
    }

    throw new Error(`File not found: ${path}.`);
  }
}

function zip64Offset(record: (typeof cdRecord)['TYPE']) {
  let offset = record.relativeOffset;

  if (offset === USE_ZIP64_FIELD) {
    const field = record.extraField.find(field => field.id === 0x01);
    if (field) {
      const data = zip64ExtendedField.fromByteArray(field.data);
      offset = Number(data.data);
    }
  }

  return offset;
}

async function fetchRange(url: string, start: number, length?: number) {
  const res = await fetch(url, {
    headers: { Range: `bytes=${start}-${length ? start + length - 1 : ''}` },
  });

  return await res.arrayBuffer();
}

async function fetchSize(url: string) {
  const res = await fetch(url, { method: 'HEAD' });
  const length = res.headers.get('content-length');
  return length ? parseInt(length) : undefined;
}

function findUint32(dataView: DataView, needle: number) {
  for (let i = 0; i < dataView.byteLength - 4; i++) {
    if (dataView.getUint32(i, true) === needle) {
      return i;
    }
  }

  return -1;
}

export async function fetchZip(url: string) {
  const size = await fetchSize(url);
  if (!size) {
    throw new Error('Could not receive file size.');
  }

  const buffer = await fetchRange(url, size - 128);
  const dataView = new DataView(buffer);

  const start = findUint32(dataView, SIG_EOCD);
  const zip64EocdLocatorStart = findUint32(dataView, SIG_ZIP64_EOCD_LOCATOR);

  let cdSize = dataView.getUint32(start + 12, true);
  let cdOffset = dataView.getUint32(start + 16, true);

  if (zip64EocdLocatorStart !== -1) {
    const locator = zip64EocdLocator.fromArrayBuffer(
      buffer.slice(zip64EocdLocatorStart),
    );
    const recordBuffer = await fetchRange(
      url,
      Number(locator.zip64EocdOffset),
      64,
    );
    const zip64Eocd = zip64EocdRecord.fromArrayBuffer(recordBuffer);

    if (zip64Eocd.signature !== SIG_ZIP64_EOCD) {
      throw new Error('Received invalid ZIP64 EOCD.');
    }

    if (cdOffset === USE_ZIP64_FIELD) {
      cdOffset = Number(zip64Eocd.cdOffset);
    }

    if (cdSize === USE_ZIP64_FIELD) {
      cdSize = Number(zip64Eocd.cdSize);
    }
  }

  if (start !== -1) {
    const buffer = await fetchRange(url, cdOffset, cdSize);
    const records = cdRecords.fromArrayBuffer(buffer);
    return new RemoteZip(url, records);
  } else {
    throw new Error('Invalid zip file.');
  }
}
