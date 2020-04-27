import {
  Strategy,
  IVerify,
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

export interface Profile {
  id: string;
  login: string;
  avatar_url: string;
  url: string;
  node_id: string;
}


export class GithubStrategy extends Strategy<Token, Profile> {
  constructor(private readonly _options: GithubStrategyOptions, public readonly verify: IVerify<Token, Profile>) {
    super({
      ..._options,
      response_type: 'code',
      grant_type: 'authorization_code',
      authorize_url: 'https://github.com/login/oauth/authorize',
      token_url: 'https://github.com/login/oauth/access_token',
      user_profile_url: 'https://api.github.com/user',
    }, verify);
  }

  protected config: Config = {
    callback: {
      user_profile: {
        profile: {
          id: '{id}',
          login: '{login}',
          avatar_url: '{avatar_url}',
          url: '{url}',
          node_id: '{node_id}',
        },
      },
    },
  };
}