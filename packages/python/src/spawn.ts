import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class PromiseWrapper<T> extends EventEmitter {
  private _promise: Promise<T>;
  private _resolve?: (value: T) => void;
  private _reject?: (error: any) => void;

  constructor() {
    super();
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  private done() {
    this._resolve = undefined;
    this._reject = undefined;
    this.emit('finish');
  }

  resolve(value: T) {
    if (this._resolve) {
      this._resolve(value);
      this.done();
    }
  }

  reject(error: any) {
    if (this._reject) {
      this._reject(error);
      this.done();
    }
  }

  get promise() {
    return this._promise;
  }

  get finished() {
    return !this._resolve;
  }
}

export function stdout(
  command: string,
  args?: string[],
  env?: Record<string, string>,
) {
  const proc = spawn(command, args, {
    env,
  });

  const wrapped = new PromiseWrapper<string>();
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
