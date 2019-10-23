import { Context, User } from '@koex/core';
import { SetOption, GetOption } from 'cookies';

export interface SessionOptions {
  getUserBySessionProfile(strategy: string, id: string): Promise<User>;
}

export class Session {
  private key = 'strategy:id';
  private encrypted = true;

  private setOption: SetOption = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    signed: this.encrypted,
  };

  private getOption: GetOption = {
    signed: this.encrypted,
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