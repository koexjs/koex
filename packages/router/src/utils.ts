import { Context } from '@koex/type';

export function match(ctx: Context, method: string) {
  if (!method) return true;
  if (ctx.method === method) return true;
  if (method === 'GET' && ctx.method === 'HEAD') return true;
  return false;
}

export function decode(path: string) {
  if (path) {
    return decodeURIComponent(path);
  }
}
