import os from 'os';
import path from 'path';

import { Metastable } from '../src/index.js';

const metastable = new Metastable(path.join(os.tmpdir(), 'metastable_test'), {
  skipPythonSetup: true,
  comfyArgs: ['--cpu'],
});

beforeAll(() => {
  return new Promise(resolve => {
    metastable.on('event', event => {
      if (event.event === 'backend.status' && event.data === 'ready') {
        resolve();
      }
    });
    metastable.init();
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
