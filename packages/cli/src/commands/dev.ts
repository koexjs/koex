// import { CreateCommandParameters, Command } from '@caporal/core';
import { defineSubCommand } from '@cliz/cli';

import * as path from 'path';
import api from '@cliz/core';

const TSCWatchClient = require('tsc-watch/client');
// const run = require('tsc-watch/lib/runner');

export interface IDevOptions {
  port?: string;
  host?: string;
  project?: string;
  entry?: string;
  exec?: string;
}

export async function dev(options?: IDevOptions) {
  const project = options.project ?? process.cwd();

  const { main } = await api.fs.loadJSON(path.resolve(project, 'package.json'));
  const entry = options.entry ?? main;
  const exec = options.exec ?? `node ${path.resolve(project, entry)}`;

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
    exec,
    '--onFailure',
    'echo Beep! Compilation Failed',
  );
}

export default defineSubCommand((createCommand) => {
  return createCommand(
    'Starts the application in development mode (hot-code reloading, error reporting, etc)',
  )
    .option(
      '-p, --port <port>',
      'A port number on which to start the application',
    )
    .option(
      '-h, --host <host>',
      'Hostname on which to start the application (default: 0.0.0.0)',
    )
    .option('--project <project>', 'Project directory')
    .option('-e, --entry <entry>', 'Specify entry')
    .option('--exec <exec>', 'Specify exec command')
    .action(({ options }) => {
      return dev(options);
    });
});
