export function tryParse(json: string | null | undefined): any {
  if (!json) {
    return undefined;
  }

  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}
