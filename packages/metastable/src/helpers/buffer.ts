import { EventEmitter } from 'events';

type CircularBufferEvents<T> = {
  append: [data: T];
};
export class CircularBuffer<T> extends EventEmitter<CircularBufferEvents<T>> {
  private array: T[] = [];

  constructor(private maxLength: number) {
    super();
  }

  get length() {
    return this.array.length;
  }

  push(item: T) {
    if (this.array.length === this.maxLength) {
      this.array.shift();
    }

    this.array.push(item);
    this.emit('append', item);
  }

  get items() {
    return [...this.array];
  }
}
