import { createReadStream, ReadStream } from 'fs';

import { AsyncUnzipInflate, Unzip } from 'fflate';

import { unpickle } from './pickle.js';

export async function readPytorch(modelPath: string) {
  const stream = createReadStream(modelPath);
  const data = await locateData(stream);
  return unpickle(data);
}

function locateData(stream: ReadStream): Promise<Buffer> {
  const unzip = new Unzip();
  unzip.register(AsyncUnzipInflate);
  let done = false;
  let found = false;

  const onDone = () => {
    done = true;
    stream.close();
  };

  return new Promise((resolve, reject) => {
    unzip.onfile = file => {
      if (file.name.endsWith('/data.pkl')) {
        found = true;

        let buffer = Buffer.alloc(0);
        file.ondata = (err, data, final) => {
          if (done) {
            return;
          }

          if (err) {
            reject(err);
            onDone();
            return;
          }

          buffer = Buffer.concat([buffer, data]);
          if (final) {
            resolve(buffer);
            onDone();
            return;
          }
        };

        file.start();
      }
    };

    stream.on('data', chunk => {
      unzip.push(chunk as Buffer);
    });
    stream.on('end', () => {
      if (!done && !found) {
        reject(new Error('data.pkl not found'));
      }
    });
  });
}
