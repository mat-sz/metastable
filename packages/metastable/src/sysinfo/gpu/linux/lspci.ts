import os from 'os';

import { arrayParseInt, parseNumber, splitAt } from '#helpers/common.js';
import { stdout } from '#helpers/spawn.js';
import { getVendor, normalizeBusAddress } from '../helpers.js';
import { GPUInfo, GPUInfoProvider } from '../types.js';

const PROVIDER_ID = 'lspci';
const RE_ENTRY_HEADER =
  /^([\da-fA-F]{2}:[\da-fA-F]{2}\.[\da-fA-F]) (.*?) \[([\da-fA-F]{4})\]: (.*?) \[([\da-fA-F]{4}:[\da-fA-F]{4})\]\s?(.*?)$/;

interface LspciEntry {
  busAddress: string;
  className: string;
  classId: number;
  subclassId: number;
  description: string;
  vendorId: number;
  deviceId: number;
  other: string;
  data: Record<string, string>;
}

function parseLspci(output: string): LspciEntry[] {
  const lines = output.split('\n');
  const entries: LspciEntry[] = [];

  let entry: LspciEntry | undefined = undefined;
  let lastDataItem: string | undefined = undefined;

  for (const line of lines) {
    if (!line) {
      // An empty line always follows an entry.
      if (entry) {
        entries.push(entry);
        entry = undefined;
      }
    } else if (line[0] !== '\t') {
      // New entry.
      const parts = line.match(RE_ENTRY_HEADER)?.slice(1);
      if (parts?.length === 6) {
        const [classId, subclassId] = arrayParseInt(splitAt(parts[2], 2), 16);
        const [vendorId, deviceId] = arrayParseInt(parts[4].split(':'), 16);

        entry = {
          busAddress: normalizeBusAddress(parts[0])!,
          className: parts[1],
          classId,
          subclassId,
          description: parts[3],
          vendorId,
          deviceId,
          other: parts[5],
          data: {},
        };
      }
    } else if (entry) {
      if (line[1] !== '\t') {
        // New data item.
        const split = line.trim().split(': ');
        lastDataItem = split.shift()!;
        entry.data[lastDataItem] = split.join(': ');
      } else if (lastDataItem && entry.data[lastDataItem]) {
        // Continuation of previous data item.
        entry.data[lastDataItem] += ` ${line.trim()}`;
      }
    }
  }

  return entries;
}

const UNIT_MULTIPLIER: Record<string, number> = {
  T: 1024 * 1024 * 1024 * 1024,
  G: 1024 * 1024 * 1024,
  M: 1024 * 1024,
  K: 1024,
};

function parseMemory(str: string) {
  const clean = str.split('=')[1]?.split(']')[0];
  if (!clean) {
    return 0;
  }

  const unit = clean[clean.length - 1];
  const number = parseNumber(clean.slice(0, -1));
  if (!number) {
    return 0;
  }

  const output = number * (UNIT_MULTIPLIER[unit] || 0);
  return Math.floor(output);
}

function parseLines(output: string): GPUInfo[] {
  const entries = parseLspci(output).filter(item => item.classId === 0x03);
  const gpus: GPUInfo[] = [];

  for (const entry of entries) {
    const memorySizes = Object.entries(entry.data).map(([key, value]) =>
      key.startsWith('Region') && value.startsWith('Memory')
        ? parseMemory(value)
        : 0,
    );

    const vendor = getVendor(entry.description);
    let name = entry.description;
    const startIdx = name.lastIndexOf('[');
    const endIdx = name.lastIndexOf(']');

    if (startIdx !== -1 && endIdx > startIdx) {
      name = `${vendor} ${name.substring(startIdx + 1, endIdx)}`;
    }

    gpus.push({
      source: PROVIDER_ID,
      busAddress: entry.busAddress,
      vendor,
      name,
      vram: Math.max(...memorySizes),
    });
  }

  return gpus;
}

const provider: GPUInfoProvider = {
  async isAvailable() {
    return os.platform() === 'linux';
  },
  async devices() {
    const output = await stdout('lspci', ['-vvvnn']);
    return parseLines(output);
  },
};

export default provider;
