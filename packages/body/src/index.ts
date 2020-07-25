import { Context } from '@koex/core';
import { undefined as isUndef } from '@zcorky/is';
import * as parser from 'co-body';

import {
  formy,
  Options as MultipartOptions,
  Multipart as MultipartReturn,
} from './formy';

declare module '@koex/core' {
  export interface Request {
    body: any;
    rawBody: string;
    files: MultipartReturn['files'];
  }
}

export type SupportType = 'json' | 'form' | 'text' | 'multipart';

export interface Parsed {
  parsed?: any;
  raw?: string;
  files?: MultipartReturn['files'];
}

export interface EnableTypes {
  json?: boolean;
  form?: boolean;
  text?: boolean;
  multipart?: boolean;
}

export interface Options {
  /**
   * custom json request detect function. Default is `null`.
   */
  detectJSON?: (ctx: Context) => boolean;

  /**
   * support custom error handle, if `koa-body` throw an error, you can customize the response like:
   *
   * app.use(bodyParser({
   *  onerror(err, ctx) {
   *    ctx.throw(422, 'body parse error');
   *  },
   * }))
   */
  onerror?: (err: Error, ctx: Context) => void;

  /**
   * parser will only parse when  request type hits enableTypes, default is `['json', 'form']`.
   */
  enableTypes?: SupportType[];

  /**
   * support extend json types.
   * Default is:
   *  application/json
   *  application/json-patch+json
   *  application/vnd.api+json
   *  application/csp-report
   */
  jsonTypes?: string[];

  /**
   * support extend form types.
   * Default is:
   *  application/x-www-form-urlencoded
   */
  formTypes?: string[];

  /**
   * support extend text types.
   * Default is:
   *  text/plain
   */
  textTypes?: string[];

  /**
   * support extend text types.
   * Default is:
   *  multipart
   */
  multipartTypes?: string[];

  /**
   * limit of `json` body. Default is `1mb`.
   */
  jsonLimit?: number | string;

  /**
   * limit of `urlencoded` body. If the body ends up being larger than this limit, a `413` error code is returned.
   * Default is `56kb`.
   */
  formLimit?: number | string;

  /**
   * limit of `text` body. Default is `1mb`.
   */
  textLimit?: number | string;

  /**
   * multipart options
   */
  formidable?: MultipartOptions;

  /**
   * whether return rawBody, then set rawBody to ctx.request, make you can visit ctx.request.rawBody.
   * Default is `true`.
   */
  returnRawBody?: boolean;
}

const DEFAULTS = {
  enableTypes: {
    json: true,
    form: true,
  },
  // Content-Types
  jsonTypes: [
    'application/json',
    'application/json-patch+json',
    'application/vnd.api+json',
    'application/csp-report',
  ],
  formTypes: ['application/x-www-form-urlencoded'],
  textTypes: ['text/plain'],
  multipartTypes: ['multipart/form-data'],
  // raw
  returnRawBody: true,
};

/**
 * Add X-Response-Time header field.
 */
export default (options: Options = {}) => {
  const detectJSON = options.detectJSON;
  const onerror = options.onerror;
  const enableTypes = isUndef(options.enableTypes)
    ? (DEFAULTS.enableTypes as EnableTypes)
    : (toEnable(options.enableTypes) as EnableTypes);

  const jsonTypes = extend(DEFAULTS.jsonTypes, options.jsonTypes);
  const formTypes = extend(DEFAULTS.formTypes, options.formTypes);
  const textTypes = extend(DEFAULTS.textTypes, options.textTypes);
  const multipartTypes = extend(
    DEFAULTS.multipartTypes,
    options.multipartTypes,
  );

  const returnRawBody = options.returnRawBody || DEFAULTS.returnRawBody;

  return async function koexBodyParser(
    ctx: Context,
    next: () => Promise<void>,
  ) {
    if ((ctx.request as any).body !== undefined) return await next();
    if (ctx.disableBodyParser) return await next();
    try {
      const res = await parseBody(ctx);
      (ctx.request as any).body = 'parsed' in res ? res.parsed! : {};
      if (res.raw && isUndef((ctx.request as any).rawBody)) {
        (ctx.request as any).rawBody = res.raw;
      }
      if (res.files && isUndef((ctx.request as any).files)) {
        (ctx.request as any).files = res.files;
      }
    } catch (err) {
      if (onerror) {
        onerror(err, ctx);
      } else {
        throw err;
      }
    }
    await next();
  };

  async function parseBody(ctx: Context): Promise<Parsed> {
    const _options: parser.Options = {
      jsonTypes,
      formTypes,
      textTypes,
      returnRawBody,
    };

    if (
      enableTypes.json &&
      ((detectJSON && detectJSON(ctx)) || ctx.is(jsonTypes))
    ) {
      _options.limit = options.jsonLimit;
      return await parser.json(ctx, _options);
    }

    if (enableTypes.form && ctx.is(formTypes)) {
      _options.limit = options.formLimit;
      return await parser.form(ctx, _options);
    }

    if (enableTypes.text && ctx.is(textTypes)) {
      _options.limit = options.textLimit;
      return await parser.text(ctx, _options);
    }

    if (enableTypes.multipart && ctx.is(multipartTypes)) {
      return await formy(ctx, options.formidable);
    }

    return {} as Parsed;
  }
};

function toEnable<T extends string>(array: T[]) {
  return array.reduce((last, key: string) => ((last[key] = !!key), last), {});
}

function extend<T, V>(defaultS: T[], extendS?: V) {
  if (isUndef(extendS)) {
    return defaultS;
  }

  return [...defaultS, ...(extendS as any)] as T[];
}
