import { Context } from 'koa';
import * as forms from 'formidable';

export interface Options {
  /**
   * sets encoding for incoming form fields
   * Default: utf-8
   */
  encoding?: string | 'utf-8';

  /**
   * the directory for placing file uploads in
   * Default: os.tmpdir()
   *
   * You can move theme later by use fs.rename()
   */
  uploadDir?: string;

  /**
   * To include the extensions of the original files or not
   * Default: false
   */
  keepExtensions?: boolean;

  /**
   * Limit the size of uploaded file
   * Default: 200mb (200 * 1024 * 1024)
   */
  maxFileSize?: number;

  /**
   * Limit the number of fields that the Querystring parser will decode, set o for unlimited.
   * Default: 1000
   */
  maxFields?: number;

  /**
   * Limnit the amount of memory all fields together (except files) can allocate in bytes.
   * Default: 20mb (20 * 1024 * 1024)
   */
  maxFieldsSize?: number;

  /**
   * Include checksums calculated for incoming files, set this to some hash algorithm,
   *   see [crypto.createHash](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options) for available algorithms
   * Default: false
   */
  hash?: string | 'md5' | 'sha1' | 'sha256' | false;

  /**
   * When you call the `.parse` method, the `files` argument
   *  (of the callback) will contain arrays of files fro inputs
   *  which submit multiple files using the HTML5 `multiple` attribute.
   *  Also, the `fields` argument will contain arrays of values for fields that have names ending with '[]'.
   *
   * Default: false
   */
  multiples?: boolean;

  type?: string;

  /**
   * The amount of bytes received for this form so far.
   */
  bytesReceived?: number;

  /**
   * The expected number of bytes in this form.
   */
  bytesExpected?: number;

  onFileBegin?: (filename: string, file: forms.File) => any;
}

export interface Multipart {
  parsed: forms.Fields;
  files: forms.Files;
}

export function formy(ctx: Context, options: Options = {}): Promise<Multipart> {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = {};
    const form: forms.IncomingForm = new (forms as any).IncomingForm(options);
    form
      .on('end', () => {
        return resolve({
          parsed: fields,
          files,
        });
      })
      .on('error', (err: Error) => {
        return reject(err);
      })
      .on('field', (field, value) => {
        if (fields[field]) {
          if (Array.isArray(fields[field])) {
            fields[field].push(value);
          } else {
            fields[field] = [fields[field], value];
          }
        } else {
          fields[field] = value;
        }
      })
      .on('file', (field, file) => {
        if (files[field]) {
          if (Array.isArray(files[field])) {
            files[field].push(file);
          } else {
            files[field] = [files[field], file];
          }
        } else {
          files[field] = file;
        }
      });

    if (options.onFileBegin) {
      form.on('fileBegin', options.onFileBegin);
    }

    form.parse(ctx.req);
  });
}
