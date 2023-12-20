import { compareEnv, parseDependency } from '../src/parser.js';

describe('parser', () => {
  describe('parseDependency', () => {
    it('should correctly handle conditionals', () => {
      expect(
        parseDependency(
          `aiodns ; (sys_platform == "linux" or sys_platform == "darwin") and extra == 'speedups'`,
        ).env,
      ).toEqual({
        type: 'condition',
        operator: 'and',
        markers: [
          {
            type: 'condition',
            operator: 'or',
            markers: [
              {
                type: 'comparison',
                variable: 'sys_platform',
                operator: '==',
                value: 'linux',
              },
              {
                type: 'comparison',
                variable: 'sys_platform',
                operator: '==',
                value: 'darwin',
              },
            ],
          },
          {
            type: 'comparison',
            variable: 'extra',
            operator: '==',
            value: 'speedups',
          },
        ],
      });
    });
  });

  describe('compareEnv', () => {
    it('should output either true or false depending on the input', () => {
      const testMarker = {
        type: 'condition',
        operator: 'and',
        markers: [
          {
            type: 'condition',
            operator: 'or',
            markers: [
              {
                type: 'comparison',
                variable: 'sys_platform',
                operator: '==',
                value: 'linux',
              },
              {
                type: 'comparison',
                variable: 'sys_platform',
                operator: '==',
                value: 'darwin',
              },
            ],
          },
          {
            type: 'comparison',
            variable: 'extra',
            operator: '==',
            value: 'speedups',
          },
        ],
      } as any;
      expect(
        compareEnv(testMarker, {
          sys_platform: { type: 'string', value: 'linux' },
          extra: { type: 'string', value: 'speedups' },
        }),
      ).toBe(true);
      expect(
        compareEnv(testMarker, {
          sys_platform: { type: 'string', value: 'darwin' },
          extra: { type: 'string', value: 'speedups' },
        }),
      ).toBe(true);
      expect(
        compareEnv(testMarker, {
          sys_platform: { type: 'string', value: 'linux' },
          extra: { type: 'string', value: 'test' },
        }),
      ).toBe(false);
      expect(
        compareEnv(testMarker, {
          sys_platform: { type: 'string', value: 'windows' },
          extra: { type: 'string', value: 'speedups' },
        }),
      ).toBe(false);
    });
  });
});
