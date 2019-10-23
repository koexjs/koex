import * as request from 'supertest';
import App, { Context } from '@koex/core';
import passport, { IStrategy } from '../src/index';

class LocalStrategy implements IStrategy {
  public async user(id: string) {
    return {
      id,
    };
  }

  public async authenticate(ctx: Context) {
    console.log('in authenticate');
    ctx.redirect(`/auth/local/callback?code=code`);
  }

  public async callback(ctx: Context) {
    console.log('in callback');
    return '666';
  }
}

describe("@koex/passport", () => {
  const app = new App();

  passport.use('local', new LocalStrategy());

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

  app.use(passport.initialize({
    excludePaths: [
      '/auth/(.*)',
      '/none-auth/(.*)',
      '/login',
      '/logout',
    ],
    async onUnauthorization(ctx) {
      ctx.redirect('/login');
    },
  }));

  app.get('/auth/:strategy', passport.authenticate());
  app.get('/auth/:strategy/callback', passport.callback(), async (ctx) => {
    ctx.redirect('/');
  });
  app.get('/none-auth/:none-strategy', passport.authenticate());
  app.get('/none-auth/:none-strategy/callback', passport.callback(), async (ctx) => {
    ctx.redirect('/');
  });
  app.get('/login', passport.login());
  app.get('/logout', passport.logout());

  it('health', async () => {
    await request(app.callback())
      .get('/health')
      .expect(200);
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
      .expect('Location', '/auth/local')
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

describe("@koex/passport with options", () => {
  const app = new App();

  passport.use('local', new LocalStrategy());

  app.keys = ['secret'];

  app.all('/health', async (ctx) => {
    ctx.status = 200;
  });

  app.use(passport.initialize({
    excludePaths: [
      '/auth/(.*)',
      '/login',
      '/logout',
    ],
    async onUnauthorization(ctx) {
      ctx.redirect('/login');
    },
  }));

  app.get('/auth/:strategy', passport.authenticate());
  app.get('/auth/:strategy/callback', passport.callback(), async (ctx) => {
    ctx.redirect('/');
  });
  app.get('/login', passport.login({
    async render(ctx) {
      ctx.body = 'login page'
    },
  }));
  app.get('/logout', passport.logout({
    async render(ctx) {
      ctx.body = 'logout page';
    },
  }));

  it('login', async () => {
    await request(app.callback())
      .get('/login')
      .expect(200)
      .then((response) => {
        // console.log(response.header);
      });
  });

  it('logout', async () => {
    await request(app.callback())
      .get('/logout')
      .expect(200)
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
});
