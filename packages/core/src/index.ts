import * as Koa from 'koa';
import {
  Middleware,
  //
  Context,
  Request,
  Response,
  Options,
} from '@koex/type';

import './type';

import { router } from './router';

import { Controller, Service, Model } from './models';
import { createHelpers } from './helpers';

import {
  createControllers,
  createServices,
  createModels,
  extendsApplication,
  extendsContext,
} from './utils';

export {
  Middleware,
  //
  Context,
  Request,
  Response,
  Options,
  //
  Controller,
  Service,
  Model,
  //
  createControllers,
  createServices,
  createModels,
  //
  extendsApplication,
  extendsContext,
};

export interface Application {}

export class Application extends Koa implements Application {
  constructor(private readonly options?: Options) {
    super();

    this.setup();
  }

  private setup() {
    this.mountHelpers();
  }

  private mountHelpers() {
    createHelpers(this);
  }

  public get router() {
    return router;
  }

  // public use(md: Middleware<Context>) {
  //   super.use(md as any);
  // }

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

export default Application;
