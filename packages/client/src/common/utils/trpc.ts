interface Unsubscribable {
  unsubscribe(): void;
}

export function combineUnsubscribables(callback: () => Unsubscribable[]) {
  return () => {
    const unsubscribables = callback();

    return () => {
      for (const unsubscribable of unsubscribables) {
        unsubscribable.unsubscribe();
      }
    };
  };
}
