import * as path from 'path';

import * as Koa from 'koa';
import * as request from 'supertest';
import { get, post } from '@zcorky/koa-router';
import 'should';

import staticCache from '../src';
import { loadFile } from '../src/utils';

describe('koa static', () => {
  describe('only koa-static', () => {

    const app = new Koa();
    const options = {
      dir: path.join(__dirname, '..'),
    };

    app.use(staticCache('/static', options));
    const file = loadFile(path.join(__dirname, '../package.json'), options);
    console.log(file);

    it('server with prefix and dir, visit /static/package.json', async () => {

      await request(app.callback())
        .get('/static/package.json')
        .set('Accept-Encoding', 'gzip')
        .expect('Content-Type', /json/)
        .expect('Cache-Control', /public, max-age=0/)
        .expect('Content-Encoding', 'gzip')
        // .expect('Content-Length', file.length)
        .expect('Etag', file.md5)
        .expect('Last-Modified', `${file.mtime}`)
        .expect('vary', 'Accept-Encoding')
        .expect(200)
        .then(response => {
          response.body.name.should.equal('@koex/static');
        });
    });

    it('server with prefix and dir, visit /static//package.json', async () => {
      await request(app.callback())
        .get('/')
        .expect(404);
    });

    it('only support get/head: head', async () => {
      await request(app.callback())
        .head('/static/package.json')
        .set('Accept-Encoding', 'gzip')
        .expect('Content-Type', /json/)
        .expect('Cache-Control', /public, max-age=0/)
        // .expect('Content-Length', file.length)
        .expect('Etag', file.md5)
        .expect('Last-Modified', `${file.mtime}`)
        .expect('vary', 'Accept-Encoding')
        .expect(200)
        .expect(200);
    });

    it('only support get/head, other not support: post', async () => {
      await request(app.callback())
        .post('/')
        .expect(404);
    });

    it('only support get/head, other not support: put', async () => {
      await request(app.callback())
        .put('/')
        .expect(404);
    });

    it('server with prefix and dir, not allow ..', async () => {
      await request(app.callback())
        .get('/static/..')
        .expect(404);
    });

    it('server with prefix and dir, not allow ../..', async () => {
      await request(app.callback())
        .get('/static/../..')
        .expect(404);
    });

    it('server with prefix and dir, should start with dir', async () => {
      await request(app.callback())
        .get('/static/../../package.json')
        .expect(404);
    });

    it('server with prefix and dir, should exist', async () => {
      await request(app.callback())
        .get('/static/package.js')
        .expect(404);
    });

    it('server with prefix and dir, same etag', async () => {
      await request(app.callback())
        .get('/static/package.json')
        .set('etag', file.md5)
        .expect(304);
    });

    it('server with prefix and dir, same last-modified', async () => {
      await request(app.callback())
        .get('/static/package.json')
        .set('Last-Modified', file.mtime.toString())
        .expect(200);
    });

    it('server with prefix and dir, encodeURIComponent and decodeURIComponent', async () => {
      await request(app.callback())
        .get(`/static/__tests__/fixture/${encodeURIComponent('测试文件')}.js`)
        .expect(200);
    });
  });

  describe('with koa-router, path or method not match, then fallback to next middleware', () => {
    const app = new Koa();

    const options = {
      dir: path.join(__dirname, '..'),
    };

    app.use(staticCache('/static', options));

    app.use(get('/health', async (ctx) => {
      ctx.body = {
        name: 'health',
      };
    }));

    app.use(get('/static/package.json', async (ctx) => {
      ctx.body = 'package.json';
    }));

    app.use(post('/static/package.json', async (ctx) => {
      ctx.body = {
        name: 'package.json',
      }
    }));

    it('match path & method, doesnot fallback koa-router:get', async () => {
      await request(app.callback())
        .get(`/static/package.json`)
        .expect(200)
        .then(response => {
          response.body.name.should.equal('@koex/static');
        });
    });

    it('doesnot match path, fallback koa-router', async () => {
      await request(app.callback())
        .get(`/health`)
        .expect(200)
        .then(response => {
          response.body.name.should.equal('health');
        });
    });

    it('doesnot match method, fallback koa-router:post', async () => {
      await request(app.callback())
        .post(`/static/package.json`)
        .expect(200)
        .then(response => {
          response.body.name.should.equal('package.json');
        });
    });
  });
});
