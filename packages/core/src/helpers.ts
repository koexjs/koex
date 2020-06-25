import { Context } from './types';

import { Logger } from '@zodash/logger';

declare module '.' {
  export interface Context {
    logger: Logger;
  }
}

export async function createHelpers(ctx: Context) {
  ctx.logger = new Logger('core');
}