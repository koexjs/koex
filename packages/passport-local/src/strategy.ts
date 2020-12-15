import { Context } from '@koex/core';

import { Strategy, IVerify, ITransformToStandardToken } from '@koex/passport';

export type IToken = IProfile;

export type IProfile = {
  type?: string;
  username: string;
  password: string;
};

export class LocalStrategy extends Strategy<IToken, IProfile> {
  public name = 'local';

  constructor(
    public readonly verify: IVerify<IProfile>,
    // public readonly transformToStandardToken: ITransformToStandardToken<IToken>,
  ) {
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

    // return {
    //   token: null,
    //   profile: {
    //     type,
    //     username,
    //     password,
    //   },
    // };
    // console.log('callback: ', { type, username, password });
    return { type, username, password };
  }

  public async getProfile(ctx: Context, token: any) {
    const { type, username, password } = (ctx.request as any).body || {};

    return {
      type,
      username,
      password,
    };
  }

  public transformToStandardToken = async (ctx: Context, token: IToken) => {
    return {
      // username: token.username,
      // password: token.password,
      accessToken: `${token.username}:${token.password}`,
    };
  }
}
