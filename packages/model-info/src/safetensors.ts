import { createReadStream, ReadStream } from 'fs';

export async function readSafetensors(modelPath: string) {
  const stream = createReadStream(modelPath);
  return await getHeader(stream);
}

const textDecoder = new TextDecoder();
function getHeader(stream: ReadStream): Promise<any> {
  let length: number | undefined = undefined;
  let buffer: Buffer;
  let offset = 0;

  return new Promise(resolve => {
    let done = false;

    stream.on('data', (chunk: Buffer) => {
      if (done) {
        return;
      }

      if (!length) {
        length = Number(chunk.readBigUint64LE(0));
        buffer = Buffer.alloc(length);
        if (chunk.byteLength - 8 >= length) {
          buffer.set(chunk.subarray(8, 8 + length), 0);
          done = true;
        } else {
          buffer.set(chunk.subarray(8), 0);
          offset += chunk.byteLength - 8;
        }
      } else if (offset + chunk.byteLength > length) {
        done = true;
        buffer.set(chunk.subarray(0, length - offset), offset);
      } else {
        buffer.set(chunk, offset);
        offset += chunk.byteLength;
      }

      if (done) {
        stream.close();
        const data = textDecoder.decode(buffer);
        const json = JSON.parse(data);
        const metadata = json['__metadata__'];
        delete json['__metadata__'];

        resolve({
          metadata,
          state_dict: json,
        });
      }
    });
  });
}
