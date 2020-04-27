import { Context } from '@koex/core';
import { User } from './passport';

export type IStrategyCallback<IStrategyToken, IStrategyProfile> = {
  token: IStrategyToken;
  profile: IStrategyProfile;
}

/**
 * get user by strategy unique id, used for ctx.user when authorized
 * 
 * @param ctx context
 * @param token access token
 * @param profile user profile from oauth server, profile.id should be unique id
 * 
 * @example
 *   new Strategy({
 *     async verify(ctx, token, profile) {
 *        return UserModel.findOneOrCreate(...);
 *     },
 *   });
 * 
 *   new Strategy({
 *     async verify(ctx, token, profile) {
 *        return UserModel.findOneOrCreateByConnection({
 *          type: 'github',
 *          value: profile.id,
 *        });
 *     },
 *   });
 */
export type IVerify<IToken, IProfile> = (ctx: Context, token: IToken, profile: IProfile) => Promise<User>;

export abstract class Strategy<IToken = any, IProfile = any> {
  constructor(public readonly verify: IVerify<IToken, IProfile>) {}

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
  public abstract callback(ctx: Context): Promise<IStrategyCallback<IToken, IProfile>>;
}