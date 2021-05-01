import * as Koa from 'koa';

// declare module 'koa' {
//   export class Application {
//     use(md: any): void;
//   }
// }

export interface Context extends Koa.Context {
  request: Request;
  response: Response;
}

export interface Request extends Koa.Request {}

export interface Response extends Koa.Response {}

export interface Options {}
