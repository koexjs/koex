import { Context, User } from '@koex/core';
import fetch from 'node-fetch';
import * as qs from '@zcorky/query-string';

import { Stage } from './passport';

export type IStrategyProfile = {
  id: string;
};

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
export type IGetUserByStrategyProfile = (ctx: Context, strategy: string, profile: IStrategyProfile, stage: Stage) => Promise<User>;

export abstract class Strategy {
  constructor(public readonly getUserByStrategyProfile: IGetUserByStrategyProfile) {}

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