import * as autoBind from 'auto-bind';
import * as mongoose from 'mongoose';
import type { Context } from './index';
import { createModel } from './utils';

declare module '.' {
  export interface Application {
    models: Models;
  }

  export interface Context {
    models: Models;
    services: Services;
    controllers: Controllers;
  }

  export interface Models {}

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

export type SchemaDefination = ConstructorParameters<
  typeof mongoose.Schema
>['0'];
export type SchemaOptions = ConstructorParameters<typeof mongoose.Schema>['1'];

export abstract class Model<T extends mongoose.Model<any>> {
  protected mongoose = mongoose;
  protected types = mongoose.Schema.Types;

  constructor() {
    autoBind(this);
  }

  abstract get name(): string;

  abstract get defination(): SchemaDefination;

  options?(): SchemaOptions;

  onSchema?(schema: mongoose.Schema<any>): void;

  build() {
    console.log('model build: ', this.name);
    const { name, defination } = this;

    return createModel<T>((createSchema, registerModel) => {
      const schema = createSchema(defination, this.options?.());

      this.onSchema?.(schema);

      return registerModel(name, schema);
    });
  }
}
