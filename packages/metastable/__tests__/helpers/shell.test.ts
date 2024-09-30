import { parseArgString } from '../../src/helpers/shell.js';

describe('shell', () => {
  it('should parse arg strings correctly', () => {
    expect(parseArgString('--arg1 --arg2 --arg3 -A')).toEqual([
      '--arg1',
      '--arg2',
      '--arg3',
      '-A',
    ]);
    expect(parseArgString('  --arg1    --arg2   ')).toEqual([
      '--arg1',
      '--arg2',
    ]);
    expect(parseArgString("-'-'arg1 --arg2='test'")).toEqual([
      '--arg1',
      '--arg2=test',
    ]);
    expect(parseArgString('-"-"arg1 --arg2="test"')).toEqual([
      '--arg1',
      '--arg2=test',
    ]);
    expect(parseArgString("--arg1='te\"st'")).toEqual(['--arg1=te"st']);
    expect(parseArgString('--arg1="te\'st"')).toEqual(["--arg1=te'st"]);
  });
});
