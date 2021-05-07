import type { Context } from './index';
import type { Logger } from '@zodash/logger';
import type { LRU } from '@zcorky/lru';

declare module '.' {
  export interface Application {
    logger: Logger;
    cache: LRU<string, any>;
    //
    models: Models;
    controllers: Controllers;
  }

  export interface Context {
    logger: Logger;
    cache: LRU<string, any>;
    //
    models: Models;
    services: Services;
  }

  export interface Models {}

  export interface Services {}

  export interface Controllers {}
}
