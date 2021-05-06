import type { Context, Middleware } from '@koex/type';
import * as compose from 'koa-compose';
import LRUCache from '@zcorky/lru';
import * as pathToRegexp from 'path-to-regexp';

import { match, decode } from './utils';

declare module '@koex/type' {
  export interface Context {
    params?: any;
    routePath?: string;
  }
}

const debug = require('debug')('koa-router');

export type Method =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'ALL';

export type Next = () => Promise<any>;

export type Handler = (ctx: Context, next: Next) => Promise<void>;

const routesCache = new Map<string, Middleware<any>>();
const requestRoueRecord = new LRUCache<
  string,
  {
    path: string;
    keys: pathToRegexp.Key[];
    re: RegExp;
    handler: Middleware<any>;
  }
>(10000);

const createMethod = (method: Method) => {
  return (path: string, ...handlers: Handler[]) => {
    const keys: pathToRegexp.Key[] = [];
    const re = pathToRegexp(path, keys);
    const handler = handlers.length === 1 ? handlers[0] : compose(handlers);
    /* istanbul ignore next */
    debug('%s %s -> %s', method || 'ALL', path, re);

    const koexRouter = async function (ctx: Context, next: Next) {
      // method
      if (method !== 'ALL' && !match(ctx, method)) return next();

      const requestRouteKey = `${ctx.method} ${ctx.path}`;
      if (requestRoueRecord.has(requestRouteKey)) {
        const cached = requestRoueRecord.get(requestRouteKey);

        parseParams(cached.keys, cached.path, ctx, cached.re.exec(ctx.path));

        return await cached.handler(ctx, next);
      }

      // path
      const matched = re.exec(ctx.path);
      if (matched) {
        parseParams(keys, path, ctx, matched);

        // @TODO default 10 minutes
        requestRoueRecord.set(
          requestRouteKey,
          {
            path,
            keys,
            re,
            handler,
          },
          {
            maxAge: 10 * 60 * 1000,
          },
        );
        return await handler(ctx, next);
      }

      // miss
      await next();
    };

    const key = `${method} ${path}`;
    routesCache.set(key, koexRouter);

    return koexRouter;
  };

  function parseParams(
    keys: pathToRegexp.Key[],
    path: string,
    ctx: Context,
    matched: RegExpExecArray,
  ) {
    const args = matched.slice(1).map(decode);
    ctx.routePath = path;
    ctx.params = keys.reduce(
      (last, item, index) => ((last[item.name] = args[index]), last),
      {},
    );

    debug(
      '%s %s matches %s',
      method,
      path,
      ctx.path,
      JSON.stringify(ctx.params),
    );
  }
};

export const all = createMethod('ALL');
export const get = createMethod('GET');
export const post = createMethod('POST');
export const put = createMethod('PUT');
export const patch = createMethod('PATCH');
export const del = createMethod('DELETE');
export const head = createMethod('HEAD');
export const options = createMethod('OPTIONS');

export const routes = (): ((ctx: Context, next: Next) => Promise<void>) => {
  const routeMiddlewares = [...routesCache.values()];
  return (compose as any)(routeMiddlewares);
};
