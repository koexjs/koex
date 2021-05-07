import type { Context, Middleware } from '@koex/type';

declare module '@koex/type' {
  export interface Context {
    params?: any;
    routePath?: string;
  }
}

export type Method =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS'
  | 'ALL';

export type Next = () => Promise<void>;

export type Handler<T = any> = Middleware<T>;

export { Context, Middleware };
