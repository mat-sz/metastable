const { Publisher } = require('electron-publish');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { readFile } = require('fs/promises');
const { basename } = require('path');

const REQUIRED_ENV = [
  'PUBLISH_S3_ENDPOINT',
  'PUBLISH_S3_ACCESS_ID',
  'PUBLISH_S3_ACCESS_KEY',
  'PUBLISH_S3_BUCKET',
];

class CustomPublisher extends Publisher {
  s3;

  constructor(context, info) {
    super(context);

    for (const name of REQUIRED_ENV) {
      if (!process.env[name]?.trim()) {
        throw new Error(`Publish - Required env variable missing - ${name}`);
      }
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.PUBLISH_S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.PUBLISH_S3_ACCESS_ID,
        secretAccessKey: process.env.PUBLISH_S3_ACCESS_KEY,
      },
    });
  }

  get providerName() {
    return 'S3 custom publisher';
  }

  toString() {
    return this.providerName;
  }

  async upload(task) {
    const fileName =
      (this.useSafeArtifactName ? task.safeArtifactName : null) ||
      basename(task.file);
    const fileContent = task.fileContent || (await readFile(task.file));
    const fileSize = fileContent.byteLength;

    const prefix = process.env.PUBLISH_S3_PREFIX;
    const upload = new Upload({
      params: {
        Bucket: process.env.PUBLISH_S3_BUCKET,
        Key: prefix ? `${prefix}${fileName}` : fileName,
        Body: fileContent,
      },
      client: this.s3,
      queueSize: 3,
    });

    const bar = this.createProgressBar(fileName, fileSize);
    if (bar) {
      upload.on('httpUploadProgress', progress => {
        bar.update((progress.loaded || 0) / (progress.total || 1));
      });
    }

    return await upload.done();
  }
}
module.exports = CustomPublisher;
