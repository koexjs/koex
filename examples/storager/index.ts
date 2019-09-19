import * as fs from 'fs';
import * as path from 'path';

import App from '@koex/core';
import body from '@koex/body';
import { File } from 'formidable';
import { format } from '@zodash/format';

import { md5 } from '@zodash/crypto/lib/md5';
import { map } from '@zodash/map';
import { lru as LRU } from '@zcorky/lru';

import * as OSS from 'ali-oss';

require('dotenv').config();

declare module '@koex/core' {
  export interface Logger {
    debug(...args: any): void;
  }

  export interface Context {
    json(data: object | any[]): Promise<void>;
    resource(filepath: string, contentType: string): Promise<void>;
    render<T>(viewpath: string, context?: T): Promise<void>;
    logger: Logger;
  }
}

const app = new App();

const env = {
  value: process.env.NODE_ENV,
  prod: process.env.NODE_ENV === 'production',
}

const client = new OSS({
  endpoint: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET,
});

const memCache = new LRU(1024);

const time = {
  _start: 0,
  start() {
    this._start = +new Date();
  },
  end() {
    return +new Date() - this._start;
  },
};
const stat = (filepath: string): Promise<fs.Stats> => new Promise((resolve, reject) => {
  fs.stat(filepath, (err, stats) => {
    if (err) return reject(err);
    return resolve(stats);
  });
});

app.use(async function error(ctx, next) {
  try {
    await next();
  } catch (err) {
    console.log(err);
    ctx.json({
      errcode: err.code || err.status || 500,
      errmessage: !env.prod ? err.message : 'Internal Server Error',
    });
  }
});

app.use(async function json(ctx, next) {
  ctx.json = async (data: any) => {
    ctx.body = data;
  }

  await next();
});

app.use(async function render(ctx, next) {
  ctx.render = async <T>(viewpath: string, context?: T) => {
    return new Promise<T>((resolve, reject) => {
      const absoluteFilePath = path.join(process.cwd(), viewpath);
      fs.readFile(absoluteFilePath, (err, text) => {
        if (err) {
          reject(err);
        }
        ctx.body = format(text.toString(), context, { start: '{{', end: '}}' });
        resolve();
      });
    });
  }

  await next();
});

app.use(async function resource(ctx, next) {
  ctx.resource = async (filepath: string, contentType: string) => {
    const absoluteFilePath = path.join(process.cwd(), filepath);

    // secure
    ctx.set('X-Content-Type-Options', 'nosniff');

    // fs.stat
    const stats = await stat(absoluteFilePath);
    ctx.set('Last-Modified', `${stats.mtime}`);
    ctx.set('Content-Length', `${stats.size}`);

    // only download
    // ctx.set('Content-Disposition', `attachment; filename=${filename}`);

    // basic
    ctx.set('Content-Type', contentType);
    ctx.body = fs.createReadStream(absoluteFilePath);
  }

  await next();
});

app.use(async function logger(ctx, next) {
  ctx.logger = {
    debug(...args: any) {
      console.log(...args);
    },
  }

  await next();
});

app.use(body({
  enableTypes: ['json', 'form', 'multipart'],
  formidable: {
    // maxFileSize: 100 * 1024 * 1024, // 100M
    maxFileSize: +process.env.MAX_FILE_SIZE || 100 * 1024 * 1024, // 500M,
    // hash: true,
  },
}));

app.use(async (ctx, next) => {
  time.start();
  ctx.logger.debug(`=> [${new Date().toUTCString()}] ${ctx.method} ${ctx.originalUrl}`);
  await next();
  ctx.logger.debug(`<= [${new Date().toUTCString()}] ${ctx.method} ${ctx.originalUrl} ${ctx.status} ${time.end()}ms`);
});

app.get('/health', async (ctx) => {
  ctx.status = 200;
});

app.get('/', async (ctx) => {
  ctx.body = 'hello, world';
});

app.get('/upload', async (ctx) => {
  await ctx.render('./view/upload.html', {
    title: 'Upload',
  });
});

app.post('/upload', async (ctx) => {
  const uploadData = {
    method: ctx.method,
    url: ctx.url,
    query: ctx.query,
    params: ctx.params,
    body: ctx.request.body,
    files: ctx.request.files,
    headers: ctx.headers,
    origin: ctx.origin,
  };

  const requestFiles = ctx.request.files;

  let files: File[] = [];
  Object.keys(requestFiles).forEach(key => {
    const _file = requestFiles[key];
    if (Array.isArray(_file)) {
      files = [...files, ..._file];
    } else {
      files.push(_file);
    }
  });

  const md5Files = map(files, file => ({ ...file, md5: md5(encodeURIComponent(JSON.stringify(file))) }));

  const needUploadFiles = md5Files.filter(file => !memCache.hasKey(file.md5));

  const cachedRes = md5Files.filter(file => memCache.hasKey(file.md5)).map(file => memCache.get(file.md5));

  const newRes = await Promise.all(needUploadFiles.map(file => {
    return new Promise<OSS.PutObjectResult & { md5: string }>((resolve, reject) => {
      client
        .put(`${process.env.OSS_PREFIX}/${file.name}`, file.path)
        .then(res => {
          resolve({
            ...res,
            md5: file.md5,
          });
        })
        .catch(reject);
    });
  }));

  newRes.forEach(file => memCache.set(file.md5, file));

  const res = md5Files.map(file => memCache.get(file.md5));

  // await ctx.json({
  //   uploadData,
  //   downloadData: {
  //     files,
  //     // newRes,
  //   },
  // });

  if (files.length > 1) {
    return await ctx.json({
      files: res,
    });
  }

  return await ctx.json({
    file: res[0],
  });
});

app.get('/file/:filename', async (ctx) => {
  const filename = decodeURIComponent(ctx.params.filename);
  
  try {
    const { res, stream } = await client.getStream(`${process.env.OSS_PREFIX}/${filename}`);
    const { status } = res;
  
    if (status !== 200) {
      return ctx.throw(status);
    }
  
    const headers = res.headers as any as {
      server: string;
      date: string;
      'content-type': string;
      'content-length': string;
      'x-oss-request-id': string;
      'accept-ranges': 'bytes',
      etag: string;
      'last-modified': string;
      'x-oss-object-type': string;
      'x-oss-hash-crc64ecma': string;
      'x-oss-storage-class': string;
      'x-oss-expiration': string;
      'x-oss-server-time': string;
      'content-md5': string;
    };
  
    ctx.set('Date', headers.date);
    ctx.set('Content-Type', headers['content-type']);
    ctx.set('ETag', headers.etag);
    ctx.set('Last-Modified', headers['last-modified']);
    ctx.set('Content-Length', headers['content-length']);
    ctx.set('X-Oss-Request-Id', headers['x-oss-request-id']);
    ctx.set('Content-Md5', headers['content-md5']);
    ctx.set('Cache-Control', 'public, max-age=31536000');
  
    ctx.body = stream;
  } catch (err) {
    if (err.code === 'NoSuchKey') {
      err.code = 404;
      err.message = 'Resource Not Found';
    }
    
    throw err;
  }
});


const port = +process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
  console.log(`server start at http://127.0.0.1:${port}.`);
});
