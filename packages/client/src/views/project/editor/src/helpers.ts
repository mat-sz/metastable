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

export function isVisible(el: HTMLElement) {
  const style = getComputedStyle(el);
  if (style.display === 'none') return false;
  if (style.visibility !== 'visible') return false;
  if (parseFloat(style.opacity) < 0.1) return false;

  const rect = el.getBoundingClientRect();
  if (el.offsetWidth + el.offsetHeight + rect.height + rect.width === 0) {
    return false;
  }

  const center = {
    x: rect.left + el.offsetWidth / 2,
    y: rect.top + el.offsetHeight / 2,
  };

  if (
    center.x < 0 ||
    center.x > (document.documentElement.clientWidth || window.innerWidth) ||
    center.y < 0 ||
    center.y > (document.documentElement.clientHeight || window.innerHeight)
  ) {
    return false;
  }

  let pointContainer: ParentNode | null | undefined = document.elementFromPoint(
    center.x,
    center.y,
  );
  do {
    if (pointContainer === el) return true;
  } while ((pointContainer = pointContainer?.parentNode));

  return false;
}
