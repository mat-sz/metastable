import { spawn } from 'child_process';
import os from 'os';

const _psToUTF8 =
  '$OutputEncoding = [System.Console]::OutputEncoding = [System.Console]::InputEncoding = [System.Text.Encoding]::UTF8 ; ';

export function parseFl(str: string) {
  const lines = str.trim().split('\n');
  const obj: Record<string, string> = {};
  for (const line of lines) {
    const split = line.split(':');
    const key = split.shift()!.trim();
    const value = split.join(':').trim();
    obj[key] = value;
  }
  return obj;
}

export function powerShell(cmd: string): Promise<string> {
  let result = '';

  return new Promise(resolve => {
    try {
      const child = spawn(
        'powershell.exe',
        [
          '-NoProfile',
          '-NoLogo',
          '-InputFormat',
          'Text',
          '-NoExit',
          '-ExecutionPolicy',
          'Unrestricted',
          '-Command',
          '-',
        ],
        {
          stdio: 'pipe',
          windowsHide: true,
          env: { ...process.env, LANG: 'en_US.UTF-8' },
        },
      );

      if (child && !child.pid) {
        child.on('error', () => {
          resolve(result);
        });
      }
      if (child && child.pid) {
        child.stderr.setEncoding('utf-8');
        child.stdout.setEncoding('utf-8');

        child.stdout.on('data', data => {
          result = result + data.toString('utf8');
        });
        child.stderr.on('data', () => {
          child.kill();
          resolve(result);
        });
        child.on('close', () => {
          child.kill();
          resolve(result);
        });
        child.on('error', () => {
          child.kill();
          resolve(result);
        });
        try {
          child.stdin.write(_psToUTF8 + cmd + os.EOL);
          child.stdin.write('exit' + os.EOL);
          child.stdin.end();
        } catch {
          child.kill();
          resolve(result);
        }
      } else {
        resolve(result);
      }
    } catch {
      resolve(result);
    }
  });
}
