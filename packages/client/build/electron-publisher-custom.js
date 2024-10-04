const { HttpPublisher } = require('electron-publish');
const { httpExecutor } = require('builder-util/out/nodeHttpExecutor');
const { configureRequestOptions } = require('builder-util-runtime');
const { basename } = require('path');
const mime = require('mime');

class CustomPublisher extends HttpPublisher {
  constructor(context, info) {
    super(context);

    let token = process.env.PUBLISH_TOKEN ?? info.token;
    if (!token?.trim()) {
      throw new Error(
        `Publish API auth token is not set, try setting env variable "PUBLISH_TOKEN"`,
      );
    }

    let url = process.env.PUBLISH_URL ?? info.url;
    if (!url?.trim()) {
      throw new Error(
        `Publish URL is not set, try setting env variable "PUBLISH_URL"`,
      );
    }

    this.token = token;
    this.url = url;
  }

  get providerName() {
    return 'Metastable Admin API';
  }

  toString() {
    return `Metastable Admin API @ ${this.url}`;
  }

  async doUpload(fileName, arch, dataLength, requestProcessor, file, os) {
    const url = new URL(this.url);

    return await httpExecutor.doApiRequest(
      configureRequestOptions({
        hostname: url.hostname,
        protocol: url.protocol,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          Authorization: this.token,
          'X-File-Name': file ? basename(file) : fileName,
          'Content-Type': mime.getType(fileName) || 'application/octet-stream',
          'Content-Length': dataLength,
        },
      }),
      this.context.cancellationToken,
      requestProcessor,
    );
  }
}
module.exports = CustomPublisher;
