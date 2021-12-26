import { Server } from 'http';
// TS ERROR:
//   1. Property 'listen' in type 'Application' is not assignable to the same property in base type 'Application<DefaultState, DefaultContext>'.
//   2. Property 'use' in type 'Application' is not assignable to the same property in base type 'Application<DefaultState, DefaultContext>'
// import * as Koa from 'koa';
//
const Koa = require('koa');

import {
  Middleware,
  //
  Context,
  Request,
  Response,
  Options,
} from '@koex/type';
import graceful from '@koex/graceful';

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
  private _server: Server = null;
  private _type: 'port' | 'unix' = 'port';
  private _port?: number;
  private _host?: string;
  private _unix?: string;

  constructor(private readonly options?: Options) {
    super();

    this.setup();
  }

  private setup() {
    graceful();

    this.mountHelpers();
  }

  private mountHelpers() {
    createHelpers(this);
  }

  public get router() {
    return router;
  }

  public get server() {
    return this._server;
  }

  public get type() {
    return this._type;
  }

  public get unix() {
    return this._unix;
  }

  public get host() {
    return this._host;
  }

  public get port() {
    return this._port;
  }

  // public use(md: Middleware<Context>) {
  //   super.use(md as any);
  // }

  public use(middleware: Middleware<Context>) {
    return super.use(middleware);
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

  public listen(path: string, callback: () => void): Server;
  public listen(port: number, hostname: string, callback: () => void): Server;
  public listen(port: any, hostname: any, callback?: any): Server {
    // listen('/var/run/koex.sock, () => { ... })
    if (!callback) {
      this._type = 'unix';
      this._unix = port;

      // const _path = port;
      // callback = hostname;
      this._server = super.listen(port, hostname);
    } else {
      this._host = hostname;
      this._port = port;

      // listen(8080, '0.0.0.0', () => { ... })
      this._server = super.listen(port, hostname, callback);
    }

    return this._server;
  }

  public throw(error: Error) {
    return super.error(error);
  }

  public on(type: 'error', callback: (error: Error) => void): void;
  public on(type: string, callback: Function): void {
    return super.on(type, callback);
  }

  public emit(type: 'error', callback: (error: Error) => void): void;
  public emit(type: string, callback: Function): void {
    return super.emit(type, callback);
  }
}

export default Application;
