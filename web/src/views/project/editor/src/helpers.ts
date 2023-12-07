import { Point } from './types';

export function linePoints(
  { x: startX, y: startY }: Point,
  { x: endX, y: endY }: Point,
) {
  const points: Point[] = [];

  let x = Math.floor(startX);
  let y = Math.floor(startY);
  const xx = Math.floor(endX);
  const yy = Math.floor(endY);
  const dx = Math.abs(xx - x);
  const sx = x < xx ? 1 : -1;
  const dy = -Math.abs(yy - y);
  const sy = y < yy ? 1 : -1;
  let err = dx + dy;
  let e2;
  let end = false;
  while (!end) {
    points.push({ x, y });
    if (x === xx && y === yy) {
      end = true;
    } else {
      e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  return points;
}
