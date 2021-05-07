import type { Context } from './index';
import type { Logger } from '@zodash/logger';
import type { LRU } from '@zcorky/lru';

declare module '.' {
  export interface Application {
    readonly logger: Logger;
    readonly cache: LRU<string, any>;
    //
    readonly models: Models;
    readonly controllers: Controllers;
  }

  export interface Context {
    readonly logger: Logger;
    readonly cache: LRU<string, any>;
    //
    readonly models: Models;
    readonly services: Services;
  }

  export interface Models {}

  export interface Services {}

  export interface Controllers {}
}
