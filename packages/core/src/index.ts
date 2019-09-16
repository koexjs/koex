import * as Koa from 'koa';
import { Middleware } from 'koa-compose';

import { router } from './router';

export interface Context extends Koa.Context {

}

export interface Options {
  
}

export class Koex extends Koa {
  // private readonly logger = logger;

  constructor(private readonly options?: Options) {
    super()
  }

  public get router() {
    return router;
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

  public del(path: string, ...middlewares: Middleware<Context>[]) {
    this.use(this.router.del(path, ...middlewares));
  }
}

export default Koex;