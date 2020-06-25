import { Koex } from './index';
import { Context } from './types';

import { Logger } from '@zodash/logger';

declare module '.' {
  export interface Koex {
    logger: Logger;
  }

  export interface Context {
    logger: Logger;
  }
}

export function createHelpers(app: Koex) {
  const appLogger = new Logger('app');
  const contextLogger = new Logger('context');

  app.logger = appLogger;

  app.use(async (ctx, next) => {
    ctx.logger = contextLogger;

    return next();
  });
}