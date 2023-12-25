import { Point, Size } from '../types';

export class Vector2 {
  constructor(
    public x: number,
    public y: number,
  ) {}

  add(vector: Vector2) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  sub(vector: Vector2) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
  }

  multiplyScalar(scalar: number) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  divideScalar(scalar: number) {
    this.x /= scalar;
    this.y /= scalar;
    return this;
  }

  floor() {
    this.x = Math.floor(this.x);
    this.y = Math.floor(this.y);
    return this;
  }

  midpoint(vector: Vector2) {
    this.x = (this.x + vector.x) / 2;
    this.y = (this.y + vector.y) / 2;
    return this;
  }

  distanceTo(vector: Vector2) {
    return Math.sqrt(
      Math.pow(this.x - vector.x, 2) + Math.pow(this.y - vector.y, 2),
    );
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  get point(): Point {
    return { x: this.x, y: this.y };
  }

  static fromPoint(point: Point) {
    return new Vector2(point.x, point.y);
  }

  static fromSize(size: Size) {
    return new Vector2(size.width, size.height);
  }

  static fromEvent(event: { clientX: number; clientY: number }) {
    return new Vector2(event.clientX, event.clientY);
  }
}
