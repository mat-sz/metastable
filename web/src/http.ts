import { getUrl } from './config';

export async function httpGet(path: string): Promise<any> {
  const res = await fetch(getUrl(path));
  return await res.json();
}

export async function httpPost(path: string, data: any): Promise<any> {
  const res = await fetch(getUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return await res.json();
}

export async function httpDelete(path: string): Promise<any> {
  const res = await fetch(getUrl(path), { method: 'DELETE' });
  return await res.json();
}
