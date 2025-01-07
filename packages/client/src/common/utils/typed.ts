export const isObject = (value: any): value is object => {
  return !!value && value.constructor === Object;
};

export const toInt = <T extends number | null = number>(
  value: any,
  defaultValue?: T,
): number | T => {
  const def = defaultValue === undefined ? 0 : defaultValue;
  if (value === null || value === undefined) {
    return def;
  }
  const result = parseInt(value);
  return isNaN(result) ? def : result;
};

/**
 * Checks if the given value is primitive.
 *
 * Primitive Types: number , string , boolean , symbol, bigint, undefined, null
 *
 * @param {*} value value to check
 * @returns {boolean} result
 */
export const isPrimitive = (value: any): boolean => {
  return (
    value === undefined ||
    value === null ||
    (typeof value !== 'object' && typeof value !== 'function')
  );
};
