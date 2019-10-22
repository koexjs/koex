import { Context } from '@koex/core';
import { Logger, Options } from '@zodash/logger';

declare module '@koex/core' {
  export interface Context {
    logger: Logger;
  }
}

export default (options?: Options) => {
  return async function logger(ctx: Context, next: () => Promise<void>) {
    ctx.logger = new Logger('koex.ctx', options);

    await next();
  }
};