import { getUrl } from '@utils/url';

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
  let req: RequestInit = {
    method: 'POST',
  };

  if (typeof data === 'object') {
    if (data instanceof FormData) {
      req.body = data;
    } else {
      req.headers = {
        'Content-Type': 'application/json',
      };
      req.body = JSON.stringify(data);
    }
  }

  const res = await fetch(getUrl(path), req);
  return await httpJson(res);
}

export async function httpDelete(path: string): Promise<any> {
  const res = await fetch(getUrl(path), { method: 'DELETE' });
  return await httpJson(res);
}
