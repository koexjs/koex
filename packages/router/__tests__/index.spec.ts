import Koa from 'koa';
import request from 'supertest';
import 'should';

import * as router from '../src';

const { all, get, post, put, patch, del, head, options } = router;

describe('koa router', () => {
  describe('the same path with different methods', () => {
    const app = new Koa();

    app.use(
      get('/', async (ctx) => {
        ctx.body = 'get';
      }),
    );

    app.use(
      post('/', async (ctx) => {
        ctx.body = 'post';
      }),
    );

    app.use(
      put('/', async (ctx) => {
        ctx.body = 'put';
      }),
    );

    app.use(
      patch('/', async (ctx) => {
        ctx.body = 'patch';
      }),
    );

    app.use(
      del('/', async (ctx) => {
        ctx.body = 'delete';
      }),
    );

    app.use(
      head('/', async (ctx) => {
        ctx.status = 200;
      }),
    );

    app.use(
      options('/', async (ctx) => {
        ctx.status = 200;
      }),
    );

    app.use(
      all('/all', async (ctx) => {
        ctx.body = 'ALL /all';
      }),
    );

    app.use((ctx) => {
      ctx.body = 'hello, world';
    });

    it('should get /', async () => {
      await request(app.callback()).get('/').expect(200, 'get');
    });

    it('should post /', async () => {
      await request(app.callback()).post('/').expect(200, 'post');
    });

    it('should put /', async () => {
      await request(app.callback()).put('/').expect(200, 'put');
    });

    it('should patch /', async () => {
      await request(app.callback()).patch('/').expect(200, 'patch');
    });

    it('should delete /', async () => {
      await request(app.callback()).delete('/').expect(200, 'delete');
    });

    it('should head /', async () => {
      await request(app.callback()).head('/').expect(200);
    });

    it('should options /', async () => {
      await request(app.callback()).options('/').expect(200);
    });

    it('should options /', async () => {
      await request(app.callback()).options('/').expect(200);
    });

    it('should all /all', async () => {
      await request(app.callback()).options('/all').expect(200);

      await request(app.callback()).get('/all').expect('ALL /all');

      await request(app.callback()).post('/all').expect('ALL /all');

      await request(app.callback()).put('/all').expect('ALL /all');

      await request(app.callback()).patch('/all').expect('ALL /all');

      await request(app.callback()).del('/all').expect('ALL /all');
    });

    it('should fallback to the last middleware', async () => {
      await request(app.callback()).get('/xxxx').expect(200, 'hello, world');
    });
  });

  describe('should parse params', () => {
    const app = new Koa();

    app.use(
      get('/:id', async (ctx) => {
        ctx.body = ctx.params;
      }),
    );

    app.use(
      get('/:product/:comment', async (ctx) => {
        ctx.body = ctx.params;
      }),
    );

    app.use(
      get('/:product/:comment/:user', async (ctx) => {
        ctx.body = ctx.params;
      }),
    );

    app.use((ctx) => {
      ctx.body = 'hello, world';
    });

    it('should parse one param', async () => {
      await request(app.callback()).get('/xxxx').expect(200, { id: 'xxxx' });
    });

    it('should parse two params', async () => {
      await request(app.callback())
        .get('/a/b')
        .expect(200, { product: 'a', comment: 'b' });
    });

    it('should parse more params', async () => {
      await request(app.callback())
        .get('/a/b/c')
        .expect(200, { product: 'a', comment: 'b', user: 'c' });
    });

    it('should fallback to the last middleware', async () => {
      await request(app.callback()).get('/a/b/c/d').expect(200, 'hello, world');
    });
  });

  describe('should support multiple middlewares', () => {
    const app = new Koa();
    const preMiddleware: Koa.Middleware = async function (ctx, next) {
      ctx.state.pre = 'pre';
      return next();
    };

    const middleware: Koa.Middleware = async function (ctx, next) {
      ctx.state.mid = 'mid';
      await next();
      ctx.set('X-Post-Action1', 'mid');
      ctx.state.mid1 = 'mid1';
    };

    const postMiddleware: Koa.Middleware = async function (ctx, next) {
      await next();
      ctx.set('X-Post-Action2', 'post');
      ctx.state.post = 'post';
    };

    app.use(
      get('/:id', preMiddleware, middleware, postMiddleware, async (ctx) => {
        ctx.state.should.have.property('pre');
        ctx.state.should.have.property('mid');
        ctx.state.should.not.have.property('mid1');
        ctx.state.should.not.have.property('post');

        ctx.body = ctx.params;
      }),
    );

    it('should parse one param', async () => {
      await request(app.callback())
        .get('/xxxx')
        .expect('X-Post-Action1', 'mid')
        .expect('X-Post-Action2', 'post')
        .expect(200, { id: 'xxxx' });
    });
  });

  describe('support router.routes', () => {
    const app = new Koa();
    router.get('/routes/no/path/here', async (ctx) => {
      ctx.body = 'GET /routes/no/path/here';
    });
    router.post('/routes/no/path/here', async (ctx) => {
      ctx.body = 'POST /routes/no/path/here';
    });
    router.put('/routes/no/path/here', async (ctx) => {
      ctx.body = 'PUT /routes/no/path/here';
    });
    router.del('/routes/no/path/here', async (ctx) => {
      ctx.body = 'DELETE /routes/no/path/here';
    });

    app.use(router.routes());

    it('get routes', async () => {
      await request(app.callback())
        .get('/routes/no/path/here')
        .expect(200, 'GET /routes/no/path/here');
    });
    it('post routes', async () => {
      await request(app.callback())
        .post('/routes/no/path/here')
        .expect(200, 'POST /routes/no/path/here');
    });
    it('put routes', async () => {
      await request(app.callback())
        .put('/routes/no/path/here')
        .expect(200, 'PUT /routes/no/path/here');
    });
    it('del routes', async () => {
      await request(app.callback())
        .del('/routes/no/path/here')
        .expect(200, 'DELETE /routes/no/path/here');
    });
    it('patch routes', async () => {
      await request(app.callback())
        .patch('/routes/no/path/here')
        .expect(404, 'Not Found');
    });
  });
});
