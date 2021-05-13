#!/usr/bin/env node
import { program } from '@caporal/core';

import dev from './commands/dev';
import build from './commands/build';
import prod from './commands/prod';

const pkg = require('../package.json');

program.version(pkg.version);

program
  .command(
    'dev',
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
  .action(({ options }) => {
    return dev(options);
  });

program
  .command('build', 'Compiles the application for production deployment')
  .option('-p, --project <project>', 'Project directory')
  .action(({ options }) => {
    return build(options);
  });

program
  .command('prod', 'Starts the application in production mode.')
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
  .option('-c, --cpu <cpu>', 'Specify cpu number')
  .action(({ options }) => {
    return prod(options);
  });

program.run().catch((e) => {});
