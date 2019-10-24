import App, { Context } from '@koex/core';
import { format } from '@zodash/format';
import { passport, InitializeOptions } from './passport';

export interface IUsePassport {
  /**
   * Auth Path Prefix, default: /oauth
   *  => 1 Authentication Path: /oauth/:strategy
   *  => 2 Callback Path: /oauth/:strategy/callback
   */
  authPathPrefix?: string;

  /**
   * Login Path, default: /login
   */
  loginPath?: string;

  /**
   * Logout Path, default: /logout
   */
  logoutPath?: string;

  /**
   * Exclude Paths
   */
  excludePaths?: string[];

  /**
   * Max Session Age, Unit: milliseconds, Default: 7 days
   */
  maxAge?: number;

  /**
   * Render Login Page
   */
  renderLoginPage(ctx: Context, options: IUsePassport): Promise<any>;

  /**
   * On Unauthorized
   */
  onUnauthorized?: InitializeOptions['onUnauthorized'];

  /**
   * On Authorized
   */
  onAuthorized?(ctx: Context): Promise<any>;
}

const defaultOnUnauthorized = async (ctx: Context, acceptJSON: boolean) => {
  if (acceptJSON) {
    // @TODO
    ctx.status = 403;
    ctx.body = {
      code: 403,
      message: 'Unauthorized', 
    };
    return ;
  }

  return ctx.redirect('/login');
}

const defaultOnAuthorized = async (ctx: Context) => {
  ctx.redirect('/');
}

/**
 * Authenticate Path Pattern
 */
const authenticatePathPattern = '{prefix}/:strategy';

/**
 * Callback Path Pattern
 */
const callbackPathPattern = '{prefix}/:strategy/callback';

/**
 * Use Passport, make it easy to use passport
 * 
 * @param app koex app instance
 * @param options use passport options
 */
export function usePassport(app: App, options: IUsePassport) {
  const _options = options || {} as IUsePassport;

  const authPathPrefix = _options.authPathPrefix || '/oauth';
  const loginPath = _options.loginPath || '/login';
  const logoutPath = _options.logoutPath || '/login';
  const authenticatePath = format(authenticatePathPattern, { prefix: authPathPrefix });
  const callbackPath = format(callbackPathPattern, { prefix: authPathPrefix });
  const excludePaths = _options.excludePaths || [];
  const maxAge = _options.maxAge;

  const onUnauthorized = _options.onUnauthorized || defaultOnUnauthorized;
  const onAuthorized = _options.onAuthorized || defaultOnAuthorized;

  // initilaize
  app.use(passport.initialize({
    excludePaths: [
      `${authPathPrefix}/(.*)`,
      loginPath,
      logoutPath,
      ...excludePaths,
    ],
    maxAge,
    onUnauthorized,
  }));

  // oauth flow
  //  @S1 authenticate flow
  app.get(authenticatePath, passport.authenticate());
  //  @S2 callback flow
  app.get(callbackPath, passport.callback(), async (ctx: Context) => {
    await onAuthorized(ctx);
  });

  // passport login url, you can act redirect or render page
  app.get(loginPath, passport.login({
    async render(ctx) {
      await _options.renderLoginPage(ctx, options);
    },
  }));
  // passport logout url, you can act redirect or render page
  app.get(logoutPath, passport.logout({
    redirect: loginPath,
  }));
}