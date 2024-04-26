export interface FileInfo {
  name: string;
  size: number;
  parts: string[];
}

export interface ImageInfo {
  url: string;
  thumbnailUrl: string;
}

export interface ImageFile {
  name: string;
  path: string;
  image: ImageInfo;
  metadata?: any;
}
