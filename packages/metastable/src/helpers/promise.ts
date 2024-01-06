import { EventEmitter } from 'events';

export class WrappedPromise<T> extends EventEmitter {
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
