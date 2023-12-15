export class CircularBuffer<T> {
  private array: T[] = [];

  constructor(private maxLength: number) {}

  get length() {
    return this.array.length;
  }

  push(item: T) {
    if (this.array.length === this.maxLength) {
      this.array.shift();
    }

    this.array.push(item);
  }

  get items() {
    return [...this.array];
  }
}
