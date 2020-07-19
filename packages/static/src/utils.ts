import * as crypto from 'crypto';
import LRU from '@zcorky/lru';

import { fs } from 'mz';
import * as mime from 'mime-types';
import * as sendToWormhole from 'stream-wormhole';

import { Options } from './typings';

const debug = require('debug')('@koex/static');

export class FileManager<Content> {
  private cache = new LRU<string, Content>(2500);

  public get(key: string) {
    return this.cache.get(key);
  }

  public set(key: string, value: Content) {
    return this.cache.set(key, value);
  }
}

export async function isFile(path: string) {
  try {
    const s = await fs.stat(path);
    return s.isFile();
  } catch (error) {
    return false;
  }
}

export async function isFileWithSuffix(path: string, options: Options) {
  const pathIsFile = await isFile(path);
  if (pathIsFile) {
    return {
      isFile: true,
      realpath: path,
    };
  }

  // no suffix
  if (!options.suffix) {
    return {
      isFile: false,
      realpath: path,
    };
  }

  const suffixs = options.suffix.split(',');
  for (const suffix of suffixs) {
    const realpath = suffix.startsWith('.') ? `${path}${suffix}` : `${path}.${suffix}`;
    const _isFile = await isFile(realpath);
    debug('try suffix: ', realpath, ' isFile: ', _isFile);

    if (_isFile) {
      return {
        isFile: _isFile,
        realpath,
      };
    }
  }

  return {
    isFile: false,
    realpath: path,
  }; 
}

export async function loadFile(path: string, options: Options) {
  const stats = await fs.stat(path);
  const stream = fs.createReadStream(path);
  const maxAge = options.maxAge || 0;

  return {
    path,
    cacheControl: options.cacheControl || `public, max-age=${maxAge}`,
    maxAge,
    type: mime.lookup(path) || 'application/octet-stream',
    mtime: stats.mtime,
    length: stats.size,
    md5: await md5(stream),
  };
}

export function md5(stream: fs.ReadStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');

    stream.on('error', reject);
    stream.on('data', hash.update.bind(hash));
    stream.on('end', function () {
      const _md5 = hash.digest('base64');

      sendToWormhole(stream, true)
        .then(() => resolve(_md5))
        .catch(reject);
    });
  });
}

export function safeDecodeURIComponent(text: string) {
  try {
    return decodeURIComponent(text)
  } catch (e) {
    return text
  }
}
