import * as path from 'path';
import App from '@koex/core';
import assets from '@koex/static';
import ejs from '@koex/ejs';
import cors from '@koex/cors';
import * as _ from 'lodash';

import utils from './utils';
import { Config } from './type';

const { serve, fs } = utils;

const DEFAULT_CONFIG = {
  host: process.env.HOST || '0.0.0.0',
  port: +process.env.PORT || 9000,
  dir: process.cwd(),
  cors: false,
  single: false,
  cache: false,
  // suffix: '',
};

export default function createApp(config: Config = DEFAULT_CONFIG) {
  const app = new App();

  app.use(cors({
    origin(ctx) {
      if (!config.cors) {
        return false;
      }

      return ctx.get('origin');
    }
  }));

  app.use(ejs({
    dir: path.join(__dirname, '../views'),
    cache: config.cache as any,
  }));

  app.use(async (ctx, next) => {
    const start = Date.now();

    try {
      await next();
    } finally {
      const delta = Date.now() - start;
      ctx.logger.info(`${ctx.method} ${ctx.path} ${ctx.status} +${delta}`);
    }
  });

  app.use(assets('/', {
    dir: config.dir,
    index: true,
    maxAge: 0 as any,
    suffix: config.suffix,
    showHidden: true,
  }));

  app.get('(.*)', async (ctx, next) => {
    if (!config.single) {
      return next();
    }

    try {
      ctx.type = 'text/html; charset=utf-8';
      ctx.body = await fs.readFile('index.html', 'utf8');
    } catch (err) {

    }
  });

  app.get('(.*)', async (ctx) => {
    const requestPath = ctx.path;

    const dir = path.join(config.dir, requestPath);

    const getFilePath = (isDir: boolean, name: string) => {
      return path.join(requestPath, name);
    };
    const getFileName = (isDir: boolean, name: string) => {
      return !isDir ? name : `${name}/`;
    };
    // const getExt = (name: string) => {
    //   return path.extname(name);
    // };
    const getFileIcon = (type: string) => {
      switch (type) {
        case 'file':
          return 'file';
        case 'dir':
          return 'folder-open';
        default:
          return 'unknown';
      }
    }

    if(!await fs.isDir(dir)) {
      ctx.status = 404;
      return ;
    }

    const _files = await fs.listDir(dir);

    const files = _(_files)
      .groupBy(file => file.type)
      .sortBy(group => group[0].type)
      .flatten()
      .map(file => {
        const isDir = file.type === 'dir';
        // const ext = getExt(file.name);

        return {
          name: getFileName(isDir, file.name),
          path: getFilePath(isDir, file.name),
          icon: getFileIcon(file.type),
        };
      });

    await ctx.render('listdir', {
      files,
    });
  });

  return serve(app, config);
}