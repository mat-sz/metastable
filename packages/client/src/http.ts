import { getUrl } from './config';

async function httpJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

export async function httpGet(path: string): Promise<any> {
  const res = await fetch(getUrl(path));
  return await httpJson(res);
}

export async function httpPost(path: string, data?: any): Promise<any> {
  const res = await fetch(getUrl(path), {
    method: 'POST',
    ...(typeof data === 'undefined'
      ? {}
      : {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }),
  });
  return await httpJson(res);
}

export async function httpDelete(path: string): Promise<any> {
  const res = await fetch(getUrl(path), { method: 'DELETE' });
  return await httpJson(res);
}
