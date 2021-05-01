import type { Context } from './index';
import autoBind from 'auto-bind';

declare module '.' {
  export interface Context {
    services: Services;
    controllers: Controllers;
  }

  export interface Services {}

  export interface Controllers {}
}

export class BaseClass {
  constructor(protected readonly ctx: Context) {
    autoBind(this);
  }

  get app() {
    return this.ctx.app;
  }

  get config() {
    return this.ctx.config;
  }

  get logger() {
    return this.ctx.logger;
  }

  get cache() {
    return this.ctx.cache;
  }
}

export class Controller extends BaseClass {}

export class Service extends BaseClass {}
