import {
  Strategy,
  IGetUserByStrategyProfile,
  Config,
} from '@koex/passport-oauth2-config';

export interface GithubStrategyOptions {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export interface Token {
  access_token: string;
}

export class GithubStrategy extends Strategy {
  constructor(private readonly _options: GithubStrategyOptions, public readonly getUserByStrategyProfile: IGetUserByStrategyProfile) {
    super({
      ..._options,
      response_type: 'code',
      grant_type: 'authorization_code',
      authorize_url: 'https://github.com/login/oauth/authorize',
      token_url: 'https://github.com/login/oauth/access_token',
      user_profile_url: 'https://api.github.com/user',
    }, getUserByStrategyProfile);
  }

  protected config: Config = {
    callback: {
      user_profile: {
        profile: {
          id: '{login}',
        },
      },
    },
  };
}

