import { statfs } from 'fs/promises';

export async function usage(path: string) {
  const stat = await statfs(path);
  return {
    diskPath: '',
    size: stat.bsize,
    free: stat.bfree,
    used: stat.bsize - stat.bfree,
  };
}
