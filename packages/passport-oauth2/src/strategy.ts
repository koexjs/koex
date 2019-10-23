import fetch from 'node-fetch';
import * as qs from '@zcorky/query-string';

import { Strategy, IGetUserByStrategyProfile } from '@koex/passport';

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
  constructor(private readonly oauthStrategyOptions: IOauthStrategyOptions, public readonly getUserByStrategyProfile: IGetUserByStrategyProfile) {
    super(getUserByStrategyProfile);
  }

  protected async getAuthorizeUrl() {
    const {
      authorize_url,
      client_id,
      response_type,
      redirect_uri,
      scope,
    } = this.oauthStrategyOptions;

    const data = {
      client_id,
      response_type,
      redirect_uri,
      scope,
    };

    const url = `${authorize_url}?${qs.stringify(data)}`;

    return url;
  }

  protected async getAccessToken<Token = any>(code: string): Promise<Token> {
    const {
      token_url,
      client_id,
      client_secret,
      grant_type,
      redirect_uri,
      scope,
    } = this.oauthStrategyOptions;

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

  protected async getAccessUser<Profile = any>(access_token: string): Promise<Profile> {
    const {
      user_info_url,
    } = this.oauthStrategyOptions;

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