#!/usr/bin/env zx
import { program } from '@caporal/core';

import dev from './commands/dev';
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
  .option('-d, --dir <dir>', 'Project directory')
  .option('-e, --entry <entry>', 'Specify entry')
  .action(({ options }) => {
    dev(options);
  });

program
  .command(
    'prod',
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
  .option('-d, --dir <dir>', 'Project directory')
  .option('-e, --entry <entry>', 'Specify entry')
  .option('-c, --cpu <cpu>', 'Specify cpu number')
  .action(({ options }) => {
    prod(options);
  });

program.run();
