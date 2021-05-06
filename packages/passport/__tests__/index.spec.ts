import * as request from 'supertest';
import App, { Context } from '@koex/core';
import passport, { Strategy, StandardToken } from '../src/index';

passport.serializeUser(async (user) => {
  // serialize user to id
  return user.id;
});

passport.descrializeUser(async (id) => {
  // find(descrialize) user by id
  return {
    id,
  };
});

class LocalStrategy extends Strategy<
  any,
  { username: string; password: string }
> {
  public async user(id: string) {
    return {
      id,
    };
  }

  public async authenticate(ctx: Context) {
    console.log('in authenticate');
    ctx.redirect(`/auth/local/callback?code=code`);
    // @TODO should request
    // ctx.request('/auth/local/callback', { username, passport })
  }

  public async callback(ctx: Context) {
    return {
      access_token: 'a access token',
    };
  }

  public async getProfile(ctx: Context, token: StandardToken) {
    return {
      username: ((ctx.request as any).body || {}).username as string,
      password: ((ctx.request as any).body || {}).password as string,
    };
  }

  public async refreshToken(ctx: Context, refreshTokenString: string) {
    return {
      access_token: 'a refresh token',
    };
  }
}

describe('@koex/passport', () => {
  const app = new App();

  passport.getToken(async (ctx) => {
    const token = {
      accessToken: 'accessToken',
      refreshToken: 'refreshToken',
    };

    console.log('getToken:', token);

    return token;
  });

  passport.setToken(async (ctx, token) => {
    console.log('setToken:', token.accessToken, token.refreshToken);
  });

  passport.use(
    'local',
    new LocalStrategy(async (ctx, token, profile) => {
      return profile;
    }),
  );

  app.keys = ['secret'];

  app.all('/health', async (ctx) => {
    ctx.status = 200;
  });

  app.use(async (ctx, next) => {
    try {
      return await next();
    } catch (error) {
      const status = error.status || 500;
      const message = error.message || 'Internal Server Error';

      ctx.status = status;
      ctx.body = {
        status,
        message,
        timestamps: new Date(),
      };
    }
  });

  app.use(
    passport.initialize({
      excludePaths: ['/auth/(.*)', '/none-auth/(.*)', '/login', '/logout'],
      async onUnauthorized(ctx) {
        ctx.redirect('/login');
      },
    }),
  );

  app.get('/auth/:strategy', passport.authenticate());
  app.get(
    '/auth/:strategy/callback',
    passport.callback({
      async onFail(error, ctx, next) {
        console.error('授权失败', error.message);
        ctx.throw(500, '授权失败');
      },
    }),
    async (ctx) => {
      ctx.redirect('/');
    },
  );
  app.get('/none-auth/:none-strategy', passport.authenticate());
  app.get(
    '/none-auth/:none-strategy/callback',
    passport.callback({
      async onFail(error, ctx, next) {
        console.error('授权失败', error.message);
        ctx.throw(500, '授权失败');
      },
    }),
    async (ctx) => {
      ctx.redirect('/');
    },
  );
  app.get('/login', passport.login());
  app.get('/logout', passport.logout());

  it('health', async () => {
    await request(app.callback()).get('/health').expect(200);
  });

  it('home', async () => {
    await request(app.callback())
      .get('/')
      .expect(302)
      .expect('Location', '/login')
      .then((response) => {
        // console.log(response.header);
        expect(response.header['location']).toEqual('/login');
      });
  });

  it('authenticate', async () => {
    await request(app.callback())
      .get('/auth/local')
      .expect(302)
      .expect('Location', '/auth/local/callback?code=code')
      .then((response) => {
        // console.log(response.header);
      });
  });

  it('callback', async () => {
    await request(app.callback())
      .get('/auth/local/callback?access_token=xxx')
      .expect(302)
      .expect('Location', '/')
      .then((response) => {
        // console.log(response.header);
        // expect(response.body).toEqual({
        //   access_token: 'xxx',
        // });
      });
  });

  it('login', async () => {
    await request(app.callback())
      .get('/login')
      .expect(302)
      .expect('Location', '/login/local')
      .then((response) => {
        // console.log(response.header);
      });
  });

  it('logout', async () => {
    await request(app.callback())
      .get('/logout')
      .expect(302)
      .expect('Location', '/')
      .then((response) => {
        // console.log(response.header);
      });
  });

  // it('login success', async () => {
  //   await request(app.callback())
  //     .get('/')
  //     .expect(302)
  //     .expect('Location', '/login')
  //     .get('/')
  //     .expect(200);
  // }

  it('authenticate invalid strategy', async () => {
    await request(app.callback())
      .get('/auth/invalid-strategy')
      .expect(500)
      .then((response) => {
        // console.log(response.header);
      });
  });

  it('authenticate no strategy provided', async () => {
    await request(app.callback())
      .get('/none-auth/invalid-strategy')
      .expect(500)
      .then((response) => {
        // console.log(response.header);
      });
  });

  it('callback invalid strategy', async () => {
    await request(app.callback())
      .get('/auth/invalid-strategy/callback?access_token=xxx')
      .expect(500)
      // .expect('Location', '/')
      .then((response) => {
        // console.log(response.header);
        // expect(response.body).toEqual({
        //   access_token: 'xxx',
        // });
      });
  });

  it('callback no strategy provided', async () => {
    await request(app.callback())
      .get('/none-auth/non-strategy/callback?access_token=xxx')
      .expect(500)
      // .expect('Location', '/')
      .then((response) => {
        // console.log(response.header);
        // expect(response.body).toEqual({
        //   access_token: 'xxx',
        // });
      });
  });
});
