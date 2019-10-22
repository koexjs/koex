# static

[![NPM version](https://img.shields.io/npm/v/@koex/static.svg?style=flat)](https://www.npmjs.com/package/@koex/static)
[![Coverage Status](https://img.shields.io/coveralls/koexjs/static.svg?style=flat)](https://coveralls.io/r/koexjs/static)
[![Dependencies](https://img.shields.io/david/koexjs/static.svg)](https://github.com/koexjs/static)
[![Build Status](https://travis-ci.com/koexjs/static.svg?branch=master)](https://travis-ci.com/koexjs/static)
![license](https://img.shields.io/github/license/koexjs/static.svg)
[![issues](https://img.shields.io/github/issues/koexjs/static.svg)](https://github.com/koexjs/static/issues)

> static for koa extend. used as public assets or static assets.

### Install

```
$ npm install @koex/static
```

### Usage

```javascript
// See more in test
import staticCache from '@koex/static';

import * as Koa from 'koa';
const app = new Koa();

app.use(staticCache('/static', {
  dir: path.join(__dirname, './public'),
}));

app.listen(8000, '0.0.0.0', () => {
  console.log('koa server start at port: 8000');
});
```

### Related
* [koa-static-cache](https://github.com/koajs/static-cache)
* [express.static/serve-static](https://github.com/expressjs/serve-static)