export function select(object: any, fields: Record<string, boolean>): any {
  const temp: any = {};
  for (const key of Object.keys(fields)) {
    if (fields[key] && typeof object[key] !== 'undefined') {
      temp[key] = object[key];
    }
  }
  return temp;
}
