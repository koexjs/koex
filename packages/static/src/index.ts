import { basename, join } from 'path';
import { Context } from 'koa';
import { fs, zlib } from 'mz';

import { Options, File } from './typings';
import { FileManager, loadFile, safeDecodeURIComponent } from './utils';

const compressible = require('compressible');
const debug = require('debug')('koa-static');

export default (prefix: string, options: Options) => {
  const { dir, gzip = true, md5 = true } = options || {} as Options;

  const files = new FileManager<File>();

  const gzipOn = !!gzip;
  const md5On = !!md5;

  return async function staticCache(ctx: Context, next: () => Promise<void>) {
    // only accept HEAD and GET
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return await next();

    // check prefix first to avoid calculate
    if (ctx.path.indexOf(prefix) !== 0) return await next();

    const path = safeDecodeURIComponent(ctx.path);
    let file = files.get(path);

    // load file
    if (!file) {
      const fileName = path.slice(prefix.length);
      const filePath = join(dir, fileName);

      // basename cannot start with .
      if (basename(path)[0] === '.') return await next();

      // files that can be accessd should be under options.dir
      if (filePath.indexOf(dir) !== 0) {
        return await next()
      }

      let s: fs.Stats;
      try {
        s = await fs.stat(filePath);
      } catch (error) {
        return await next();
      }

      if (!s.isFile()) return await next();

      file = loadFile(filePath, options);

      files.set(path, file);
    }

    debug('request: ', ctx.method, ctx.path, ' file: ', file.path, file.md5);

    if (ctx.request.header.etag === file.md5) {
      return ctx.status = 304;
    }

    ctx.status = 200;

    // when gzip on
    if (gzipOn) ctx.vary('Accept-Encoding');

    // lastModified
    ctx.set('Last-Modified', `${file.mtime}`);

    // etag
    if (md5On) ctx.set('etag', file.md5);

    if (ctx.fresh) {
      return ctx.status = 304;
    }

    ctx.type = file.type;
    ctx.length = file.length;
    ctx.set('Cache-Control', file.cacheControl);

    if (ctx.method === 'HEAD') {
      return ;
    }

    const acceptGzip = ctx.acceptsEncodings('gzip') === 'gzip';

    const shouldGzip = gzipOn
      && file.length > 1024
      && acceptGzip
      && compressible(file.type)

    const stream = fs.createReadStream(file.path);

    /* @TODO when to update md5
    // update file hash
    if (!file.md5) {
      var hash = crypto.createHash('md5')
      stream.on('data', hash.update.bind(hash))
      stream.on('end', function () {
        file.md5 = hash.digest('base64')
      })
    }*/

    ctx.body = stream;
    // enable gzip will remove content length
    if (shouldGzip) {
      ctx.remove('content-length');
      ctx.set('content-encoding', 'gzip');
      ctx.body = stream.pipe(zlib.createGzip());
    }
  };
};
