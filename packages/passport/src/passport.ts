import { Context, Middleware } from '@koex/core';
import * as assert from 'assert';
import * as pathToRegexp from 'path-to-regexp';

import { Strategy } from './strategy';
import { Session } from './session';

export interface User {
  id?: string;
  // username?: string;
  // nickname?: string;
  // email?: string;
  [key: string]: any;
}

export type StandardToken = {
  accessToken: string;
  refreshToken?: string;
  // @TODO for extends
  [key: string]: any;
};

declare module '@koex/core' {
  export interface Context {
    readonly user: User;
  }
}

export interface InitializeOptions {
  /**
   * passport exclude paths
   */
  excludePaths: string[];

  /**
   * Max Session Age, Unit: milliseconds, Default: 7 days
   */
  maxAge?: number;

  /**
   * On Unauthorized
   *  which means it requires login, so you can do
   *    if acceptJSON, return 401, Unauthorized Message
   *    else return 302, go to login page to ask authorize
   *
   * @param ctx context
   * @param acceptJSON client wants to json response
   */
  onUnauthorized(ctx: Context, acceptJSON: boolean): Promise<void>;
}

export interface CallbackOptions {
  onFail(error: Error, ctx: Context, next: any): Promise<void>;
}

export interface LoginOptions {
  render?(ctx: Context): Promise<void>;
  redirect?: string;
}

export interface LogoutOptions extends LoginOptions {}

export interface IPassport {
  use(name: string, strategy: Strategy): void;
  initialize(options: InitializeOptions): Middleware<Context>;
  authenticate(strategy?: string): Middleware<Context>;
  callback(options: CallbackOptions): Middleware<Context>;
  login(options?: LoginOptions): Middleware<Context>;
  logout(options?: LogoutOptions): Middleware<Context>;
}

export type SerializeUser = (user: User, ctx: Context) => Promise<string>;

export type DeserializeUser = (id: string, ctx: Context) => Promise<User>;

// export type TransformToStandardToken = <StrategyToken = any>(ctx: Context, token: StrategyToken, strategy: string) => Promise<StandardToken>;
export type GetToken = (ctx: Context) => Promise<StandardToken>;
export type SetToken = (ctx: Context, token: StandardToken) => Promise<void>;

// const DEFAULT_TRANSFORM_TO_STANDARD_TOKEN_FN: TransformToStandardToken = async (ctx, token, strategy) => {
//   if (!('access_token' in token)) {
//     return ctx.throw(500, {
//       code: 5000000,
//       message: `access_token not in token object, maybe you should custom transformToStandardToken function for strategy(${strategy})`,
//     });
//   }

//   return {
//     accessToken: (token as any).access_token,
//     refreshToken: (token as any).refresh_token,
//   };
// };

/**
 * Passport
 *
 * @example
 *  passport.use('local', new LocalStrategy({
 *   client_id: 'xxx',
 *   client_secret: 'xxx',
 *   scope: 'xxxx',
 * }));
 *
 *  passport.use('github', new GithubStrategy({
 *    client_id: 'xxx',
 *    client_secret: 'xxx',
 *    scope: 'xxxx',
 *  }));
 *
 *  app.get('/auth/:strategy', passport.authenticate());
 *  app.get('/auth/:strategy/callback', passport.callback());
 *
 *  app.get('/login', passport.login());
 *  app.get('/logout', passport.logout());
 *
 *  or
 *
 *  app.use(passport.router());
 */
export class Passport implements IPassport {
  private strategies: Record<string, Strategy> = {};
  private session: Session;

  private _serializeUser: SerializeUser;
  private _deserializeUser: DeserializeUser;

  //
  // private _transformToStandardToken: TransformToStandardToken = DEFAULT_TRANSFORM_TO_STANDARD_TOKEN_FN;
  private _getToken: GetToken;
  private _setToken: SetToken;

  public use(name: string, strategy: Strategy) {
    this.strategies[name] = strategy;
  }

