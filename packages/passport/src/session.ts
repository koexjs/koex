import { Context } from '@koex/core';
import { SetOption, GetOption } from 'cookies';

export interface SessionOptions {
  maxAge?: number;
}

const DEFAULT_SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export class Session {
  protected key = 'kpsi';
  private signed = true;
  // private encrypted = true;

  private setOption: SetOption = {
    maxAge: this.options.maxAge || DEFAULT_SESSION_MAX_AGE,
    httpOnly: true,
    signed: this.signed,
  };

  private getOption: GetOption = {
    signed: this.signed,
  };

  constructor(private readonly ctx: Context, private readonly options: SessionOptions) {}

  set(id: string) {
    const { ctx, key, setOption } = this;

    ctx.cookies.set(key, id, setOption);
  }

  get() {
    const { ctx, key, getOption } = this;

    return ctx.cookies.get(key, getOption);
  }

  remove() {
    const { ctx, key, setOption } = this;
    ctx.cookies.set(key, null, setOption);
  }

  get isAuthenticated() {
    return !!this.get();
  }
}

export class RedirectSession {
  protected key = 'kpre';
  private signed = true;
  // private encrypted = true;

  private setOption: SetOption = {
    maxAge: DEFAULT_SESSION_MAX_AGE, // @TODO
    httpOnly: true,
    signed: this.signed,
  };

  private getOption: GetOption = {
    signed: this.signed,
  };

  constructor(private readonly ctx: Context) {}

  set(uri: string) {
    const { ctx, key, setOption } = this;
    ctx.cookies.set(key, uri, setOption);
  }

  get() {
    const { ctx, key, getOption, setOption } = this;
    const uri = ctx.cookies.get(key, getOption);
    if (!uri) return ;

    // use only once
    ctx.cookies.set(key, null, setOption);

    return uri;
  }
}