import { Context } from '@koex/core';
import * as autoBind from 'auto-bind';

export class BaseClass {
  protected readonly ctx: Context;

  constructor() {
    autoBind(this);
  }

  get app() {
    return this.ctx.app;
  }

  get config() {
    return this.ctx.config;
  }

  public setContext(ctx: Context) {
    (this as any).ctx = ctx;
  }
}

export class Controller extends BaseClass {
  /**
   * Set Context on Proto
   * 
   * @param ctx Context
   */
  public static _setContextByProto(ctx: Context) {
    (Controller.prototype as any).ctx = ctx;
  }
}

export class Service extends BaseClass {
  /**
   * Set Context on Proto
   * 
   * @param ctx Context
   */
  public static _setContextByProto(ctx: Context) {
    (Service.prototype as any).ctx = ctx;
  }
}