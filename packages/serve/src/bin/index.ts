#!/usr/bin/env node
// import * as chalk from 'chalk';
// import figlet from 'figlet';
import { resolve } from 'path';
import { Config } from '../type';

import api from '../utils/commannd';
import createApp from '../';

const debug = require('debug')('@koex/serve');

api.program.parse(process.argv);

if (!process.argv.slice(1).length) {
  
  // console.log(chalk.red(
  //   figlet.textSync('strike', { horizontalLayout: 'full' })
  // ));

  api.program.outputHelp();
}

const config: Config = {
  host: api.program.host || process.env.HOST || '0.0.0.0',
  port: api.program.port || process.env.PORT || 9000,
  dir: resolve(api.program.dir || process.env.DIR || process.cwd()),
  cors: !!api.program.cors,
  single: !!api.program.single,
  cache: !!api.program.cache,
  suffix: api.program.suffix,
};


debug(config);

createApp(config);