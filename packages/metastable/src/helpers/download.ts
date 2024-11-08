import fs from 'fs/promises';

export const USER_AGENT = 'Metastable/0.0.0';

export function getDownloadHeaders(): Record<string, string> {
  return {
    'User-Agent': USER_AGENT,
  };
}

export async function download(url: string, filePath: string) {
  const res = await fetch(url, {
    headers: getDownloadHeaders(),
  });

  const data = await res.arrayBuffer();
  await fs.writeFile(filePath, new Uint8Array(data));
}
