export function replaceText(
  el: HTMLInputElement | HTMLTextAreaElement,
  start: number,
  end: number,
  newText: string,
) {
  el.setSelectionRange(start, end);
  document.execCommand('insertText', false, newText);
  el.setSelectionRange(start, start + newText.length);
}

export function deleteText(
  el: HTMLInputElement | HTMLTextAreaElement,
  start: number,
  end: number,
) {
  el.setSelectionRange(start, end);
  document.execCommand('delete');
}

export function getCurrentLineIndex(el?: HTMLTextAreaElement | null) {
  if (!el || el.selectionStart !== el.selectionEnd) {
    return undefined;
  }

  return el.value.substring(0, el.selectionStart).split('\n').length - 1;
}

export function getLineStart(el: HTMLTextAreaElement, index: number) {
  const lines = el.value.split('\n');

  return Array(index)
    .fill(0)
    .map((_, i) => lines[i].length + 1)
    .reduce((a, b) => a + b, 0);
}
