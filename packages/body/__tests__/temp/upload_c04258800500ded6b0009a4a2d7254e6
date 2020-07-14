# router

[![NPM version](https://img.shields.io/npm/v/@koex/router.svg?style=flat)](https://www.npmjs.com/package/@koex/router)
[![Coverage Status](https://img.shields.io/coveralls/koexjs/router.svg?style=flat)](https://coveralls.io/r/koexjs/router)
[![Dependencies](https://img.shields.io/david/koexjs/router.svg)](https://github.com/koexjs/router)
[![Build Status](https://travis-ci.com/koexjs/router.svg?branch=master)](https://travis-ci.com/koexjs/router)
![license](https://img.shields.io/github/license/koexjs/router.svg)
[![issues](https://img.shields.io/github/issues/koexjs/router.svg)](https://github.com/koexjs/router/issues)
> Simple Router for Koa

### Install

```
$ npm install @koex/router
```

### Usage

```javascript
// See more in test
import * as router from '@koex/router';

import * as Koa from 'koa';
const app = new Koa();

app.use(router.get('/', async (ctx) => {
  ctx.body = 'home';
}));

app.use(router.get('/health', async (ctx) => {
  ctx.status = 200;
  ctx.body = 'ok';
}));

app.use(router.get('/product/:pid', async (ctx) => {
  ctx.body = ctx.params.pid;
}));

// support middlewares for router
const md5 = crypto.createHash('md5').update('123').digest('hex');

const responseTime = async (ctx, next) => {
  const start = Date.now();
  await next();
  ctx.set('X-Response-Time', Date.now() - start);
};

const requestId = async (ctx, next) => {
  await next();
  const id = md5(ctx.url + Date.now());
  ctx.set('X-Request-Id', id);
};

const handler = async (ctx) => {
  ctx.body = ctx.params.pid + ': ' + ctx.params.cid;
};

app.use(router.get('/product/:pid/:cid', responseTime, requestId, handler));

// fallback
app.use(async (ctx) => {
  ctx.body = {
    name: 'name',
    value: 'value',
  };
});

app.listen(8000, '0.0.0.0', () => {
  console.log('koa server start at port: 8000');
});
```

### Related
* [koa-router](https://github.com/alexmingoia/koa-router)
* [koa-route](https://github.com/koajs/route)
* [koa-compose](https://github.com/koajs/compose)