import crypto from 'crypto';

interface ScryptOptions {
  keyLength: number;
  logN?: number;
  r?: number;
  p?: number;
  salt?: crypto.BinaryLike;
}

interface NodeScryptOptions extends crypto.ScryptOptions {
  keyLength: number;
}

export interface ScryptResult {
  options: ScryptOptions;
  salt: string;
  hash: string;
}

export function scrypt(
  data: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  options: NodeScryptOptions,
) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(data, salt, options.keyLength, options, (err, result) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(result);
    });
  });
}

export async function hash(
  data: crypto.BinaryLike,
  options?: Partial<ScryptOptions>,
): Promise<ScryptResult> {
  const salt = options?.salt ?? crypto.randomBytes(16);
  const { keyLength, logN, r, p } = {
    keyLength: 64,
    logN: 17,
    r: 8,
    p: 1,
    ...options,
  };

  const hash = await scrypt(data, salt, {
    keyLength,
    N: Math.pow(2, logN),
    r,
    p,
  });

  return {
    options: { keyLength, logN, r, p },
    hash: hash.toString('base64'),
    salt: salt.toString('base64'),
  };
}

export async function verify(data: crypto.BinaryLike, result: ScryptResult) {
  const newResult = await hash(data, {
    ...result.options,
    salt: Buffer.from(result.salt, 'base64'),
  });
  return newResult.hash === result.hash;
}
