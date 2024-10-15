import { spawn } from 'child_process';
import os from 'os';

export const WINDIR = process.env.WINDIR || 'C:\\Windows';

const _psToUTF8 =
  '$OutputEncoding = [System.Console]::OutputEncoding = [System.Console]::InputEncoding = [System.Text.Encoding]::UTF8 ; ';

export function toInt(value: string) {
  let result = parseInt(value, 10);
  if (isNaN(result)) {
    result = 0;
  }
  return result;
}

export function getValue(
  lines: string[],
  property: string,
  separator = ':',
  trimmed = false,
  lineMatch = false,
) {
  property = property.toLowerCase();
  let result = '';
  lines.some(line => {
    let lineLower = line.toLowerCase().replace(/\t/g, '');
    if (trimmed) {
      lineLower = lineLower.trim();
    }
    if (
      lineLower.startsWith(property) &&
      (lineMatch
        ? lineLower.match(property + separator) ||
          lineLower.match(property + ' ' + separator)
        : true)
    ) {
      const parts = trimmed
        ? line.trim().split(separator)
        : line.split(separator);
      if (parts.length >= 2) {
        parts.shift();
        result = parts.join(separator).trim();
        return true;
      }
    }
  });
  return result;
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
