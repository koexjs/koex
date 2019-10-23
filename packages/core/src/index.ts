import * as Koa from 'koa';
import { Middleware } from 'koa-compose';

import { router } from './router';

export {
  Middleware,
};

export interface Context extends Koa.Context {

}

export interface Options {
  
}

export class Koex extends Koa {
  constructor(private readonly options?: Options) {
    super()
  }

  public get router() {
    return router;
  }

  public all(path: string, ...middlewares: Middleware<Context>[]) {
    this.use(this.router.all(path, ...middlewares));
  }

  public get(path: string, ...middlewares: Middleware<Context>[]) {
    this.use(this.router.get(path, ...middlewares));
  }

  public post(path: string, ...middlewares: Middleware<Context>[]) {
    this.use(this.router.post(path, ...middlewares));
  }

  public put(path: string, ...middlewares: Middleware<Context>[]) {
    this.use(this.router.put(path, ...middlewares));
  }

  public patch(path: string, ...middlewares: Middleware<Context>[]) {
    this.use(this.router.patch(path, ...middlewares));
  }

  public del(path: string, ...middlewares: Middleware<Context>[]) {
    this.use(this.router.del(path, ...middlewares));
  }
}

export default Koex;