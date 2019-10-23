import { Context, User } from '@koex/core';
import fetch from 'node-fetch';
import * as qs from '@zcorky/query-string';

export abstract class Strategy {
  /**
   * get user instance
   * 
   * @param id user id
   */
  public abstract user(id: User['id']): Promise<User>;

  /**
   * authenticate logic, will go to the real auth server
   * 
   * @param ctx context
   */
  public abstract authenticate(ctx: Context): Promise<void>;

  /**
   * callback logic, match the redirect_uri
   * 
   * @param ctx context
   */
  public abstract callback(ctx: Context): Promise<User['id']>;
}

export interface IOauthStrategyOptions {
  /**
   * Client ID
   */
  client_id: string;

  /**
   * Client ID
   */
  client_secret: string;

  /**
   * Redirect URI (callback url)
   */
  redirect_uri: string;

  /**
   * Scope / Permission
   */
  scope?: string;

  /**
   * Response Type
   *  default: code
   */
  response_type?: string;

  /**
   * Grant Type
   *  default: authorization_code
   */
  grant_type?: string;

  /**
   * Authorize Url
   */
  authorize_url: string;

  /**
   * Token Url
   */
  token_url: string;

  /**
   * User Info Url
   */
  user_info_url: string;
}

export abstract class OauthStrategy extends Strategy {
  constructor(private readonly options: IOauthStrategyOptions) {
    super();
  }

  public async getAuthorizeUrl() {
    const {
      authorize_url,
      client_id,
      response_type,
      redirect_uri,
      scope,
    } = this.options;

    const data = {
      client_id,
      response_type,
      redirect_uri,
      scope,
    };

    const url = `${authorize_url}?${qs.stringify(data)}`;

    return url;
  }

  public async getAccessToken(code: string) {
    const {
      token_url,
      client_id,
      client_secret,
      grant_type,
      redirect_uri,
      scope,
    } = this.options;

    const data = {
      client_id,
      client_secret,
      grant_type,
      redirect_uri,
      scope,
      code,
    };

    const method = 'POST';

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const response = await fetch(token_url, {
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

  public async getAccessUser(access_token: string) {
    const {
      user_info_url,
    } = this.options;

    const method = 'GET';

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${access_token}`,
    };

    const response = await fetch(user_info_url, {
      method,
      headers,
    });

    if (!response.ok) {
      const status = response.status;
      const message = await response.text();
      throw new Error(`[oauth.user][${status}] ${message}`);
    }

    return response.json();
  }
}