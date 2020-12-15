import { Context } from '@koex/core';
import { Strategy, IVerify, ITransformToStandardToken, Config } from '@koex/passport-oauth2-config';

export interface DoreamonStrategyOptions {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export type IToken = {};

export type IProfile = {
  id: string;
  username: string;
  nickname: string;
  email: string;
  avatar: string;
};

export class DoreamonStrategy extends Strategy<IToken, IProfile> {
  constructor(
    private readonly _options: DoreamonStrategyOptions,
    public readonly verify: IVerify<IProfile>,
  ) {
    super(
      {
        ..._options,
        response_type: 'code',
        grant_type: 'authorization_code',
        authorize_url: 'https://login.zcorky.com/authorize',
        token_url: 'https://login.zcorky.com/token',
        user_profile_url: 'https://login.zcorky.com/user',
        scope: 'todo',
        state: 'todo',
      } as any,
      verify,
    );
  }

  protected config: Config = {
    callback: {
      code: {
        name: 'code',
      },

      access_token: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        // query: {},
        // body: {},
      },

      user_profile: {
        // method: 'GET',
        // headers: {},
        // query: {},
        // body: {},
        profile: {
          id: '{_id}',
          username: '{username}',
          nickname: '{nickname}',
          email: '{email}',
          avatar: '{avatar}',
        },
      },
    },
  };

  public async refreshToken(ctx: Context, refreshTokenString: string) {
    const {
      token_url,
      client_id,
      client_secret,
    } = this.oauthStrategyOptions;

    const refreshTokenData = {
      client_id,
      client_secret,
      grant_type: 'refresh_token' as 'refresh_token',
      refresh_token: refreshTokenString,
    };

    const token = await this.getAccessToken(token_url, refreshTokenData);

    return token;
  }
}
