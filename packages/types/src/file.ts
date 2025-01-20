export interface ImageFile {
  mrn: string;
  name: string;
  path: string;
  metadata?: any;
  parts?: string[];
}

export enum DirentType {
  FILE = 'file',
  SYMLINK = 'symlink',
  DIRECTORY = 'directory',
  BLOCK_DEVICE = 'block_device',
  CHARACTER_DEVICE = 'character_device',
  FIFO = 'fifo',
  SOCKET = 'socket',
}
