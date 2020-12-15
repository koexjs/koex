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

  constructor(
    private readonly ctx: Context,
    private readonly options: SessionOptions,
  ) {}

  set(id: string, strategy: string) {
    const { ctx, key, setOption } = this;
    const data = `${strategy}:${id}`;

    ctx.cookies.set(key, data, setOption);
  }

  get() {
    const { ctx, key, getOption } = this;

    const data = ctx.cookies.get(key, getOption);
    const [strategy, id] = (data || '').split(':') as [string, string];
    
    return {
      id,
      strategy,
    };
  }

  remove() {
    const { ctx, key, setOption } = this;
    ctx.cookies.set(key, null, setOption);
  }

  get isAuthenticated() {
    const { id }= this.get();
  
    return !!id;
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
    if (!uri) return;

    // use only once
    ctx.cookies.set(key, null, setOption);

    return uri;
  }
}
