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

const AUTHORIZATION_STRATEGIES: {
  id: string;
  match: (hostname: string) => boolean;
  strategy: 'bearer';
}[] = [
  {
    id: 'huggingface',
    match: (hostname: string) => hostname.includes('huggingface.co'),
    strategy: 'bearer',
  },
  {
    id: 'civitai',
    match: (hostname: string) => hostname.includes('civitai.com'),
    strategy: 'bearer',
  },
];

export function getAuthorizationStrategy(hostname: string) {
  for (const strategy of AUTHORIZATION_STRATEGIES) {
    if (strategy.match(hostname)) {
      return strategy;
    }
  }
}
