import Application from './index';

import { Logger } from '@zodash/logger';
import { lru as LRU } from '@zcorky/lru';

import { extendsApplication, extendsContext } from './utils';

export function createHelpers(app: Application) {
  // logger
  const appLogger = new Logger('app');
  const contextLogger = new Logger('context');
  // cache
  const appCache = new LRU<string, any>();
  const contextCache = new LRU<string, any>();

  // app.logger = appLogger;
  // app.cache = appCache;

  // app.use(async (ctx, next) => {
  //   ctx.logger = contextLogger;
  //   ctx.cache = contextCache;

  //   return next();
  // });

  extendsApplication(app, 'logger', appLogger);
  extendsApplication(app, 'cache', appCache);

  extendsContext(app, 'logger', contextLogger);
  extendsContext(app, 'cache', contextCache);
}
