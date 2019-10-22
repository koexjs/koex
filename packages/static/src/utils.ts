import * as crypto from 'crypto';
import LRU from '@zcorky/lru';

import { fs } from 'mz';
import * as mime from 'mime-types';

import { Options } from './typings';

export class FileManager<Content> {
  private cache = new LRU<string, Content>(2500);

  public get(key: string) {
    return this.cache.get(key);
  }

  public set(key: string, value: Content) {
    return this.cache.set(key, value);
  }
}

export function loadFile(path: string, options: Options) {
  const stats = fs.statSync(path);
  const buffer = fs.readFileSync(path);
  const maxAge = options.maxAge || 0;

  return {
    path,
    cacheControl: options.cacheControl || `public, max-age=${maxAge}`,
    maxAge,
    type: mime.lookup(path) || 'application/octet-stream',
    mtime: stats.mtime,
    length: stats.size,
    md5: md5(buffer),
  };
}

export function md5(buffer: Buffer) {
  return crypto.createHash('md5').update(buffer).digest('base64');
}

export function safeDecodeURIComponent(text: string) {
  try {
    return decodeURIComponent(text)
  } catch (e) {
    return text
  }
}
