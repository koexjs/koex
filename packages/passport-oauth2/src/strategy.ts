import { Context } from '@koex/core';

import fetch from 'node-fetch';
import * as qs from '@zcorky/query-string';

import {
  Strategy,
  IVerify,
} from '@koex/passport';

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
   * State / Security
   */
  state?: string;

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
  user_profile_url: string;
}

export interface IGetAuthorizeUrlData {
  /**
   * Client ID
   */
  client_id: string;

  /**
   * Redirect URI (callback url)
   */
  redirect_uri: string;

  /**
   * Response Type
   *  default: code
   */
  response_type?: string;

  /**
   * Scope / Permission
   */
  scope?: string;

  /**
   * State / Security
   */
  state?: string;
}

export interface IGetAccessTokenData {
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
   * Grant Type
   *  default: authorization_code
   */
  grant_type?: string;

  /**
   * Scope / Permission
   */
  scope?: string;

  /**
   * Authorization Code
   */
  code: string;
}

/**
 * Access Token
 */
export type Token = any;

/**
 * Oauth Passport Strategy
 *  which defined the authenticate(@S1) and callback flow(@S2),
 *  what you need do is to realize the following three methods,
 *  which will used in authenticate and callback flow.
 *    @Method getAuthorizeUrl(url, data): URL (@S1)
 *    @Method getAccessToken(url, data): Token (@S2)
 *    @Method getAccessUser(url, data): User (@S3)
 */
export abstract class OauthStrategy<IToken = any, Profile = any> extends Strategy<IToken, Profile> {
  constructor(protected readonly oauthStrategyOptions: IOauthStrategyOptions, public readonly verify: IVerify<IToken, Profile>) {
    super(verify);
  }

  /**
   * Get Authorize Url
   * 
   * @param authorize_base_url base authorize url
   * @param data the full authorize url required data
   * @returns the full authorize url, mostly used to redirect
   */
  protected abstract getAuthorizeUrl(authorize_base_url: string, data: IGetAuthorizeUrlData): Promise<string>

  /**
   * Get Access Token
   * 
   * @param token_url base token url
   * @param data the data required to get access token
   */
  protected abstract getAccessToken(token_url: string, data: IGetAccessTokenData): Promise<Token>;
  
  /**
   * Get Access User
   * 
   * @param user_profile_url base user info url, here, just wants to openid, or user
   * @param access_token the getAccessToken() return data
   */
  protected abstract getAccessUser(user_profile_url: string, access_token: Token): Promise<Profile>;

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

    const code = ctx.query.code;

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