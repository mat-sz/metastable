import { MutableRefObject, RefObject, useEffect } from 'react';

// Closes a modal dialog if the user clicks outside of it or types "Escape"
export function useModalDismissSignal(
  modalRef: MutableRefObject<HTMLDivElement> | RefObject<HTMLDivElement>,
  dismissCallback: () => void,
) {
  useEffect(() => {
    const element = modalRef.current;
    if (element === null) {
      return;
    }

    const handleKeyboardEvent = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();

        dismissCallback();
      }
    };

    let ownerDocument: Document | null = null;

    // Delay until after the current call stack is empty,
    // in case this effect is being run while an event is currently bubbling.
    // In that case, we don't want to listen to the pre-existing event.
    let timeoutID: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      timeoutID = null;

      // It's important to listen to the ownerDocument to support browser extensions.
      // The root document might belong to a different window.
      ownerDocument = element.ownerDocument;
      ownerDocument.addEventListener('keydown', handleKeyboardEvent);
    }, 0);

    return () => {
      if (timeoutID !== null) {
        clearTimeout(timeoutID);
      }

      if (ownerDocument !== null) {
        ownerDocument.removeEventListener('keydown', handleKeyboardEvent);
      }
    };
  }, [modalRef, dismissCallback]);
}
