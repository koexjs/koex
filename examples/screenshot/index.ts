import * as fs from 'fs';
import * as path from 'path';

import App from '@koex/core';
import body from '@koex/body';
import { format } from '@zodash/format';

import { md5 } from '@zodash/crypto/lib/md5';
import { map } from '@zodash/map';
import { lru as LRU } from '@zcorky/lru';

import * as puppeteer from 'puppeteer';

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

export type Screenshot = {
  url: string;
  viewport: puppeteer.Viewport;
  maxHeight?: number;
  selector?: string;
};

const app = new App();

const env = {
  value: process.env.NODE_ENV,
  prod: process.env.NODE_ENV === 'production',
}

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

const autoScroll = (page: puppeteer.Page, maxHeight: number = 0) => {
  return page.evaluate((maxHeight) => {
    return new Promise((resolve, reject) => {
      const distance = 100;
      let totalHeight = 0;
      let maxScrollHeight = maxHeight ? maxHeight : document.body.scrollHeight;
      
      let timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= maxScrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(timer);
        resolve();
      }, 20000);
    });
  }, maxHeight);
};

const screenshot = async (config: Screenshot) => {
  const browser = await puppeteer.launch({
    headless: true,
    // timeout: 60 * 1000,
  });

  const page = await browser.newPage();
  await page.goto(config.url);
  await page.setViewport(config.viewport);
  
  if (!config.selector) {
    // console.log('autoScroll');
    await autoScroll(page, config.maxHeight);
  } else {
    // console.log('selector');
    await page.$(config.selector);
  }

  const title = await page.title();
  const buffer = await page.screenshot({
    // path: `./static/${title}.png`,
    fullPage: config.selector ? false : true,
    type: 'png',
  });
  await page.close();

  return {
    title,
    buffer,
  };
};

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
  const url = !ctx.query.url ? undefined : decodeURIComponent(ctx.query.url);
  const width = +ctx.query.width || 1200;
  const height = +ctx.query.width || 800;
  const maxHeight = +ctx.query.maxheight || 0;
  const selector = ctx.query.selector;

  if (!url) {
    return ctx.throw(400, `url is required`);
  }

  const ss = await screenshot({
    url,
    viewport: {
      width,
      height,
    },
    maxHeight,
    selector,
  });
  console.log(`url: ${url} - (${width}, ${height}, ${maxHeight}, ${selector}) title: ${ss.title}`);
  ctx.set('Cache-Control', 'public, max-age=31536000');
  ctx.set('Content-Disposition', `inline; filename="${encodeURIComponent(ss.title)}.png"; filename*=utf-8' '${encodeURIComponent(ss.title)}.png`);
  ctx.set('Content-Type', 'image/png')

  ctx.body = ss.buffer;
});



const port = +process.env.PORT || 8080;

app.listen(port, '0.0.0.0', () => {
  console.log(`server start at http://127.0.0.1:${port}.`);
});
