import axios from 'axios';
import { parse } from 'node-html-parser';
import semver, { SemVer } from 'semver';
import decompress from 'decompress';
import { fetchZip } from './zip.js';
import { compareEnv, parseDependency } from './parser.js';

const DEFAULT_INDEX = 'https://pypi.org/simple';

interface IndexLink {
  label: string;
  url: string;
}

interface PackageCandidate {
  name: string;
  url: string;
  semver: SemVer;
}

export class Pip {
  private extraIndexPackages: Record<string, string> = {};

  constructor(
    private destination: string,
    private tags: string[],
  ) {}

  private async links(url: string): Promise<IndexLink[]> {
    const { data } = await axios(url, { responseType: 'text' });
    const root = parse(data);
    const elements = root.querySelectorAll('a');
    const links: IndexLink[] = [];

    for (const element of elements) {
      const label = element.innerText.trim();
      const relativePath = element.getAttribute('href');
      if (label && relativePath) {
        const fullUrl = new URL(relativePath, url);
        links.push({ label, url: fullUrl.toString() });
      }
    }

    return links;
  }

  async addIndex(url: string) {
    if (!url.endsWith('/')) {
      url += '/';
    }

    const links = await this.links(url);
    for (const link of links) {
      this.extraIndexPackages[link.label] = link.url;
    }
  }

  async findPackage(name: string, versionSatisfies?: string) {
    const searchUrls: string[] = [];

    if (this.extraIndexPackages[name]) {
      searchUrls.push(this.extraIndexPackages[name]);
    }

    // Not compliant with Python standards but works well enough.
    // It's fine since nothing in Python ever adheres to any good
    // programming practices whatsoever.
    searchUrls.push(`${DEFAULT_INDEX}/${name}/`);

    for (const url of searchUrls) {
      let bestCandidate: PackageCandidate | undefined = undefined;
      const links = await this.links(url);

      for (const link of links) {
        const nameParts = link.label.split('.');
        const ext = nameParts.pop();
        const split = nameParts.join('.').split('-');
        if (split.length < 2 || !ext) {
          continue;
        }

        // Temporary, remove when tar.gz is supported
        if (ext !== 'whl' && ext !== 'zip') {
          continue;
        }

        const version = split[1];
        const tags =
          split.length > 2 ? split.slice(2).join('-').split('.') : undefined;
        const packageSemver = semver.coerce(version);

        if (
          !packageSemver ||
          (tags && !tags.some(tag => this.tags.includes(tag))) ||
          (versionSatisfies &&
            !semver.satisfies(packageSemver, versionSatisfies))
        ) {
          continue;
        }

        if (bestCandidate && semver.gte(bestCandidate.semver, packageSemver)) {
          continue;
        }

        bestCandidate = {
          name: link.label,
          url: link.url,
          semver: packageSemver,
        };
      }

      if (bestCandidate) {
        return bestCandidate;
      }
    }

    return undefined;
  }

  async fetchMetadata(url: string) {
    const zip = await fetchZip(url);

    for (const file of zip.files) {
      if (file.name.endsWith('.dist-info/METADATA')) {
        const metadata = await zip.file(file.name);
        const metadataLines = metadata.replace(/\r\n/g, '').split('\n');
        const firstEmptyIndex = metadataLines.findIndex(item => !item.trim());
        return metadataLines.slice(0, firstEmptyIndex).map(item => {
          const split = item.split(':');
          return [split.shift()!.toLowerCase(), split.join(':').trim()];
        });
      }
    }

    throw new Error(`Unable to fetch metadata: ${url}`);
  }

  async buildDownloadList(names: string[]) {
    const queue = new Set(names);
    const done = new Set<string>();
    const downloadUrls: string[] = [];

    while (queue.size > 0) {
      const name = queue.values().next().value as string;
      done.add(name);
      queue.delete(name);

      const info = await this.findPackage(name);
      if (!info) {
        throw new Error(`Unable to find package: '${name}'`);
      }

      downloadUrls.push(info.url);
      const metadata = await this.fetchMetadata(info.url);
      const requiresDist = metadata.filter(item => item[0] === 'requires-dist');

      for (const req of requiresDist) {
        const dep = parseDependency(req[1]);

        if (dep.env && !compareEnv(dep.env, {})) {
          continue;
        }

        if (!done.has(dep.name)) {
          queue.add(dep.name);
        }
      }
    }

    return downloadUrls;
  }

  async installPackage(archivePath: string) {
    // const files = await decompress(archivePath, this.destination, {strip:})
  }
}
