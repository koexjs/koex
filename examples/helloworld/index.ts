import App from '@koex/core';

const app = new App();

app.get('/health', async (ctx) => {
  ctx.status = 200;
});

app.get('/', async (ctx) => {
  ctx.body = 'hello, world';
});

app.listen(9999, '0.0.0.0', () => {
  console.log('server start at http://127.0.0.1:9999.');
});
