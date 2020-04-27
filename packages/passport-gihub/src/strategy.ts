import { Context } from '@koex/core';
import {
  Strategy, IVerify,
  IGetAuthorizeUrlData,
  IGetAccessTokenData,
} from '@koex/passport-oauth2';

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

  protected async getAuthorizeUrl(authorize_url: string, data: IGetAuthorizeUrlData) {
    return `${authorize_url}?${this.utils.qs.stringify(data as {})}`;
  }

  protected async getAccessToken(token_url: string, data: IGetAccessTokenData): Promise<Token> {
    const method = 'POST';

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const response = await this.utils.fetch(token_url, {
      method,
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const status = response.status;
      const message = await response.text();
      throw new Error(`[oauth.token][${status}] ${message}`);
    }

    return response.json();
  }

  protected async getAccessUser(user_profile_url: string, access_token: Token): Promise<Profile> {
    const method = 'GET';

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${access_token.access_token}`,
    };

    const response = await this.utils.fetch(user_profile_url, {
      method,
      headers,
    });

    if (!response.ok) {
      const status = response.status;
      const message = await response.text();
      throw new Error(`[oauth.user][${status}] ${message}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      login: data.login,
      avatar_url: data.avatar_url,
      url: data.url,
      node_id: data.node_id,
    };
  }
}

