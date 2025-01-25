export function forceRepaint() {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  window.getComputedStyle(document.body).backgroundColor;
}

const DISABLE_TRANSITIONS_ATTRIBUTE = 'data-disable-transitions';
export function withoutTransitions(action: () => void) {
  document.documentElement.setAttribute(DISABLE_TRANSITIONS_ATTRIBUTE, '1');
  action();
  forceRepaint();
  document.documentElement.setAttribute(DISABLE_TRANSITIONS_ATTRIBUTE, '0');
}
