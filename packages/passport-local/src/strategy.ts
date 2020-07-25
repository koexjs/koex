import { Context } from '@koex/core';

import { Strategy, IVerify } from '@koex/passport';

export type IToken = null;

export type IProfile = {
  type?: string;
  username: string;
  password: string;
};

export class LocalStrategy extends Strategy<IToken, IProfile> {
  public name = 'local';

  constructor(public readonly verify: IVerify<IToken, IProfile>) {
    super(verify);
  }

  // in local strategy, authenticate method is useless
  public async authenticate(ctx: Context) {
    // this.session = new Session(ctx, {
    //   getUserBySessionProfile: (strategy, id) => {
    //     return this.getUserByStrategyProfile(ctx, this.strategy, { id }, Stage.authorize);
    //   },
    // });
    // const profile = await this.callback(ctx);
    // const user = await this.getUserByStrategyProfile(ctx, this.strategy, profile, Stage.authorize);
    // ctx.user = user;
    // this.session.set(this.strategy, profile.id);
  }

  // in local strategy, only callback works, and you should use POST mehod to callback and callback url (which is real authenticate)
  public async callback(ctx: Context) {
    const { type, username, password } = (ctx.request as any).body || {};

    // if (!username || !password) {
    //   ctx.throw(400, 'username and password are required');
    // }

    return {
      token: null,
      profile: {
        type,
        username,
        password,
      },
    };
  }
}
