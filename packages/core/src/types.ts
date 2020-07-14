import * as Koa from 'koa';

export interface Context extends Koa.Context {
  request: Request;
  response: Response;
}

export interface Request extends Koa.Request {

}

export interface Response extends Koa.Response {

}

export interface Options {
  
}
