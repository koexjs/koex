import * as fs from 'fs';
import * as path from 'path';

import App, { Context } from '@koex/core';
import body from '@koex/body';
import logger from '@koex/logger';
import passport, { usePassport, IUsePassport } from '@koex/passport';
import { format } from '@zodash/format';

import { GithubStrategy } from './passport';

const port = +process.env.PORT || 8080;
const host = `127.0.0.1`;

declare module '@koex/core' {
  export interface Context {
    json(data: object | any[]): Promise<void>;
    resource(filepath: string, contentType: string): Promise<void>;
    render<T>(viewpath: string, context?: T): Promise<void>;
  }
}

const app = new App();
const env = {
  value: process.env.NODE_ENV,
  prod: process.env.NODE_ENV === 'production',
}

app.keys = ['secret'];

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

app.use(logger());

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

passport.use('github', new GithubStrategy({
  client_id: 'b62379e3450c08ddc687',
  client_secret: '4f697887f937b51e6770f870cd1a2fac01d8538a',
  redirect_uri: `http://${host}:${port}/oauth/github/callback`,
}, async (ctx, strategy, profile, stage) => {

  return {
    id: profile.id,
    strategy,
    stage,
    profile,
  };
}));

usePassport(app, {
  async renderLoginPage(ctx: Context, options: IUsePassport) {
    ctx.redirect('/oauth/github');
  },
});

// app.use(passport.initialize({
//   excludePaths: [
//     '/oauth/(.*)',
//     '/login',
//     '/logout',
//   ],
//   async onUnauthorization(ctx) {
//     ctx.redirect('/login');
//   },
// }))
// app.get('/oauth/:strategy', passport.authenticate());
// app.get('/oauth/:strategy/callback', passport.callback(), async (ctx) => {
//   ctx.redirect('/');
// });
// app.get('/login', passport.login({
//   redirect: '/oauth/github',
//   // async render(ctx) {
//   //   ctx.body = {
//   //     message: 'render login',
//   //   };
//   // },
// }));
// app.get('/logout', passport.logout({
//   redirect: '/login',
// }));

app.get('/', async ctx => {
  ctx.body = {
    message: 'You have logined',
    user: ctx.user,
  };
});

app.listen(port, '0.0.0.0', () => {
  console.log(`server start at http://127.0.0.1:${port}.`);
});
