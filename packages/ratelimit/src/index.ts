import { Context } from '@koex/type';
import LRU, { LRU as ILRU } from '@zcorky/lru';
import { undefined as isUndefined } from '@zcorky/is';

const debug = require('debug')('@koex/ratelimit');
const ms = require('ms');

export type DB<K, V> =
  | {
      get(key: K): V | Promise<V>;
      set(key: K, value: V): void | Promise<void>;
      [key: string]: any;
    }
  | ILRU<K, V>;
export interface Options<K, V> {
  headers?: Headers;
  errorMessage?: string;
  throw?: boolean;
  disableHeader?: boolean;
  key?: (ctx: Context) => string | false;
  max?: number;
  duration?: number;
  db?: DB<K, V>;
}

export interface Headers {
  remaining: string;
  reset: string;
  total: string;
}

export interface Limit {
  remaining: number;
  reset: number;
  total: number;
}

const createRateLimit = (options?: Options<string, Limit>) => {
  const _options = options || {};
  const getKey = !isUndefined(_options.key)
    ? (ctx: Context) => _options.key!(ctx)
    : (ctx: Context) => ctx.ip;

  const max = _options.max || 2500;
  const duration = _options.duration || 1 * 60 * 60 * 1000;
  const db = _options.db || new LRU<string, Limit>(max);

  const disableHeader = _options.disableHeader;
  const headerNames = _options.headers || {
    remaining: 'X-RateLimit-Remaining',
    reset: 'X-RateLimit-Reset',
    total: 'X-RateLimit-Total',
  };

  const getHeaders = (ctx: Context, limit: Limit) => {
    return {
      [headerNames.remaining]: `${limit.remaining}`,
      [headerNames.reset]: `${limit.reset}`,
      [headerNames.total]: `${limit.total}`,
    };
  };

  const setHeaders = (ctx: Context, limit: Limit) => {
    if (disableHeader) return;

    ctx.set(getHeaders(ctx, limit));
  };

  const initialLimiter = {
    remaining: max,
    reset: Date.now() + duration,
    total: max,
  };

  const reset = (limit) => {
    limit.remaining = max;
    limit.reset = Date.now() + duration;
  };

  return async function koexRateLimit(ctx: Context, next: () => Promise<any>) {
    const key = getKey(ctx);
    if (key === false) return next();

    let limiter = await db.get(key);

    // @initial, no limiter for key
    if (!limiter) {
      limiter = initialLimiter;
      await db.set(key, limiter);
    }

    // @remaining decrease
    const calls = limiter.remaining > 0 ? limiter.remaining - 1 : 0;

    // @reset
    const delta = (limiter.reset - Date.now()) | 0;
    if (delta < 0) {
      reset(limiter);
    }

    // @header set
    setHeaders(ctx, {
      ...limiter,
      remaining: calls,
    });

    // @remaining > 0
    debug('remaining %s/%s %s', limiter.remaining, limiter.total, key);
    if (limiter.remaining) {
      limiter.remaining -= 1;
      return next();
    }

    const after = (limiter.reset - Date.now()) | 0;
    ctx.set('Retry-After', `${after}`);
    ctx.status = 429;
    ctx.body =
      _options.errorMessage ||
      `Rate limit exceeded, retry in ${ms(delta, { long: true })}.`;

    if (_options.throw) {
      ctx.throw(ctx.status, ctx.body as any, {
        headers: getHeaders(ctx, limiter),
      });
    }
  };
};

export { createRateLimit };

export default createRateLimit;
