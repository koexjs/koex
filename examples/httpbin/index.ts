import * as fs from 'fs';
import * as path from 'path';

import App from '@koex/core';
import body from '@koex/body';
import { uuid } from '@zodash/uuid';
import { delay } from '@zodash/delay';
import { format } from '@zodash/format';
import * as basicAuth from 'basic-auth';

import * as base64 from '@zodash/crypto/lib/base64';
import { md5 } from '@zodash/crypto/lib/md5';
import * as aes from '@zodash/crypto/lib/aes';

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
        ctx.body = format(text.toString(), context);
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
    maxFileSize: 500 * 1024 * 1024, // 500M
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

/**
 * Returns the requester's IP address.
 */
app.get('/ip', async (ctx) => {
  await ctx.json({
    ip: ctx.ip,
    ips: ctx.ips,
  });
});

/**
 * Return a UUID4
 */
app.get('/uuid', async (ctx) => {
  await ctx.json({
    uuid: uuid(),
  });
});

/**
 * Return the incoming request's HTTP Headers.
 */
app.get('/headers', async (ctx) => {
  await ctx.json({
    headers: ctx.headers,
  });
});

/**
 * Return the incoming requests's User-Agent Header
 */
app.get('/user-agent', async (ctx) => {
  await ctx.json({
    'user-agent': ctx.get('user-agent'),
  });
});

/**
 * The request's GET parameters
 */
app.get('/get', async (ctx) => {
  await ctx.json({
    method: ctx.method,
    url: ctx.url,
    query: ctx.query,
    params: ctx.params,
    headers: ctx.headers,
    origin: ctx.origin,
  });
});

/**
 * The requests's POST parameters
 */
app.post('/post', async (ctx) => {
  await ctx.json({
    method: ctx.method,
    url: ctx.url,
    query: ctx.query,
    params: ctx.params,
    body: ctx.request.body,
    files: ctx.files,
    headers: ctx.headers,
    origin: ctx.origin,
  });
});

/**
 * The requests's PUT parameters
 */
app.put('/put', async (ctx) => {
  await ctx.json({
    method: ctx.method,
    url: ctx.url,
    query: ctx.query,
    params: ctx.params,
    body: ctx.request.body,
    files: ctx.files,
    headers: ctx.headers,
    origin: ctx.origin,
  });
});

/**
 * The requests's PATCH parameters
 */
app.patch('/patch', async (ctx) => {
  await ctx.json({
    method: ctx.method,
    url: ctx.url,
    query: ctx.query,
    params: ctx.params,
    body: ctx.request.body,
    files: ctx.files,
    headers: ctx.headers,
    origin: ctx.origin,
  });
});

/**
 * The requests's DELETE parameters
 */
app.del('/delete', async (ctx) => {
  await ctx.json({
    method: ctx.method,
    url: ctx.url,
    query: ctx.query,
    params: ctx.params,
    body: ctx.request.body,
    files: ctx.files,
    headers: ctx.headers,
    origin: ctx.origin,
  });
});

app.get('/cookie', async (ctx) => {
  await ctx.json({
    cookie: ctx.get('cookie'),
  });
});

app.get('/cookie/set/:name/:value', async (ctx) => {
  ctx.cookies.set(ctx.params.name, ctx.params.value);

  await ctx.json({
    setCookie: ctx.params,
  });
});

app.get('/cookie/get/:name', async (ctx) => {
  await ctx.json({
    getCookie: {
      name: ctx.params.name,
      value: ctx.cookies.get(ctx.params.name),
    },
  });
});

/**
 * Prompt the user for authorization using HTTP Basic Auth
 */
app.get('/basic-auth/:username/:password', async (ctx) => {
  const user = basicAuth(ctx.req);
  const { username, password } = ctx.params;

  if (!user || user.name !== username || user.pass !== password) {
    return ctx.throw(401, null, {
      headers: {
        'WWW-Authenticate': `Basic realm="Secure Area"`,
        'user': user && user.name,
        'pass': user && user.pass, 
      },
    });
  }

  await ctx.json({
    'basic-auth': {
      headers: ctx.headers,
      authorization: ctx.get('authorization'),
      username: user.name,
      password: user.pass,
    },
  });
});

/**
 * Prompts the user for authorization using bearer authentication
 */
app.get('/bearer', async (ctx) => {
  const authorization = ctx.get('Authorization');
  if (!(authorization && authorization.startsWith('Bearer '))) {
    return ctx.throw(401, null, {
      headers: {
        'WWW-Authenticate': 'Bearer',
      },
    });
  }

  const token = /^Bearer\s(\w+)/.exec(authorization)[1]

  await ctx.json({
    authenticated: true,
    token,
  });
});

/**
 * Returns a delayed response (max of 10 seconds).
 */
app.get('/delay/:delay', async (ctx) => {
  const ms = +ctx.params.delay || 0;
  await delay(ms);
  await ctx.json({
    method: ctx.method,
    url: ctx.url,
    query: ctx.query,
    params: ctx.params,
    body: ctx.request.body,
    files: ctx.files,
    headers: ctx.headers,
    origin: ctx.origin,
  });
});

/**
 * Base64 encode
 */
