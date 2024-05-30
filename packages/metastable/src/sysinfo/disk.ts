import { statfs } from 'fs/promises';

export async function usage(path: string) {
  const stat = await statfs(path);
  return {
    diskPath: '',
    size: stat.blocks * stat.bsize,
    free: stat.bfree * stat.bsize,
    used: (stat.blocks - stat.bfree) * stat.bsize,
  };
}
