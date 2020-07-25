import { Context } from '@koex/core';

import fetch from 'node-fetch';
import * as qs from '@zcorky/query-string';
import { format } from '@zodash/format';
import { get } from '@zodash/get';

import { Strategy, IVerify } from '@koex/passport';

import {
  IOauthStrategyOptions,
  IGetAuthorizeUrlData,
  IGetAccessTokenData,
  Config,
} from './config';

// /**
//  * Access Token
//  */
// export type Token = string;

// /**
//  * User Profile
//  */
// export type Profile = IStrategyProfile;

function formatObject(obj: Record<string, any>, map: Record<string, any>) {
  if (!obj) return obj;

  return Object.keys(obj).reduce((all, key) => {
    const value = obj[key];

    if (typeof value === 'string') {
      all[key] = format(value, map);
    } else {
      all[key] = value;
    }

    return all;
  }, {});
}

/**
 * Oauth Passport Strategy
 *  which defined the authenticate(@S1) and callback flow(@S2),
 *  what you need do is to realize the following three methods,
 *  which will used in authenticate and callback flow.
 *    @Method getAuthorizeUrl(url, data): URL (@S1)
 *    @Method getAccessToken(url, data): Token (@S2)
 *    @Method getAccessUser(url, data): User (@S3)
 */
export abstract class OauthStrategy<
  IToken = any,
  IProfile = any
> extends Strategy<IToken, IProfile> {
  constructor(
    protected readonly oauthStrategyOptions: IOauthStrategyOptions,
    public readonly verify: IVerify<IToken, IProfile>,
  ) {
    super(verify);
  }

  protected abstract config: Config;

  /**
   * Get Authorize Url
   *
   * @param authorize_base_url base authorize url
   * @param data the full authorize url required data
   * @returns the full authorize url, mostly used to redirect
   */
  private async getAuthorizeUrl(
    authorize_base_url: string,
    data: IGetAuthorizeUrlData,
  ): Promise<string> {
    return `${authorize_base_url}?${this.utils.qs.stringify(data as {})}`;
  }

  /**
   * Get Access Token
   *
   * @param token_url base token url
   * @param data the data required to get access token
   */
  private async getAccessToken(
    token_url: string,
    data: IGetAccessTokenData,
  ): Promise<IToken> {
    const method = get(this.config, 'callback.access_token.method', 'POST');

    const headersPattern = get(this.config, 'callback.access_token.headers', {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    const queryPatterns = get(this.config, 'callback.access_token.query', null);
    const bodyPatterns = get(this.config, 'callback.access_token.body', data);

    const headers = formatObject(headersPattern, data);
    const query = formatObject(queryPatterns, data);
    const body = formatObject(bodyPatterns, data);

    const url = !queryPatterns
      ? token_url
      : `${token_url}?${qs.stringify(query)}`;

    const contentType = get(headers, 'Content-Type', 'application/json');
    const bodyString =
      contentType.indexOf('application/x-www-form-urlencoded') !== -1
        ? qs.stringify(body)
        : JSON.stringify(body);

    const response = await this.utils.fetch(url, {
      method,
      headers,
      body: bodyString,
    });

    if (!response.ok) {
      const status = response.status;
      const message = await response.text();
      throw new Error(`[oauth.token][${status}] ${message}`);
    }

    return response.json();
  }

  /**
   * Get Access User
   *
   * @param user_profile_url base user info url, here, just wants to openid, or user
   * @param access_token the getAccessToken() return data
   */
  private async getAccessUser(
    user_profile_url: string,
    token: IToken,
  ): Promise<IProfile> {
    // @TODO
    const access_token_string_key = get(
      this.config,
      'callback.access_token.access_token.name',
      'access_token',
    );

    const access_token = get(token as any, access_token_string_key);

    const data = { access_token };

    const method = get(this.config, 'callback.user_profile.method', 'GET');

    const headersPattern = get(this.config, 'callback.user_profile.headers', {
      Accept: 'application/json',
      Authorization: `Bearer ${access_token}`,
    });
    const queryPatterns = get(this.config, 'callback.user_profile.query', null);
    const bodyPatterns = get(this.config, 'callback.user_profile.body', null);

    const headers = formatObject(headersPattern, data);
    const query = formatObject(queryPatterns, data);
    const body = formatObject(bodyPatterns, data);

    const url = !queryPatterns
      ? user_profile_url
      : `${user_profile_url}?${qs.stringify(query)}`;

    const contentType = get(headers, 'Content-Type', 'application/json');
    const bodyString = !body
      ? null
      : contentType.indexOf('application/x-www-form-urlencoded') !== -1
      ? qs.stringify(body)
      : JSON.stringify(body);

    const options = { method, headers };
    if (bodyString) {
      (options as any).body = bodyString;
    }

    const response = await this.utils.fetch(url, options);

    if (!response.ok) {
      const status = response.status;
      const message = await response.text();
      throw new Error(`[oauth.user][${status}] ${message}`);
    }

    const rawProfile = await response.json();
    const profilePatterns = get(this.config, 'callback.user_profile.profile', {
      id: '{id}',
      username: '{username}',
      nickname: '{nickname}',
      email: '{email}',
      avatar: '{avatar}',
    });

    const profile = formatObject(profilePatterns, rawProfile);

    return profile as any;
  }

  /**
   * @S1 Authenticate Flow
   *
   * @param ctx context
   * @returns redirect to authorization url
   */
  public async authenticate(ctx: Context) {
    const {
      authorize_url,
      client_id,
      response_type,
      redirect_uri,
      scope,
      state,
    } = this.oauthStrategyOptions;

    const data = {
      client_id,
      redirect_uri,
      response_type,
      scope,
      state,
    };

    const auth_server_url = await this.getAuthorizeUrl(authorize_url, data);
    ctx.redirect(auth_server_url);
  }

  /**
   * @S2 Callback Flow
   *
   * @param ctx context
   * @returns user profile
   */
  public async callback(ctx: Context) {
    const {
      token_url,
      user_profile_url,
      client_id,
      client_secret,
      redirect_uri,
      grant_type,
      scope,
    } = this.oauthStrategyOptions;

    const code_string_key = get(this.config, 'callback.code.name', 'code');
    const code = ctx.query[code_string_key]; // @TODO

    const accessTokenData = {
      client_id,
      client_secret,
      redirect_uri,
      grant_type,
      scope,
      code,
    };

    const token = await this.getAccessToken(token_url, accessTokenData);

    const profile = await this.getAccessUser(user_profile_url, token);

    return {
      token,
      profile,
    };
  }

  protected readonly utils = {
    fetch,
    qs,
  };
}
