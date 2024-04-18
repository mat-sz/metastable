export interface PipDependency {
  name: string;
  extra?: string;
  version?: string;
}

export interface GithubReleaseAsset {
  id: number;
  name: string;
  browser_download_url: string;
}

export interface GithubRelease {
  url: string;
  name: string;
  assets: GithubReleaseAsset[];
  prerelease?: boolean;
  draft?: boolean;
}
