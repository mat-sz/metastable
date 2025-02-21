import { spawn, SpawnOptionsWithoutStdio } from 'child_process';

import { WrappedPromise } from '../helpers/promise.js';

interface StdoutOptions extends SpawnOptionsWithoutStdio {
  onLog?: (data: string) => void;
  timeout?: number;
}

export function stdout(
  command: string,
  args?: string[],
  options?: StdoutOptions,
) {
  const proc = spawn(command, args, {
    timeout: 5000,
    ...options,
  });
  proc.stdout.setEncoding('utf8');
  proc.stderr.setEncoding('utf8');

  const wrapped = new WrappedPromise<string>();
  wrapped.on('finish', () => {
    proc.kill('SIGTERM');
  });

  let output = '';
  let stdout = '';

  proc.stdout.on('data', chunk => {
    output += chunk.toString();
    stdout += chunk.toString();
    options?.onLog?.(chunk.toString());
  });
  proc.stderr.on('data', chunk => {
    output += chunk.toString();
    options?.onLog?.(chunk.toString());
  });

  proc.on('close', (code, signal) => {
    if (code !== 0) {
      wrapped.reject(
        new Error(
          `Process '${command}' exited with non-zero exit code: ${code}, signal: ${signal}\n\n${output}`,
        ),
      );
    } else {
      wrapped.resolve(stdout);
    }
  });
  proc.on('error', err => {
    wrapped.reject(err);
  });

  return wrapped.promise;
}
