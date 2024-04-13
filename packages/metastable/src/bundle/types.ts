export interface Bundle {
  name: string;
  label: string;
  version: string;
  dependencies?: Record<string, string>;
}

export interface BundleConstructor {
  new (): Bundle;
}
