import { Vector2 } from './Vector2';

export class Rectangle {
  constructor(
    public a: Vector2,
    public b: Vector2,
  ) {}

  get x() {
    return Math.min(this.a.x, this.b.x);
  }

  get y() {
    return Math.min(this.a.y, this.b.y);
  }

  get width() {
    return Math.abs(this.a.x - this.b.x);
  }

  get height() {
    return Math.abs(this.a.y - this.b.y);
  }

  get diagonal() {
    return this.a.distanceTo(this.b);
  }
}
