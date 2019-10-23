import { Context, User } from '@koex/core';
import fetch from 'node-fetch';
import * as qs from '@zcorky/query-string';

import { Stage } from './passport';

export type IStrategyProfile = {
  id: string;
};

export interface IStrategyOptions {
  /**
   * get user by strategy unique id, used for ctx.user when authorized
   * 
   * @param ctx context
   * @param strategy strategy name
   * @param profile user profile from oauth server, profile.id should be unique id
   * @param stage passport stage
   * 
   * @example
   *   new Strategy({
   *     getUserByStrategyProfile(ctx, strategy, profile, stage) {
   *        return UserModel.findOneOrCreate(...);
   *     },
   *   });
   * 
   *   new Strategy({
   *     getUserByStrategyProfile(ctx, strategy, profile, stage) {
   *        // authorize stage
   *        if (stage === Stage.authorize) {
   *          return UserModel.findOneOrCreate(...);
   *        }
   *        
   *        // verify stage
   *        return UserModel.findOne(...);
   *     },
   *   });
   */
  getUserByStrategyProfile(ctx: Context, strategy: string, profile: IStrategyProfile, stage: Stage): Promise<User>;
}

export abstract class Strategy {
  constructor(private readonly strategyOptions: IStrategyOptions) {}
  /**
   * get user by strategy profile
   *  which is the same as strategyOptions.getUserByStrategyProfile, but strategyOptions type is private
   *  @TODO
   * 
   * @param ctx context
   * @param strategy strategy name
   * @param profile stategyprofile
   * @param stage passport stage
   */
  public getUserByStrategyProfile(ctx: Context, strategy: string, profile: IStrategyProfile, stage: Stage): Promise<User> {
    return this.strategyOptions.getUserByStrategyProfile(ctx, strategy, profile, stage);
  }

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
   * @returns user profile from auth server, tips: the user profile is not equal to the getUser, but it is for getUser
   */
  public abstract callback(ctx: Context): Promise<IStrategyProfile>;
}

export interface IOauthStrategyOptions extends IStrategyOptions {
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
  constructor(private readonly oauthStrategyOptions: IOauthStrategyOptions) {
    super(oauthStrategyOptions);
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