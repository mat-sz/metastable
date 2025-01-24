import { semverCompare } from './semver.js';

describe('semverCompare', () => {
  it('should correctly compare semvers', () => {
    expect(semverCompare('15.0.1', '10.1')).toEqual(1);
    expect(semverCompare('10.0.0', '10.0.0')).toEqual(0);
    expect(semverCompare('9.0.0', '10.0')).toEqual(-1);
  });
});