  public initialize(options: InitializeOptions): Middleware<Context> {
    const exclude = options.excludePaths.map((pattern) =>
      pathToRegexp(pattern),
    );

    assert(this._serializeUser, 'You should call passport.serializeUser first');
    assert(
      this._deserializeUser,
      'You should call passport.deserializeUser first',
    );
    assert(this._getToken, 'You should call passport.getToken first');
    assert(this._setToken, 'You should call passport.setT_setToken first');

    return async (ctx, next) => {
      this.session = new Session(ctx, {
        maxAge: options.maxAge,
      });

      if (exclude.some((regexp) => !!regexp.exec(ctx.path))) {
        return next();
      }

      // need login
      //  @1 accept html => go /login
      //  @2 accept json => show 401
      if (!this.session.isAuthenticated) {
        // @TODO
        const acceptJSON = ctx.accepts(['html', 'json']) === 'json';

        return options.onUnauthorized(ctx, acceptJSON);
      }

      // @session
      const { id, strategy: strategyName } = this.session.get();

      // deserializeUser maybe 401 when get user from remote
      try {
        const user = await this._deserializeUser(id, ctx);
        // readonly, use it instead of ctx.user = user
        defineReadonlyProperties(ctx, { user });

        return next();
      } catch (error) {
        if (error.status === 401) {
          // try to refresh token first
          try {
            const { refreshToken } = await this._getToken(ctx);
            const strategy = this.strategies[strategyName];

            ctx.logger.debug(
              'try to get refresh_token:',
              !!refreshToken && 'found',
              refreshToken,
              strategyName,
              'has refreshToken fn:',
              !!strategy.refreshToken,
            );

            if (refreshToken && strategy && strategy.refreshToken) {
              const token = await strategy.refreshToken!(ctx, refreshToken);
              const profile = await strategy.getProfile(ctx, token);
              ctx.logger.debug(
                'current profile by refresh token: ',
                JSON.stringify(profile),
              );

              // set token should before user, because you should use token for user
              await this._setToken(ctx, token);

              const user = await strategy.verify(ctx, token, profile);

              const id = await this._serializeUser(user, ctx);

              // @session
              this.session.set(id, strategyName);

              // readonly, use it instead of ctx.user = user
              defineReadonlyProperties(ctx, { user });

              return await next();
            }
          } catch (error) {
            ctx.logger.debug('refreshToken error:', error.message);

            const acceptJSON = ctx.accepts(['html', 'json']) === 'json';
            return options.onUnauthorized(ctx, acceptJSON);
          }

          const acceptJSON = ctx.accepts(['html', 'json']) === 'json';
          return options.onUnauthorized(ctx, acceptJSON);
        }

        throw error;
      }
    };
  }

  public authenticate(_strategy?: string): Middleware<Context> {
    return async (ctx, next) => {
      const strategyName = _strategy || ctx.params.strategy; // @TODO
      const strategy = this.strategies[strategyName];

      if (!strategyName) {
        ctx.throw(500, `No Passport Strategy Name Provided in Authencate`);
      }

      if (!strategy) {
        ctx.throw(
          500,
          `No Passport Strategy provided named ${strategyName} in Authencate`,
        );
      }

      await strategy.authenticate(ctx);
    };
  }

  public callback(options: CallbackOptions): Middleware<Context> {
    return async (ctx, next) => {
      try {
        const strategyName = ctx.params.strategy; // @TODO
        const strategy = this.strategies[strategyName];

        if (!strategyName) {
          ctx.throw(500, `No Passport Strategy Name Provided in Callback`, {
            strategy: strategyName,
            reasonBy: 'self',
          });
        }

        if (!strategy) {
          ctx.throw(
            500,
            `No Passport Strategy provided named ${strategyName} in Callback`,
            { strategy: strategyName, reasonBy: 'self' },
          );
        }

        // const { token, profile } = await strategy.callback(ctx);
        const token = await strategy.callback(ctx);
        const profile = await strategy.getProfile(ctx, token);

        const standardToken = await strategy.transformToStandardToken(
          ctx,
          token,
          strategyName,
        );

        // set token should before user, because you should use token for user
        await this._setToken(ctx, token);

        const user = await strategy.verify(ctx, standardToken, profile);

        const id = await this._serializeUser(user, ctx);

        // @session
        this.session.set(id, strategyName);

        // readonly, use it instead of ctx.user = user
        defineReadonlyProperties(ctx, { user });

        return await next();
      } catch (error) {
        return await options.onFail(error, ctx, next);
      }
    };
  }

  public serializeUser(fn: SerializeUser) {
    this._serializeUser = fn;
  }

  public descrializeUser(fn: DeserializeUser) {
    this._deserializeUser = fn;
  }

  public getToken(fn: GetToken) {
    this._getToken = fn;
  }

  public setToken(fn: SetToken) {
    this._setToken = fn;
  }

  // public transformToStandardToken(fn: TransformToStandardToken) {
  //   this._transformToStandardToken = fn;
  // }

  public login(options?: LoginOptions): Middleware<Context> {
    return async (ctx) => {
      if (options && options.render) {
        return options.render(ctx);
      }

      const redirect = (options && options.redirect) || '/login/local'; // @TODO
      console.log('visit login:', redirect);
      return ctx.redirect(redirect);
    };
  }

  public logout(options?: LogoutOptions): Middleware<Context> {
    return async (ctx) => {
      // @session
      this.session.remove();

      if (options && options.render) {
        return options.render(ctx);
      }

      const redirect = (options && options.redirect) || '/'; // @TODO
      ctx.redirect(redirect);
    };
  }
}

export const passport = new Passport();

function defineReadonlyProperties(
  target: Object,
  properties: Record<string, any>,
) {
  for (const propertyKey in properties) {
    Object.defineProperty(target, propertyKey, {
      enumerable: true,
      get() {
        return properties[propertyKey];
      },
    });
  }
}
