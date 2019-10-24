import { Context, User } from '@koex/core';
import { SetOption, GetOption } from 'cookies';

export interface SessionOptions {
  maxAge?: number;
  getUserBySessionProfile(strategy: string, id: string): Promise<User>;
}

const DEFAULT_SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export class Session {
  // private key = 'strategy:id';
  // private key = '@koex/passport#strategy:id'
  private key = 'kpsi';
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

  set(strategy: string, id: string) {
    const { ctx, key, setOption } = this;
    const value = `${strategy}:${id}`;

    ctx.cookies.set(key, value, setOption);
  }

  get() {
    const { ctx, key, getOption } = this;
    const value = ctx.cookies.get(key, getOption);
    if (!value) return ;

    const [strategy, id] = value.split(':'); // @TODO
    return { id, strategy };
  }

  remove() {
    const { ctx, key, setOption } = this;
    ctx.cookies.set(key, null, setOption);
  }

  async user() {
    const { id, strategy } = this.get();

    return this.options.getUserBySessionProfile(strategy, id);
  }

  get isAuthenticated() {
    return !!this.get();
  }
}