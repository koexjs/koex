import * as path from 'path';

const TSCWatchClient = require('tsc-watch/client');
// const run = require('tsc-watch/lib/runner');

export interface IDevOptions {
  port?: string;
  host?: string;
  dir?: string;
  entry?: string;
}

export default async function dev(options?: IDevOptions) {
  const dir = options.dir ?? process.cwd();
  const entry = options.entry ?? require(path.join(dir, 'package.json')).main;

  if (options.host) {
    process.env.HOST = options.host;
  }

  if (options.port) {
    process.env.PORT = options.port;
  }

  const watch = new TSCWatchClient();

  watch.on('first_sucess', () => {});

  watch.on('success', () => {});

  watch.on('compile_errors', () => {});

  watch.start(
    '--project',
    dir,
    '--onSuccess',
    `node ${path.join(dir, entry)}`,
    '--onFailure',
    'echo Beep! Compilation Failed',
  );
}