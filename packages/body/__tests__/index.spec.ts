import * as fs from 'fs';
import * as path from 'path';
import Koex, { Context } from '@koex/core';
import onerror from '@koex/onerror';
// import * as router from '@zcorky/koa-router';
import request from 'supertest';

// @TODO
declare module 'koa' {
  export interface Request {
    body: any;
    rawBody: any;
    files: any;
  }
}

import bodyParser, { Options } from '../src';

const fixture = require('./fixtures/raw.json');

function App(options?: Options) {
  const app = new Koex();
  app.use(bodyParser(options));
  return app;
}

describe('koa body', () => {
  describe('json body', () => {
    let app: Koex;

    beforeEach(() => {
      app = App();
    });

    it('should parse json body ok', async () => {
      // should work when use body parser again
      app.use(bodyParser());

      app.use(async (ctx: Context) => {
        expect(ctx.request.body).toEqual({ foo: 'bar' });
        expect(ctx.request.rawBody).toBe('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ foo: 'bar' })
        .expect(200, { foo: 'bar' });
    });

    it('should parse json body with json-api headers ok', async () => {
      app.use(async (ctx: Context) => {
        expect(ctx.request.body).toEqual({ foo: 'bar' });
        expect(ctx.request.rawBody).toEqual('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .set('Accept', 'application/vnd.api+json')
        .set('Content-Type', 'application/vnd.api+json')
        .send('{"foo":"bar"}')
        .expect(200, { foo: 'bar' });
    });

    it('should parse json patch', async () => {
      app.use(async (ctx: Context) => {
        expect(ctx.request.body).toEqual([
          { op: 'add', path: '/foo', value: 'bar' },
        ]);
        expect(ctx.request.rawBody).toBe(
          '[{"op": "add", "path": "/foo", "value": "bar"}]',
        );
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .patch('/')
        .set('Content-Type', 'application/json-patch+json')
        .send('[{"op": "add", "path": "/foo", "value": "bar"}]')
        .expect(200, [{ op: 'add', path: '/foo', value: 'bar' }]);
    });

    it('should json body reach the limit size', async () => {
      const _app = App({
        jsonLimit: 100,
      });

      _app.use(async (ctx: Context) => {
        ctx.body = ctx.request.body;
      });

      await request(_app.callback())
        .post('/')
        .send(fixture)
        .expect(413, 'request entity too large');
    });

    it('should json body error with string in strict mode', async () => {
      const _app = new Koex();
      _app.use(
        onerror({
          log: () => null,
        }),
      );

      _app.use(bodyParser({ jsonLimit: 100 }));

      _app.use(async (ctx: Context) => {
        expect(ctx.request.rawBody).toBe('"invalid"');
        ctx.body = ctx.request.body;
      });

      await request(_app.callback())
        .post('/')
        .set('Content-Type', 'application/json')
        .send('"invalid"')
        .expect(400, {
          message: 'invalid JSON, only supports object and array',
        });
    });
  });

  describe('options.detectJSON', () => {
    it('should parse json body on /foo.json request', async () => {
      const _app = App({
        detectJSON: (ctx) => {
          return /\.json/i.test(ctx.path);
        },
      });

      _app.use(async (ctx: Context) => {
        expect(ctx.request.body).toEqual({ foo: 'bar' });
        expect(ctx.request.rawBody).toBe('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });

      await request(_app.callback())
        .post('/foo.json')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect(200, { foo: 'bar' });
    });

    it('should not parse json body on /foo request', async () => {
      const _app = App({
        detectJSON: (ctx) => {
          return /\.json/i.test(ctx.path);
        },
      });

      _app.use(async (ctx: Context) => {
        expect(ctx.request.type).toBe('application/x-www-form-urlencoded');
        expect(ctx.request.is(['application/x-www-form-urlencoded'])).toBe(
          'application/x-www-form-urlencoded',
        );

        expect(ctx.request.body).toEqual({ '{"foo":"bar"}': '' });
        expect(ctx.request.rawBody).toBe('{"foo":"bar"}');
        ctx.body = ctx.request.body;
      });

      await request(_app.callback())
        .post('/foo')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, { '{"foo":"bar"}': '' });
    });
  });

  describe('form body', () => {
    let app: Koex;

    it('should parse form body ok', async () => {
      app = App();
      app.use(async (ctx: Context) => {
        expect(ctx.get('Content-Type')).toBe(
          'application/x-www-form-urlencoded',
        );
        expect(ctx.request.body).toEqual({ foo: { bar: 'baz' } });
        expect(ctx.request.rawBody).toBe('foo%5Bbar%5D=baz');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('form')
        .send({ foo: { bar: 'baz' } })
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, { foo: { bar: 'baz' } });
    });

    it('should parse form body reach the limit size', async () => {
      app = App({ formLimit: 10 });

      await request(app.callback())
        .post('/')
        .type('form')
        .send({ foo: { bar: 'bazzzzzzzz' } })
        .expect(413, 'request entity too large');
    });
  });

  describe('text body', () => {
    let app: Koex;

    it('should parse text body ok', async () => {
      app = App({
        enableTypes: ['text', 'json'],
      });
      app.use(async (ctx: Context) => {
        expect(ctx.get('Content-Type')).toBe('text/plain');
        expect(ctx.request.body).toBe('body');
        expect(ctx.request.rawBody).toBe('body');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('text')
        .send('body')
        .expect('Content-Type', 'text/plain; charset=utf-8')
        .expect(200, 'body');
    });

    it('should not parse text body when disable', async () => {
      app = App();

      app.use(async (ctx: Context) => {
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('text')
        .send('body')
        .expect(200, {});
    });
  });

  describe('extend type', () => {
    it('should extend json ok', async () => {
      const app = App({
        jsonTypes: ['application/x-javascript'],
      });

      app.use(async (ctx: Context) => {
        expect(ctx.get('Content-Type')).toBe('application/x-javascript');
        expect(ctx.request.type).toBe('application/x-javascript');
        expect(ctx.request.is(['application/x-javascript'])).toBe(
          'application/x-javascript',
        );
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('application/x-javascript')
        .send(JSON.stringify({ foo: 'bar' }))
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200, { foo: 'bar' });
    });
  });

  describe('options.enableTypes', () => {
    it('should disable json success', async () => {
      const app = App({
        enableTypes: ['form'],
      });

      app.use(async (ctx: Context) => {
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .type('json')
        .send({ foo: 'bar' })
        .expect(200, {});
    });
  });

  describe('other type', () => {
    const app = App();

    it('should get body null', async () => {
      app.use(async (ctx: Context) => {
        expect(ctx.request.body).toEqual({});
        ctx.body = ctx.request.body;
      });

      await request(app.callback()).get('/').expect(200, {});
    });
  });

  describe('options.onerror', () => {
    const app = App({
      onerror(err, ctx) {
        ctx.throw(422, 'custom parse error');
      },
    });

    it('should get custom error message', async () => {
      await request(app.callback())
        .post('/')
        .send('test')
        .set('Content-Type', 'application/json')
        .expect(422, 'custom parse error');
    });
  });

  describe('ctx.disableBodyParser', () => {
    it('should not parse body when disableBodyParser set to true', async () => {
      const app = new Koex();
      app.use(async (ctx: Context, next) => {
        ctx.disableBodyParser = true;
        await next();
      });
      app.use(bodyParser());
      app.use(async (ctx: Context) => {
        expect(ctx.request.rawBody).toBe(undefined);
        ctx.body = ctx.request.body ? 'parsed' : 'empty';
      });

      await request(app.callback())
        .post('/')
        .send({ foo: 'bar' })
        .set('Content-Type', 'application/json')
        .expect(200, 'empty');
    });
  });

  describe('ctx.rawBody exist, should not override', () => {
    it('should parse body and should not override rawBody', async () => {
      const app = new Koex();
      app.use(async (ctx: Context, next) => {
        ctx.request.rawBody = 'xxxx';
        await next();
      });
      app.use(bodyParser());
      app.use(async (ctx: Context) => {
        expect(ctx.request.rawBody).toBe('xxxx');
        ctx.body = ctx.request.body;
      });

      await request(app.callback())
        .post('/')
        .send({ foo: 'bar' })
        .set('Content-Type', 'application/json')
        .expect(200, { foo: 'bar' });
    });
  });

  describe('multipart type', () => {
    let database;

    beforeEach(() => {
      database = {
        users: [
          {
            name: 'charlike',
            followers: 10,
          },
          {
            name: 'tunnckocore',
            followers: 20,
          },
        ],
      };
    });

    it('should receive `multipart` requests - fields on .body object', (done) => {
      const app = new Koex();
      app.use(
        bodyParser({
          enableTypes: ['multipart'],
        }),
      );

      app.use(async (ctx: Context, next) => {
        const user = ctx.request.body;

        if (!user) {
          ctx.status = 400;
          return next();
        }

        database.users.push(user);
        ctx.status = 201;

        ctx.body = {
          _files: ctx.request.files,
          user,
        };
      });

      request(app.callback())
        .post('/users')
        .field('name', 'daryl')
        .field('followers', 30)
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          const mostRecentUser = database.users[database.users.length - 1];

          expect(res.body.user).toHaveProperty('name', mostRecentUser.name);
          expect(res.body.user).toHaveProperty(
            'followers',
            mostRecentUser.followers,
          );

          expect(res.body.user).toHaveProperty('name', 'daryl');
          expect(res.body.user).toHaveProperty('followers', '30');

          done();
        });
    });

    it('should receive multiple fields via `multipart` on .body.files object', (done) => {
      const app = new Koex();
      app.use(
        bodyParser({
          enableTypes: ['multipart'],
          formidable: {
            uploadDir: path.join(__dirname, 'temp'),
          },
        }),
      );

      app.use(async (ctx: Context, next) => {
        const user = ctx.request.body;

        if (!user) {
          ctx.status = 400;
          return next();
        }

        database.users.push(user);
        ctx.status = 201;

        ctx.body = {
          _files: ctx.request.files,
          user,
        };
      });

      request(app.callback())
        .post('/users')
        .type('multipart/form-data')
        .field('names', 'John')
        .field('names', 'Paul')
        .attach('firstField', path.join(__dirname, '../package.json'))
        .attach('secondField', path.join(__dirname, '../src/index.ts'))
        .attach('secondField', path.join(__dirname, '../package.json'))
        .attach('thirdField', path.join(__dirname, '../LICENSE'))
        .attach('thirdField', path.join(__dirname, '../README.md'))
        .attach('thirdField', path.join(__dirname, '../package.json'))
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);

          expect(res.body.user.names.length).toBe(2);
          expect(res.body.user.names[0]).toBe('John');
          expect(res.body.user.names[1]).toBe('Paul');
          expect(typeof res.body._files.firstField).toBe('object');
          expect(res.body._files.firstField.name).toBe('package.json');
          expect(fs.statSync(res.body._files.firstField.path)).not.toBeNull();
          fs.unlinkSync(res.body._files.firstField.path);

          // expect(res.body._files.secondField.length).toBe(2);

          // // expect(res.body._files.secondField).toContain([{
          // //   name: 'index.ts',
          // // }]);
          // expect(res.body._files.secondField[0].name).toEqual('index.ts');
          // // expect(res.body._files.secondField).toContainEqual([{
          // //   name: 'package.json',
          // // }]);
          // expect(res.body._files.secondField.map(e => e.name)).toEqual([ 'index.ts', 'package.json' ]);

          // expect(res.body._files.secondField[1].name).toEqual('package.json');
          expect(
            fs.statSync(res.body._files.secondField[0].path),
          ).not.toBeNull();
          expect(
            fs.statSync(res.body._files.secondField[1].path),
          ).not.toBeNull();
          fs.unlinkSync(res.body._files.secondField[0].path);
          fs.unlinkSync(res.body._files.secondField[1].path);

          expect(res.body._files.thirdField.length).toBe(3);

          // expect(res.body._files.thirdField).toContainEqual([{
          //   name: 'LICENSE',
          // }]);
          // expect(res.body._files.thirdField[0].name).toBe('LICENSE');
          // // expect(res.body._files.thirdField).toContainEqual([{
          // //   name: 'README.md',
          // // }]);
          // expect(res.body._files.thirdField[1].name).toBe('README.md');
          // // expect(res.body._files.thirdField).toContainEqual([{
          // //   name: 'package.json',
          // // }]);
          // expect(res.body._files.thirdField[2].name).toBe('package.json');

          // expect(res.body._files.thirdField.map(e => e.name)).toEqual([ 'README.md', 'LICENSE', 'package.json' ]);
          expect(
            fs.statSync(res.body._files.thirdField[0].path),
          ).not.toBeNull();
          fs.unlinkSync(res.body._files.thirdField[0].path);
          expect(
            fs.statSync(res.body._files.thirdField[1].path),
          ).not.toBeNull();
          fs.unlinkSync(res.body._files.thirdField[1].path);
          expect(
            fs.statSync(res.body._files.thirdField[2].path),
          ).not.toBeNull();
          fs.unlinkSync(res.body._files.thirdField[2].path);

          done();
        });
    });
  });
});
