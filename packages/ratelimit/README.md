# ratelimit

[![NPM version](https://img.shields.io/npm/v/@koex/ratelimit.svg?style=flat)](https://www.npmjs.com/package/@koex/ratelimit)
[![Coverage Status](https://img.shields.io/coveralls/koexjs/ratelimit.svg?style=flat)](https://coveralls.io/r/koexjs/ratelimit)
[![Dependencies](https://img.shields.io/david/koexjs/ratelimit.svg)](https://github.com/koexjs/ratelimit)
[![Build Status](https://travis-ci.com/koexjs/ratelimit.svg?branch=master)](https://travis-ci.com/koexjs/ratelimit)
![license](https://img.shields.io/github/license/koexjs/ratelimit.svg)
[![issues](https://img.shields.io/github/issues/koexjs/ratelimit.svg)](https://github.com/koexjs/ratelimit/issues)

> ratelimit for koa extend

### Install

```
$ npm install @koex/ratelimit
```

### Usage

```javascript
// See more in test
import ratelimit from '@koex/ratelimit';

import * as Koa from 'koa';
const app = new Koa();
app.use(ratelimit());
app.use(async (ctx) => {
  if (ctx.path === '/') {
    ctx.body = 'hello, world';
  } else if (ctx.path === '/json') {
    ctx.body = {
      name: 'name',
      value: 'value',
    };
  }
});

app.listen(8000, '0.0.0.0', () => {
  console.log('koa server start');
});
```

### Related
* [ratelimit](https://github.com/koajs/ratelimit)
