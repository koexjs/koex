import request from 'supertest';
import App, { Context } from '@koex/core';

describe('@koex/passport', () => {
  const app = new App();

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

  it('health', async () => {
    await request(app.callback()).get('/health').expect(200);
  });
});
