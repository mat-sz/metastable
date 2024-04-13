import { PythonBundle } from './bundles/python.js';
import { BundleConstructor } from './types.js';

export const bundles: Record<string, BundleConstructor> = {
  python: PythonBundle,
};
