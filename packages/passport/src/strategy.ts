import { Context } from '@koex/core';

import { User, StandardToken } from './passport';

export type IStrategyCallback<IStrategyToken, IStrategyProfile> = {
  token: IStrategyToken;
  profile: IStrategyProfile;
};

// export type IStandardToken = {
//   // // @Github
//   // access_token: string;
//   // scope?: string;
//   // token_type?: string; // bearer
//   // //
//   // refresh_token?: string;
  
//   accessToken: string;

//   refreshToken?: string;
// };

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
export type IVerify<IProfile> = (
  ctx: Context,
  token: StandardToken,
  profile: IProfile,
) => Promise<User>;

export type ITransformToStandardToken<StrategyToken = any> = (ctx: Context, token: StrategyToken, strategy: string) => Promise<StandardToken>;

const DEFAULT_TRANSFORM_TO_STANDARD_TOKEN_FN: ITransformToStandardToken = async (ctx, token, strategy) => {
  if (!('access_token' in token)) {
    return ctx.throw(500, {
      code: 5000000,
      message: `access_token not in token object, maybe you should custom transformToStandardToken function for strategy(${strategy})`,
    });
  }

  return {
    accessToken: (token as any).access_token,
    refreshToken: (token as any).refresh_token,
  };
};

export abstract class Strategy<IToken = any, IProfile = any> {
  public transformToStandardToken: ITransformToStandardToken<IToken> = DEFAULT_TRANSFORM_TO_STANDARD_TOKEN_FN;

  constructor(
    public readonly verify: IVerify<IProfile>,
    // @TODO this will cause error
    // public readonly transformToStandardToken?: ITransformToStandardToken<IToken> = DEFAULT_TRANSFORM_TO_STANDARD_TOKEN_FN, 
    // public transformToStandardToken?: ITransformToStandardToken<IToken>, 
  ) {
    // // @TODO
    // this.transformToStandardToken = transformToStandardToken || DEFAULT_TRANSFORM_TO_STANDARD_TOKEN_FN;

    // console.log('Strategy.transformToStandardToken:', transformToStandardToken, DEFAULT_TRANSFORM_TO_STANDARD_TOKEN_FN, this.transformToStandardToken)
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
  public abstract callback(
    ctx: Context,
  ): Promise<IToken>;

  /**
   * use token to get user profile
   * 
   * @param token token
   */
  public abstract getProfile(ctx: Context, token: IToken): Promise<IProfile>;

  /**
   * refresh token logic by refresh_token grant
   * 
   * @param ctx context
   * @return refreshed token
   */
  // public abstract refreshToken?(
  //   ctx: Context,
  //   refreshTokenString: string,
  // ): Promise<IToken>;
  public refreshToken?(
    ctx: Context,
    refreshTokenString: string,
  ): Promise<IToken>;
}
