import { createReadStream, PathLike } from 'fs';

export async function readPartial(
  path: PathLike,
  start: number,
  end: number,
): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of createReadStream(path, { start, end })) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
