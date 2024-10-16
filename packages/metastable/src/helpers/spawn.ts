import { spawn, SpawnOptionsWithoutStdio } from 'child_process';

import { WrappedPromise } from '../helpers/promise.js';

export function stdout(
  command: string,
  args?: string[],
  options?: SpawnOptionsWithoutStdio,
) {
  const proc = spawn(command, args, options);
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
  });
  proc.stderr.on('data', chunk => {
    output += chunk.toString();
  });

  proc.on('exit', code => {
    if (code !== 0) {
      wrapped.reject(
        new Error(
          `Process '${command}' exited with non-zero exit code: ${code}\n\n${output}`,
        ),
      );
    } else {
      wrapped.resolve(stdout);
    }
  });
  proc.on('error', err => {
    wrapped.reject(err);
  });

  setTimeout(() => {
    wrapped.reject(new Error(`Process '${command}' timed out`));
  }, 5000);

  return wrapped.promise;
}

export function shell(command: string) {
  return stdout(command, undefined, {
    shell: true,
    windowsHide: true,
    env: {
      ...process.env,
      LANG: 'en_US.UTF-8',
    },
  });
}
