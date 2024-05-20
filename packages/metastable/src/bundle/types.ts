export interface BundleInfo {
  name: string;
  label: string;
  version: string;
  dependencies?: Record<string, string>;
}

export interface BundleInfoAPI extends BundleInfo {
  downloads?: string[] | Record<string, string[]>;
}

export interface BundleInfoInstalled extends BundleInfo {
  exports?: Record<string, string>;
}
