const path = require('path');
const crypto = require('crypto');
const Koa = require('@koex/core').default;
const body = require('@koex/body').default;
const logger = require('@koex/logger').default;
const staticCache = require('@koex/static').default;

const fetch = require('node-fetch');
const LRU = require('@zcorky/lru').lru;

const config = require('./config');

// console.log(config);

function cache() {
  const _c = new LRU();
  console.log(_c);
  return async (ctx, next) => {
    ctx.cache = _c;

    return next();
  };
}

const app = new Koa();

app.use(logger());

app.use(cache());

app.use(body());

app.use(staticCache('/', {
  dir: path.join(__dirname, './public'),
  cacheControl: 'no-cache',
  maxAge: 0,
}));

app.use(async (ctx, next) => {
  ctx.logger.debug(ctx.method, ctx.path);
  return next();
});

app.get('/', async ctx => {
  ctx.body = 'Hello, world'
});

const TOKEN = 'thetoken'
app.get('/wechat/signature', async (ctx) => {
    const { signature, timestamp, nonce, echostr }= ctx.query;
    const _s = [TOKEN, timestamp, nonce].sort().join('');

    const sha1 = crypto.createHash('sha1').update(_s).digest('hex');

    if (signature === sha1) {
      ctx.body = echostr;
    } else {
      ctx.body = {
        code: 4010000,
        message: '你不是微信',
      };
    }

  return 
});

function sha1(str) {
  return crypto.createHash('sha1').update(str).digest('hex');
}

// { errcode: number, errmsg: string, access_token: string, expire_in: number }
async function getAccessToken(ctx) {
  const key = 'access_token_object';
  const _cache = ctx.cache.get(key);
  if (_cache) {
    console.log('get cache access_token_object');
    return _cache;
  }

  const url = config.accessTokenUrl
    .replace('{appId}', config.appId)
    .replace('{appSecret}', config.appSecret);

  const access_token_object = await fetch(url).then(res => res.json());
  console.log('access_token_object: ', access_token_object);

  if (!!access_token_object.access_token) {
    ctx.cache.set(key, access_token_object, {
      maxAge: 7200 * 1000,
    });
  }

  return access_token_object;
}

// { errcode: number, errmsg: string, ticket: string, expires_in: number }
async function getJsapiTicket(ctx, accessToken) {
  const key = 'jsapi_token_object';
  const _cache = ctx.cache.get(key);
  if (_cache) {
    console.log('get cache jsapi_token_object');
    return _cache;
  }

  const url = config.jsapiTicketUrl
    .replace('{accessToken}', accessToken);

  console.log('jsapiTicketUrl:', url);

  const jsapi_token_object = await fetch(url).then(res => res.json());
  console.log('jsapi_token_object: ', jsapi_token_object);

  if (!!jsapi_token_object.ticket) {
    ctx.cache.set(key, jsapi_token_object, {
      maxAge: 7200 * 1000,
    });
  }

  return jsapi_token_object;
}

async function getJsapiSignature(noncestr, jsapi_ticket, timestamp, url) {
  const data =[
    ['jsapi_ticket', jsapi_ticket],
    ['noncestr', noncestr],
    ['timestamp', timestamp],
    ['url', url],
  ];

  const str = data.map(e => `${e[0]}=${e[1]}`).join('&');

  console.log('signature str: ', str);
  return sha1(str);
}

async function createNoncestr() {
  return Math.random().toString(36).substr(2, 15);
}

async function createTimestamp() {
  return ~~(+new Date() / 1000);
}

async function getSignPackage(ctx, url) {
  const { access_token } = await getAccessToken(ctx);

  const { ticket: jsapi_ticket } = await getJsapiTicket(ctx, access_token);
  const nonceStr = await createNoncestr();
  const timestamp = await createTimestamp();

  const signature = await getJsapiSignature(
    nonceStr,
    jsapi_ticket,
    timestamp,
    url,
  );

  return {
    appId: config.appId,
    timestamp,
    nonceStr,
    signature,
    url,
    jsapi_ticket,
  };
}

app.get('/wechat/access_token', async (ctx) => {
  ctx.body = await getAccessToken();
});

app.post('/wechat/jsapi_sign', async (ctx) => {
  const { url } = ctx.request.body;
  const sign = await getSignPackage(ctx, url);

  console.log(sign);

  ctx.body = sign;
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`server start http://192.168.199.143:${port} ...`);
});
