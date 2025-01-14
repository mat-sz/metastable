import os from 'os';
import path from 'path';

import { Metastable } from '../src/index.js';

const metastable = await Metastable.initialize({
  dataRoot: path.join(os.tmpdir(), 'metastable_test'),
  skipPythonSetup: true,
  comfyArgs: ['--cpu'],
});

beforeAll(() => {
  return new Promise(resolve => {
    metastable.on('backendStatus', status => {
      if (status === 'ready') {
        resolve();
      }
    });
  });
}, 60000);

describe('backend', () => {
  it('should provide instance infomration', async () => {
    const info = await metastable.comfy?.info();
    expect(info).toEqual({
      torch: expect.anything(),
      samplers: expect.arrayContaining(['euler']),
      schedulers: expect.arrayContaining(['normal']),
    });
  });
});
