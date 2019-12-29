import App, { Context } from '@koex/core';
import { format } from '@zodash/format';
import { passport, InitializeOptions } from './passport';
import { RedirectSession } from './session';

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
   * On Unauthorized, verify login
   */
  onUnauthorized?: InitializeOptions['onUnauthorized'];

  /**
   * On Authorized
   */
  onAuthorized?(ctx: Context, options: IUsePassport): Promise<any>;
}

const defaultOnUnauthorized = async (ctx: Context, acceptJSON: boolean) => {
  if (acceptJSON) {
    // @TODO
    ctx.status = 401;
    ctx.body = {
      code: 401,
      message: 'Unauthorized', 
    };
    return ;
  }

  // use ctx.url instead of ctx.path, should keep path + search
  const ref = ctx.url || '/';
  // @REDIRECT_1 remember referer uri
  const redirectSession = new RedirectSession(ctx);
  redirectSession.set(ref);

  return ctx.redirect(`/login?ref=${encodeURIComponent(ref)}`);
}

const defaultOnAuthorized = async (ctx: Context, options: IUsePassport) => {
  // @REDIRECT_2 get referer uri, need to be redirect
  const redirectSession = new RedirectSession(ctx);
  const ref = redirectSession.get();

  const ignores = [
    options.loginPath,
    options.logoutPath,
    options.authPathPrefix, // @TODO
  ];

  // no ref
  if (!ref) {
    return ctx.redirect('/');
  }

  // if ref not starts with /, maybe attack
  // @TODO but which ref set is ctx.url, it is not able to do not starts with /
  if (!ref.startsWith('/')) {
    return ctx.redirect('/');
  }

  // if ignores hits, go home
  if (ignores.includes(ref)) {
    return ctx.redirect('/');
  }

  return ctx.redirect(ref);
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
  let _options = options || {} as IUsePassport;

  const authPathPrefix = _options.authPathPrefix || '/oauth';
  const loginPath = _options.loginPath || '/login';
  const logoutPath = _options.logoutPath || '/logout';
  const authenticatePath = format(authenticatePathPattern, { prefix: authPathPrefix });
  const callbackPath = format(callbackPathPattern, { prefix: authPathPrefix });
  const excludePaths = _options.excludePaths || [];
  const maxAge = _options.maxAge;

  const onUnauthorized = _options.onUnauthorized || defaultOnUnauthorized;
  const onAuthorized = _options.onAuthorized || defaultOnAuthorized;

  // @TODO
  _options = {
    ..._options,
    authPathPrefix,
    loginPath,
    logoutPath,
    excludePaths,
    maxAge,
    onUnauthorized,
    onAuthorized,
  };

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
    await onAuthorized(ctx, _options);
  });

  // passport login url, you can act redirect or render page
  app.get(loginPath, passport.login({
    async render(ctx) {
      await _options.renderLoginPage(ctx, _options);
    },
  }));
  // passport logout url, you can act redirect or render page
  app.get(logoutPath, passport.logout({
    redirect: loginPath,
  }));
}
