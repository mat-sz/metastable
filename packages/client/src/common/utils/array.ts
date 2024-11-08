export function arrayMove<T>(array: T[], from: number, to?: number): T[] {
  to ??= array.length - 1;
  const newArray = [...array];
  newArray.splice(to, 0, ...newArray.splice(from, 1));
  return newArray;
}

export function arrayStartsWith<T>(array: T[], search: T[]): boolean {
  if (array.length < search.length) {
    return false;
  }

  for (let i = 0; i < search.length; i++) {
    if (array[i] !== search[i]) {
      return false;
    }
  }

  return true;
}
