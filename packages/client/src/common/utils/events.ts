export class BasicEventEmitter<
  TEvents extends { [key: string]: (...args: any[]) => void },
> {
  private _handlers: { [key in keyof TEvents]?: Set<TEvents[key]> } = {};

  on<TKey extends keyof TEvents>(eventName: TKey, listener: TEvents[TKey]) {
    if (!this._handlers[eventName]) {
      this._handlers[eventName] = new Set();
    }

    this._handlers[eventName]?.add(listener);
  }

  off<TKey extends keyof TEvents>(eventName: TKey, listener: TEvents[TKey]) {
    this._handlers[eventName]?.delete(listener);
  }

  emit<TKey extends keyof TEvents>(
    eventName: TKey,
    ...args: Parameters<TEvents[TKey]>
  ) {
    const callbacks = [...(this._handlers[eventName]?.values() || [])];
    for (const callback of callbacks) {
      callback.apply(this, args);
    }
  }
}