app.get('/base64/encode/:value', async (ctx) => {
  const value = ctx.params.value;

  await ctx.json({
    [value]: base64.encode(value),
  });
});

/**
 * Base64 decode
 */
app.get('/base64/decode/:value', async (ctx) => {
  const value = ctx.params.value;

  await ctx.json({
    [value]: base64.decode(value),
  });
});

/**
 * MD5
 */
app.get('/md5/:value', async (ctx) => {
  const value = ctx.params.value;

  await ctx.json({
    [value]: md5(value),
  });
});

/**
 * MD5
 */
app.get('/md5/:value', async (ctx) => {
  const value = ctx.params.value;

  await ctx.json({
    [value]: md5(value),
  });
});

/**
 * AES encrypt
 */
app.get('/aes/encrypt/:algorithm/:iv/:key/:value', async (ctx) => {
  const {
    algorithm,
    iv,
    key,
    value,
  } = ctx.params;

  await ctx.json({
    algorithm,
    iv,
    key,
    value,
    encrypedValue: aes.encrypt(algorithm, key, iv, value),
  });
});

/**
 * AES decrypt
 */
app.get('/aes/decrypt/:algorithm/:iv/:key/:value', async (ctx) => {
  const {
    algorithm,
    iv,
    key,
    value,
  } = ctx.params;

  await ctx.json({
    algorithm,
    iv,
    key,
    value,
    decrypedValue: aes.decrypt(algorithm, key, iv, value),
  });
});

/**
 * Return a 304 if an If-Modified-Since header or If-None-Match is present. Returns the same as a GET otherwise.
 */
app.get('/cache', async (ctx) => {
  const isConditional = ctx.get('If-Modified-Since') || ctx.get('If-None-Match');

  if (!isConditional) {
    const lastModified = new Date().toUTCString();
    const etag = base64.encode(uuid()); // @TODO
    ctx.set('Last-Modified', lastModified);
    ctx.set('ETag', etag);
    return await ctx.json({
      lastModified,
      etag,
    });
  }

  ctx.status = 304;
});

/**
 * Assumes the resource has the given etag and responds to If-None-Match and If-Match headers appropriately.
 */
app.get('/etag/:etag', async (ctx) => {
  const etag = ctx.params.etag;
  const IfNoneMatch = ctx.get('If-None-Match');
  const IfMatch = ctx.get('If-Match');
  
  if (IfNoneMatch) {
    if (etag === IfNoneMatch) {
      ctx.status = 304;
      ctx.set('Etag', etag);
      return await ctx.json({
        status: 304,
        etag,
      });
    }
  } else if (IfMatch) {
    if (etag != IfMatch) {
      ctx.status = 412;
      return ;
    }
  }

  ctx.set('ETag', etag);
  await ctx.json({
    status: 200,
    etag,
  });
});

app.get('/cache/:value', async (ctx) => {
  const value = +ctx.params.value || 0;
  ctx.set('Cache-Control', `public, max-age=${value}`);
  await ctx.json({
    cacheControl: `public, max-age=${value}`,
  });
});

/**
 * Returns a simple image of the type suggest by the Accept header.
 */
app.get('/image', async (ctx) => {
  if (ctx.accepts('image/webp')) {
    return await ctx.resource('./static/images/wolf_1.webp', 'image/webp');
  } else if (ctx.accepts('image/svg+xml')) {
    return await ctx.resource('./static/images/svg_logo.svg', 'image/svg+xml');
  } else if (ctx.accepts('image/jpeg')) {
    return await ctx.resource('./static/images/jackal.jpg', 'image/jpeg');
  } else if (ctx.accepts('image/png')) {
    return await ctx.resource('./static/images/pig_icon.png', 'image/png');
  } else {
    ctx.status = 406; // Unsupported media type
  }
});

/**
 * Returns a simple WEBP image.
 */
app.get('/image/webp', async (ctx) => {
  return await ctx.resource('./static/images/wolf_1.webp', 'image/webp');
});

/**
 * Returns a simple SVG image.
 */
app.get('/image/svg', async (ctx) => {
  return await ctx.resource('./static/images/svg_logo.svg', 'image/svg+xml');
});

/**
 * Returns a simple JPEG image.
 */
app.get('/image/jpeg', async (ctx) => {
  return await ctx.resource('./static/images/jackal.jpg', 'image/jpeg');
});

/**
 * Returns a simple PNG image.
 */
app.get('/image/png', async (ctx) => {
  return await ctx.resource('./static/images/pig_icon.png', 'image/png');
});

app.get('/pdf', async (ctx) => {
  await ctx.resource('./static/pdfs/img.jpeg.pdf', 'application/pdf');
});

app.get('/upload', async (ctx) => {
  await ctx.render('./view/upload.html', {
    title: 'Upload',
  });
});

app.post('/upload', async (ctx) => {
  console.log(ctx.request.files);
  await ctx.json({
    method: ctx.method,
    url: ctx.url,
    query: ctx.query,
    params: ctx.params,
    body: ctx.request.body,
    files: ctx.request.files,
    headers: ctx.headers,
    origin: ctx.origin,
  });
});


const port = +process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
  console.log(`server start at http://127.0.0.1:${port}.`);
});
