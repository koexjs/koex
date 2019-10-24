import { Context, Middleware } from '@koex/core';
import * as pathToRegexp from 'path-to-regexp';

import { Strategy } from './strategy';
import { Session } from './session';

declare module '@koex/core' {
  export interface User {
    id: string;
    username?: string;
    nickname?: string;
    email?: string;
    [key: string]: any;
  }

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

export interface LoginOptions {
  render?(ctx: Context): Promise<void>;
  redirect?: string;
}

export interface LogoutOptions extends LoginOptions {
 
}

export enum Stage {
  authorize = 'authorize',
  verify = 'verify',
};

export interface IPassport {
  use(name: string, strategy: Strategy): void;
  initialize(options: InitializeOptions): Middleware<Context>;
  authenticate(): Middleware<Context>;
  callback(): Middleware<Context>;
  login(options?: LoginOptions): Middleware<Context>;
  logout(options?: LogoutOptions): Middleware<Context>;
}

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

  public use(name: string, strategy: Strategy) {
    this.strategies[name] = strategy;
  }

  public initialize(options: InitializeOptions): Middleware<Context> {
    const exclude = options.excludePaths.map(pattern => pathToRegexp(pattern));

    return async (ctx, next) => {
      this.session = new Session(ctx, {
        getUserBySessionProfile: async (strategyName, profileId) => {
          const strategy = this.strategies[strategyName];

          const profile = { id: profileId };
          return strategy.getUserByStrategyProfile(ctx, strategyName, profile, Stage.verify);
        },
      });

      if (exclude.some(regexp => !!regexp.exec(ctx.path))) {
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

      const user = await this.session.user();
      // readonly, use it instead of ctx.user = user
      defineReadonlyProperties(ctx, { user });

      return next();
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

      await next();
    };
  }

  public callback(): Middleware<Context> {
    return async (ctx, next) => {
      const strategyName = ctx.params.strategy; // @TODO
      const strategy = this.strategies[strategyName];

      if (!strategyName) {
        ctx.throw(500, `No Passport Strategy Name Provided`);
      }

      if (!strategy) {
        ctx.throw(500, `No Passport Strategy provided named ${strategyName}`);
      }

      const profile = await strategy.callback(ctx);

      this.session.set(strategyName, profile.id);

      const user = await strategy.getUserByStrategyProfile(ctx, strategyName, profile, Stage.authorize);

      // readonly, use it instead of ctx.user = user
      defineReadonlyProperties(ctx, { user });

      await next();
    };
  }

  public login(options?: LoginOptions): Middleware<Context> {
    return async (ctx) => {
      if (options && options.render) {
        return options.render(ctx);
      }

      const redirect = options && options.redirect || '/auth/local'; // @TODO
      ctx.redirect(redirect);
    };
  }

  public logout(options?: LogoutOptions): Middleware<Context> {
    return async (ctx) => {
      this.session.remove();

      if (options && options.render) {
        return options.render(ctx);
      }

      const redirect = options && options.redirect || '/'; // @TODO
      ctx.redirect(redirect);
    };
  }
}

export const passport = new Passport();

function defineReadonlyProperties(target: Object, properties: Record<string, any>) {
  for (const propertyKey in properties) {
    Object.defineProperty(target, propertyKey, {
      enumerable: true,
      get() {
        return properties[propertyKey];
      },
    })
  }
}