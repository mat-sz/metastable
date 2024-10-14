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
