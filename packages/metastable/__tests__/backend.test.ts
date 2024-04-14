import { Metastable } from '../src/index.js';

const metastable = new Metastable('/tmp', {
  skipPythonSetup: true,
  comfyArgs: ['--cpu'],
});

beforeAll(() => {
  return new Promise(resolve => {
    metastable.init().then(() => {
      metastable.comfy?.on('event', event => {
        if (event.event === 'backend.status' && event.data === 'ready') {
          resolve();
        }
      });
    });
  });
});

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
