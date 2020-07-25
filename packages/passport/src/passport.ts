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
  authenticate(): Middleware<Context>;
  callback(options: CallbackOptions): Middleware<Context>;
  login(options?: LoginOptions): Middleware<Context>;
  logout(options?: LogoutOptions): Middleware<Context>;
}

export type SerializeUser = (user: User, ctx: Context) => Promise<string>;

export type DeserializeUser = (id: string, ctx: Context) => Promise<User>;

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
      const id = this.session.get();

      // deserializeUser maybe 401 when get user from remote
      try {
        const user = await this._deserializeUser(id, ctx);
        // readonly, use it instead of ctx.user = user
        defineReadonlyProperties(ctx, { user });

        return next();
      } catch (error) {
        if (error.status === 401) {
          const acceptJSON = ctx.accepts(['html', 'json']) === 'json';
          return options.onUnauthorized(ctx, acceptJSON);
        }

        throw error;
      }
    };
  }

  public authenticate(): Middleware<Context> {
    return async (ctx, next) => {
      const strategyName = ctx.params.strategy; // @TODO
      const strategy = this.strategies[strategyName];

      if (!strategyName) {
        ctx.throw(500, `No Passport Strategy Name Provided`);
      }

      if (!strategy) {
        ctx.throw(500, `No Passport Strategy provided named ${strategyName}`);
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
          ctx.throw(500, `No Passport Strategy Name Provided`, {
            strategy: strategyName,
            reasonBy: 'self',
          });
        }

        if (!strategy) {
          ctx.throw(
            500,
            `No Passport Strategy provided named ${strategyName}`,
            { strategy: strategyName, reasonBy: 'self' },
          );
        }

        const { token, profile } = await strategy.callback(ctx);

        const user = await strategy.verify(ctx, token, profile);

        const id = await this._serializeUser(user, ctx);

        // @session
        this.session.set(id);

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

  public login(options?: LoginOptions): Middleware<Context> {
    return async (ctx) => {
      if (options && options.render) {
        return options.render(ctx);
      }

      const redirect = (options && options.redirect) || '/login/local'; // @TODO
      ctx.redirect(redirect);
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
