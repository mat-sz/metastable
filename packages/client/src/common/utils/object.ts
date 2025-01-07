import { isObject, isPrimitive, toInt } from './typed';

/**
 * Merges two objects together recursivly into a new
 * object applying values from right to left.
 * Recursion only applies to child object properties.
 */
export const assign = <X extends Record<string | symbol | number, any>>(
  initial: X,
  override: X,
): X => {
  if (!initial || !override) return initial ?? override ?? {};

  return Object.entries({ ...initial, ...override }).reduce(
    (acc, [key, value]) => {
      return {
        ...acc,
        [key]: (() => {
          if (isObject(initial[key])) return assign(initial[key], value);
          // if (isArray(value)) return value.map(x => assign)
          return value;
        })(),
      };
    },
    {} as X,
  );
};

/**
 * Creates a shallow copy of the given obejct/value.
 * @param {*} obj value to clone
 * @returns {*} shallow clone of the given value
 */
export const clone = <T>(obj: T): T => {
  // Primitive values do not need cloning.
  if (isPrimitive(obj)) {
    return obj;
  }

  // Binding a function to an empty object creates a
  // copy function.
  if (typeof obj === 'function') {
    return obj.bind({});
  }

  // Access the constructor and create a new object.
  // This method can create an array as well.
  const newObj = new ((obj as object).constructor as { new (): T })();

  // Assign the props.
  Object.getOwnPropertyNames(obj).forEach(prop => {
    // Bypass type checking since the primitive cases
    // are already checked in the beginning
    (newObj as any)[prop] = (obj as any)[prop];
  });

  return newObj;
};

/**
 * Dynamically get a nested value from an array or
 * object with a string.
 *
 * @example get(person, 'friends[0].name')
 */
export const get = <TDefault = unknown>(
  value: any,
  path: string,
  defaultValue?: TDefault,
): TDefault => {
  const segments = path.split(/[.[\]]/g);
  let current: any = value;
  for (const key of segments) {
    if (current === null) return defaultValue as TDefault;
    if (current === undefined) return defaultValue as TDefault;
    const dequoted = key.replace(/['"]/g, '');
    if (dequoted.trim() === '') continue;
    current = current[dequoted];
  }
  if (current === undefined) return defaultValue as TDefault;
  return current;
};

export const set = <T extends object, K>(
  initial: T,
  path: string,
  value: K,
): T => {
  if (!initial) return {} as T;
  if (!path) return initial;
  const segments = path.split(/[.[\]]/g).filter(x => !!x.trim());
  const _set = (node: any) => {
    if (segments.length > 1) {
      const key = segments.shift() as string;
      const nextIsNum = toInt(segments[0], null) === null ? false : true;
      node[key] = node[key] === undefined ? (nextIsNum ? [] : {}) : node[key];
      _set(node[key]);
    } else {
      node[segments[0]] = value;
    }
  };
  // NOTE: One day, when structuredClone has more
  // compatability use it to clone the value
  // https://developer.mozilla.org/en-US/docs/Web/API/structuredClone
  const cloned = clone(initial);
  _set(cloned);
  return cloned;
};
