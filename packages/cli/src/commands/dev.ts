import * as path from 'path';

const TSCWatchClient = require('tsc-watch/client');
// const run = require('tsc-watch/lib/runner');

export interface IDevOptions {
  port?: string;
  host?: string;
  project?: string;
  entry?: string;
}

export default async function dev(options?: IDevOptions) {
  const project = options.project ?? process.cwd();
  const entry =
    options.entry ?? require(path.join(project, 'package.json')).main;

  if (options.host) {
    process.env.HOST = options.host;
  }

  if (options.port) {
    process.env.PORT = options.port;
  }

  process.env.NODE_ENV = 'development';

  const watch = new TSCWatchClient();

  watch.on('first_sucess', () => {});

  watch.on('success', () => {});

  watch.on('compile_errors', () => {});

  watch.start(
    '--project',
    project,
    '--onSuccess',
    `node ${path.join(project, entry)}`,
    '--onFailure',
    'echo Beep! Compilation Failed',
  );
}
